import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ClipboardList, HeartPulse, FileText, Printer, Save, Lock, FileSignature } from 'lucide-react'
import { appointmentAPI, icd10API, medicalRecordAPI, medicinesAPI, labRequestsAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1
  return age
}

function isAllergyNone(allergies) {
  const a = (allergies || '').trim().toLowerCase()
  return a === '' || a === 'none' || a === 'n/a' || a === 'na'
}

function parseMedicationLines(prescriptionText) {
  if (!prescriptionText) return []
  return String(prescriptionText)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8)
}

function normalizeAllergyTerms(allergies) {
  if (!allergies) return []
  return String(allergies)
    .split(/\n|,/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
}

function medicineTriggersAllergy(allergies, genericName, brandName) {
  const terms = normalizeAllergyTerms(allergies)
  if (!terms.length) return false

  const g = (genericName || '').toString().toLowerCase()
  const b = (brandName || '').toString().toLowerCase()

  const haystack = `${g} ${b}`

  // Basic substring match for common recorded allergies (e.g., "Penicillin").
  for (const t of terms) {
    if (!t) continue
    if (haystack.includes(t)) return true

    // Small heuristics for common classes to reduce false negatives.
    if (t.includes('penicillin') && g.includes('cillin')) return true
    if (t.includes('sulfa') && (g.includes('sulf') || g.includes('sulfa'))) return true
  }

  return false
}

function dosesPerDayForFrequency(freqCode) {
  const f = (freqCode || '').toString().toUpperCase().trim()
  if (f === 'OD') return 1
  if (f === 'BID') return 2
  if (f === 'TID') return 3
  if (f === 'QID') return 4
  return null
}

function calculateQuantity(freqCode, durationDays) {
  const d = Number(durationDays)
  const perDay = dosesPerDayForFrequency(freqCode)
  if (!Number.isFinite(d) || d <= 0) return null
  if (!perDay) return null
  return perDay * d
}

function bmiFrom(heightCm, weightKg) {
  const h = Number.parseFloat(heightCm)
  const w = Number.parseFloat(weightKg)
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null
  const hm = h / 100
  const bmi = w / (hm * hm)
  return Math.round(bmi * 10) / 10
}

const TABS = [
  { key: 'vitals', label: 'Vital Signs', icon: HeartPulse },
  { key: 'soap', label: 'SOAP Notes', icon: FileText },
  { key: 'prescriptions', label: 'Prescriptions', icon: ClipboardList },
  { key: 'labs', label: 'Lab Requests', icon: ClipboardList },
  { key: 'documents', label: 'Documents', icon: FileSignature },
]

function safeParseLabResults(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function formatDxLines(diagnoses) {
  const list = Array.isArray(diagnoses) ? diagnoses : []
  const parts = list
    .map((d) => {
      const code = (d?.code || '').toString().trim()
      const desc = (d?.description || '').toString().trim()
      return [code, desc].filter(Boolean).join(' - ').trim()
    })
    .filter(Boolean)
  return parts.join('\n')
}

function buildSoapSummary(formData, diagnoses) {
  const s1 = (formData?.subjective_chief_complaint || '').trim()
  const s2 = (formData?.subjective_hpi || '').trim()
  const o = (formData?.objective_findings || '').trim()
  const aNotes = (formData?.assessment_notes || '').trim()
  const p1 = (formData?.plan_management || '').trim()
  const p2 = (formData?.plan_follow_up || '').trim()
  const dx = formatDxLines(diagnoses)

  const lines = []
  if (s1) lines.push(`Chief Complaint: ${s1}`)
  if (s2) lines.push(`HPI: ${s2}`)
  if (o) lines.push(`Physical Exam: ${o}`)
  if (dx) lines.push(`Diagnosis: ${dx.replace(/\n/g, '; ')}`)
  if (aNotes) lines.push(`Assessment Notes: ${aNotes}`)
  if (p1) lines.push(`Plan: ${p1}`)
  if (p2) lines.push(`Follow-up: ${p2}`)

  return lines.join('\n')
}

const LAB_TESTS = {
  HEMATOLOGY: ['CBC with platelet', 'Blood Typing & Cross-matching', 'Clotting Time', 'Bleeding Time', 'Peripheral Blood Smear'],
  URINALYSIS: ['Routine Urinalysis', 'Pregnancy Test (HCG)'],
  'BLOOD CHEMISTRY': ['Fasting Blood Sugar', 'HbA1c', 'Lipid Profile', 'Creatinine', 'BUN', 'Uric Acid', 'SGOT', 'SGPT', 'Total Bilirubin'],
  MICROBIOLOGY: ['Gram Stain', 'Culture & Sensitivity', 'AFB Smear', 'KOH'],
  SEROLOGY: ['Dengue NS1/IgG/IgM', 'HBsAg', 'Anti-HCV', 'RPR/VDRL'],
  RADIOLOGY: ['Chest X-ray PA', 'KUB Ultrasound', 'Whole Abdominal Ultrasound'],
}

const DoctorEncounterPage = () => {
  const { appointmentId } = useParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [appointment, setAppointment] = useState(null)
  const [medicalRecord, setMedicalRecord] = useState(null)
  const [patientRecords, setPatientRecords] = useState([])

  const [activeTab, setActiveTab] = useState('vitals')

  const [formData, setFormData] = useState({
    // Vitals
    bp_systolic: '',
    bp_diastolic: '',
    temperature: '',
    pulse_rate: '',
    respiratory_rate: '',
    weight: '',
    height: '',
    oxygen_saturation: '',
    pain_scale: 0,

    // SOAP
    subjective_chief_complaint: '',
    subjective_hpi: '',
    objective_findings: '',
    assessment_notes: '',
    plan_management: '',
    plan_follow_up: '',

    // Legacy compatibility
    notes: '',
    treatment_plan: '',
  })

  const [diagnoses, setDiagnoses] = useState([])
  const [dxQuery, setDxQuery] = useState('')
  const [dxResults, setDxResults] = useState([])
  const [dxLoading, setDxLoading] = useState(false)

  const printRef = useRef(null)
  const rxSearchTimersRef = useRef(new Map())

  const [printMode, setPrintMode] = useState(null) // 'summary' | 'prescription' | 'medical_certificate' | 'referral_letter' | null

  const isFinalized = medicalRecord?.status === 'finalized'

  const patient = appointment?.patient
  const patientName = patient?.user?.name || 'Unknown Patient'
  const patientAge = calculateAge(patient?.date_of_birth)
  const patientSex = patient?.gender || '—'
  const patientBloodType = patient?.blood_type || '—'
  const patientCivilStatus = patient?.civil_status || patient?.civilStatus || '—'

  const allergyAlert = patient?.allergies

  const [prescriptions, setPrescriptions] = useState([])

  const [labSaving, setLabSaving] = useState(false)
  const [labError, setLabError] = useState('')
  const [labSuccess, setLabSuccess] = useState('')
  const [labRequest, setLabRequest] = useState(null)
  const [labForm, setLabForm] = useState({
    urgency: 'routine',
    tests: Object.fromEntries(Object.keys(LAB_TESTS).map((k) => [k, []])),
    specimen: '',
    others: '',
    clinical_notes: '',
  })

  const [documents, setDocuments] = useState(null)
  const [docMode, setDocMode] = useState('medical_certificate')
  const [docError, setDocError] = useState('')
  const [docSuccess, setDocSuccess] = useState('')

  const [medCertForm, setMedCertForm] = useState({
    diagnosis: '',
    findings: '',
    recommendationType: 'unfit',
    daysUnfit: 1,
  })

  const [referralForm, setReferralForm] = useState({
    referredDoctorName: '',
    referredHospitalClinic: '',
    referredSpecialty: '',
    reason: '',
    urgency: 'routine',
    summary: '',
    includeLabResults: {},
  })

  const bmi = useMemo(() => bmiFrom(formData.height, formData.weight), [formData.height, formData.weight])

  const last3Visits = useMemo(() => {
    return (Array.isArray(patientRecords) ? patientRecords : []).slice(0, 3)
  }, [patientRecords])

  const activeMedications = useMemo(() => {
    const records = Array.isArray(patientRecords) ? patientRecords : []
    const latestWithRx = records.find((r) => (r?.prescription || '').trim() !== '')
    return parseMedicationLines(latestWithRx?.prescription)
  }, [patientRecords])

  const load = async () => {
    setError('')
    setLoading(true)

    try {
      const apptRes = await appointmentAPI.get(appointmentId)
      setAppointment(apptRes.data)

      // Latest lab request (if any)
      try {
        const lrRes = await labRequestsAPI.getLatestForAppointment(appointmentId)
        setLabRequest(lrRes.data)
        const tests = lrRes.data?.tests && typeof lrRes.data.tests === 'object' ? lrRes.data.tests : {}
        setLabForm((prev) => ({
          ...prev,
          urgency: lrRes.data?.urgency || 'routine',
          tests: {
            ...Object.fromEntries(Object.keys(LAB_TESTS).map((k) => [k, []])),
            ...tests,
          },
          specimen: lrRes.data?.specimen || '',
          others: lrRes.data?.others || '',
          clinical_notes: lrRes.data?.clinical_notes || '',
        }))
      } catch (e) {
        setLabRequest(null)
      }

      // Existing medical record (if any)
      try {
        const mrRes = await medicalRecordAPI.getByAppointment(appointmentId)
        setMedicalRecord(mrRes.data)

        setFormData((prev) => ({
          ...prev,
          bp_systolic: mrRes.data.bp_systolic ?? '',
          bp_diastolic: mrRes.data.bp_diastolic ?? '',
          temperature: mrRes.data.temperature ?? '',
          pulse_rate: mrRes.data.heart_rate ?? '',
          respiratory_rate: mrRes.data.respiratory_rate ?? '',
          weight: mrRes.data.weight ?? '',
          height: mrRes.data.height ?? '',
          oxygen_saturation: mrRes.data.oxygen_saturation ?? '',
          pain_scale: mrRes.data.pain_scale ?? 0,

          subjective_chief_complaint: mrRes.data.subjective_chief_complaint ?? '',
          subjective_hpi: mrRes.data.subjective_hpi ?? '',
          objective_findings: mrRes.data.objective_findings ?? '',
          assessment_notes: mrRes.data.assessment_notes ?? '',
          plan_management: mrRes.data.plan_management ?? '',
          plan_follow_up: mrRes.data.plan_follow_up ?? '',

          notes: mrRes.data.notes ?? '',
          treatment_plan: mrRes.data.treatment_plan ?? '',
        }))

        if (Array.isArray(mrRes.data.diagnoses)) {
          setDiagnoses(mrRes.data.diagnoses)
        } else {
          setDiagnoses([])
        }

        if (Array.isArray(mrRes.data.prescriptions)) {
          setPrescriptions(
            mrRes.data.prescriptions.map((p) => ({
              key: `${Date.now()}-${Math.random()}`,
              medicine_id: p.medicine_id ?? null,
              generic_name: p.generic_name ?? '',
              brand_name: p.brand_name ?? '',
              dosage: p.dosage ?? '',
              form: p.form ?? '',
              frequency_code: p.frequency_code ?? '',
              frequency_text: p.frequency_text ?? '',
              duration_days: p.duration_days ?? '',
              quantity: p.quantity ?? '',
              quantity_manual: true,
              instructions: p.instructions ?? '',
              stock_quantity: p.stock_quantity ?? null,
              min_stock: p.min_stock ?? null,
              stock_status: p.stock_status ?? null,
              allergy_warning: Boolean(p.allergy_warning),
              allergy_override_confirmed: Boolean(p.allergy_override_confirmed),
              search: '',
              results: [],
              searching: false,
            }))
          )
        } else {
          setPrescriptions([])
        }

        const nextDocs = mrRes.data?.documents && typeof mrRes.data.documents === 'object' ? mrRes.data.documents : null
        setDocuments(nextDocs)

        const dxList = Array.isArray(mrRes.data.diagnoses) ? mrRes.data.diagnoses : []
        const dxText = formatDxLines(dxList)
        const soapForSummary = {
          subjective_chief_complaint: mrRes.data.subjective_chief_complaint ?? '',
          subjective_hpi: mrRes.data.subjective_hpi ?? '',
          objective_findings: mrRes.data.objective_findings ?? '',
          assessment_notes: mrRes.data.assessment_notes ?? '',
          plan_management: mrRes.data.plan_management ?? '',
          plan_follow_up: mrRes.data.plan_follow_up ?? '',
        }

        setMedCertForm((prev) => {
          const doc = nextDocs?.medical_certificate
          const rType = doc?.recommendation?.type === 'fit' ? 'fit' : 'unfit'
          const days = Number(doc?.recommendation?.days_unfit)

          return {
            diagnosis: (doc?.diagnosis ?? prev.diagnosis ?? dxText) || '',
            findings: (doc?.findings ?? prev.findings ?? (mrRes.data.objective_findings ?? '')) || '',
            recommendationType: rType,
            daysUnfit: Number.isFinite(days) && days > 0 ? days : (prev.daysUnfit || 1),
          }
        })

        const labResults = safeParseLabResults(mrRes.data.lab_results)
        setReferralForm((prev) => {
          const doc = nextDocs?.referral_letter
          const included = Array.isArray(doc?.included_lab_results) ? doc.included_lab_results : []
          const includeLabResults = {}
          for (let i = 0; i < labResults.length; i++) {
            const r = labResults[i]
            const found = included.some((x) => x?.test_name === r?.test_name && String(x?.value ?? '') === String(r?.value ?? ''))
            includeLabResults[i] = Boolean(found)
          }

          return {
            referredDoctorName: doc?.referred_to?.doctor_name ?? prev.referredDoctorName ?? '',
            referredHospitalClinic: doc?.referred_to?.hospital_clinic ?? prev.referredHospitalClinic ?? '',
            referredSpecialty: doc?.referred_to?.specialty ?? prev.referredSpecialty ?? '',
            reason: doc?.reason ?? prev.reason ?? '',
            urgency: doc?.urgency === 'urgent' ? 'urgent' : (prev.urgency || 'routine'),
            summary: doc?.summary ?? prev.summary ?? buildSoapSummary(soapForSummary, dxList),
            includeLabResults,
          }
        })
      } catch (e) {
        setMedicalRecord(null)
        setDiagnoses([])
        setPrescriptions([])
        setDocuments(null)
      }

      // Patient history (last visits + meds)
      const patientId = apptRes.data?.patient_id
      if (patientId) {
        const historyRes = await medicalRecordAPI.getPatientRecords(patientId)
        setPatientRecords(Array.isArray(historyRes.data) ? historyRes.data : [])
      } else {
        setPatientRecords([])
      }
    } catch (e) {
      console.error('Failed to load encounter:', e)
      setError(e.response?.data?.message || 'Failed to load encounter data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  useEffect(() => {
    const onAfterPrint = () => setPrintMode(null)
    window.addEventListener('afterprint', onAfterPrint)
    return () => window.removeEventListener('afterprint', onAfterPrint)
  }, [])

  useEffect(() => {
    const q = dxQuery.trim()
    if (!q) {
      setDxResults([])
      return
    }

    let cancelled = false
    setDxLoading(true)

    const t = setTimeout(async () => {
      try {
        const res = await icd10API.search(q)
        if (!cancelled) setDxResults(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        if (!cancelled) setDxResults([])
      } finally {
        if (!cancelled) setDxLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [dxQuery])

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const addDiagnosis = (dx) => {
    const code = (dx?.code || '').trim()
    const description = (dx?.description || '').trim()
    if (!code && !description) return

    setError('')

    if (diagnoses.length >= 6) {
      setError('Maximum 6 diagnoses per encounter')
      setDxQuery('')
      setDxResults([])
      return
    }

    setDiagnoses((prev) => {
      const exists = prev.some((p) => p.code === code)
      if (exists) return prev
      return [...prev, { code, description }]
    })

    setDxQuery('')
    setDxResults([])
  }

  const removeDiagnosis = (code) => {
    setDiagnoses((prev) => prev.filter((d) => d.code !== code))
  }

  const buildPayload = () => {
    const cleanedPrescriptions = prescriptions
      .filter((p) => (p?.medicine_id ? true : (p?.generic_name || '').trim() !== ''))
      .map((p) => ({
        medicine_id: p.medicine_id || null,
        generic_name: (p.generic_name || '').trim(),
        brand_name: (p.brand_name || '').trim() || null,
        dosage: (p.dosage || '').trim() || null,
        form: (p.form || '').trim() || null,
        frequency_code: (p.frequency_code || '').trim() || null,
        frequency_text: (p.frequency_text || '').trim() || null,
        duration_days: p.duration_days === '' ? null : Number(p.duration_days),
        quantity: p.quantity === '' ? null : Number(p.quantity),
        instructions: (p.instructions || '').trim() || null,
        allergy_override_confirmed: Boolean(p.allergy_override_confirmed),
      }))

    const payload = {
      diagnoses,

      prescriptions: cleanedPrescriptions,

      documents: documents || undefined,

      bp_systolic: formData.bp_systolic === '' ? null : Number(formData.bp_systolic),
      bp_diastolic: formData.bp_diastolic === '' ? null : Number(formData.bp_diastolic),
      temperature: formData.temperature === '' ? null : Number(formData.temperature),
      heart_rate: formData.pulse_rate === '' ? null : Number(formData.pulse_rate),
      respiratory_rate: formData.respiratory_rate === '' ? null : Number(formData.respiratory_rate),
      weight: formData.weight === '' ? null : Number(formData.weight),
      height: formData.height === '' ? null : Number(formData.height),
      oxygen_saturation: formData.oxygen_saturation === '' ? null : Number(formData.oxygen_saturation),
      pain_scale: Number(formData.pain_scale),

      subjective_chief_complaint: formData.subjective_chief_complaint || null,
      subjective_hpi: formData.subjective_hpi || null,
      objective_findings: formData.objective_findings || null,
      assessment_notes: formData.assessment_notes || null,
      plan_management: formData.plan_management || null,
      plan_follow_up: formData.plan_follow_up || null,

      // legacy sync
      treatment_plan: formData.plan_management || formData.treatment_plan || null,
      notes: formData.plan_follow_up || formData.notes || null,
    }

    // Keep the API clean
    return Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined))
  }

  const addPrescriptionRow = () => {
    setError('')
    setPrescriptions((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random()}`,
        medicine_id: null,
        generic_name: '',
        brand_name: '',
        dosage: '',
        form: 'tablet',
        frequency_code: 'BID',
        frequency_text: '',
        duration_days: 7,
        quantity: calculateQuantity('BID', 7) ?? '',
        quantity_manual: false,
        instructions: '',
        stock_quantity: null,
        min_stock: null,
        stock_status: null,
        allergy_warning: false,
        allergy_override_confirmed: false,
        search: '',
        results: [],
        searching: false,
      },
    ])
  }

  const removePrescriptionRow = (key) => {
    setPrescriptions((prev) => prev.filter((p) => p.key !== key))
  }

  const updatePrescription = (key, patch) => {
    setPrescriptions((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)))
  }

  const onRxSearchChange = (key, value) => {
    const q = value
    updatePrescription(key, { search: q, searching: Boolean(q.trim()), results: q.trim() ? [] : [] })

    const timers = rxSearchTimersRef.current
    if (timers.has(key)) {
      clearTimeout(timers.get(key))
      timers.delete(key)
    }

    if (!q.trim()) {
      updatePrescription(key, { results: [], searching: false })
      return
    }

    const t = setTimeout(async () => {
      try {
        const res = await medicinesAPI.search(q.trim(), 15)
        const items = Array.isArray(res.data) ? res.data : []
        updatePrescription(key, { results: items, searching: false })
      } catch (e) {
        updatePrescription(key, { results: [], searching: false })
      }
    }, 250)

    timers.set(key, t)
  }

  const onSelectMedicine = (key, med) => {
    if (!med) return

    const generic = med.generic_name || ''
    const brand = med.brand_name || ''
    const allergyRisk = medicineTriggersAllergy(allergyAlert, generic, brand)
    let overrideConfirmed = false

    if (allergyRisk) {
      const ok = window.confirm(`Allergy warning: patient has recorded allergy that may match "${generic}". Override and continue?`)
      if (!ok) return
      overrideConfirmed = true
    }

    setError('')

    setPrescriptions((prev) =>
      prev.map((p) => {
        if (p.key !== key) return p

        const next = {
          ...p,
          medicine_id: med.id,
          generic_name: generic,
          brand_name: brand,
          dosage: p.dosage || med.default_dosage || '',
          form: p.form || med.default_form || 'tablet',
          stock_quantity: med.stock_quantity ?? null,
          min_stock: med.min_stock ?? null,
          stock_status: med.stock_status ?? null,
          allergy_warning: allergyRisk,
          allergy_override_confirmed: overrideConfirmed,
          search: '',
          results: [],
          searching: false,
        }

        if (!next.quantity_manual) {
          const qty = calculateQuantity(next.frequency_code, next.duration_days)
          next.quantity = qty ?? next.quantity
        }

        return next
      })
    )
  }

  const onPrintSummary = () => {
    setPrintMode('summary')
    setTimeout(() => window.print(), 50)
  }

  const onPrintPrescription = () => {
    setPrintMode('prescription')
    setTimeout(() => window.print(), 50)
  }

  const onPrintMedicalCertificate = () => {
    setPrintMode('medical_certificate')
    setTimeout(() => window.print(), 50)
  }

  const onPrintReferralLetter = () => {
    setPrintMode('referral_letter')
    setTimeout(() => window.print(), 50)
  }

  const toggleLabTest = (category, testName) => {
    setLabForm((prev) => {
      const current = Array.isArray(prev.tests?.[category]) ? prev.tests[category] : []
      const exists = current.includes(testName)
      const next = exists ? current.filter((t) => t !== testName) : [...current, testName]
      return {
        ...prev,
        tests: {
          ...prev.tests,
          [category]: next,
        },
      }
    })
  }

  const onSaveLabRequest = async () => {
    setLabError('')
    setLabSuccess('')
    setLabSaving(true)

    try {
      const needsSpecimen = (labForm.tests?.MICROBIOLOGY || []).includes('Culture & Sensitivity')
      if (needsSpecimen && !String(labForm.specimen || '').trim()) {
        setLabError('Please specify specimen for Culture & Sensitivity')
        setLabSaving(false)
        return
      }

      const payload = {
        urgency: labForm.urgency,
        tests: labForm.tests,
        specimen: needsSpecimen ? (labForm.specimen || '').trim() : null,
        others: (labForm.others || '').trim() || null,
        clinical_notes: (labForm.clinical_notes || '').trim() || null,
      }

      const res = await labRequestsAPI.saveForAppointment(appointmentId, payload)
      setLabRequest(res.data)
      setLabSuccess('Lab request saved')
    } catch (e) {
      console.error('Save lab request failed:', e)
      setLabError(e.response?.data?.message || 'Failed to save lab request')
    } finally {
      setLabSaving(false)
    }
  }

  const onSaveDraft = async () => {
    setError('')
    setSaving(true)

    try {
      const payload = buildPayload()
      const res = await medicalRecordAPI.saveDraft(appointmentId, payload)
      setMedicalRecord(res.data)
    } catch (e) {
      console.error('Save draft failed:', e)
      setError(e.response?.data?.message || 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const onFinalize = async () => {
    setError('')
    setSaving(true)

    try {
      const payload = buildPayload()
      const res = await medicalRecordAPI.finalize(appointmentId, payload)
      setMedicalRecord(res.data)
    } catch (e) {
      console.error('Finalize failed:', e)
      setError(e.response?.data?.message || 'Failed to finalize encounter')
    } finally {
      setSaving(false)
    }
  }

  const doctorName = appointment?.doctor?.name || '—'
  const doctorPrc = appointment?.doctor?.license_number || '—'
  const doctorPtr = appointment?.doctor?.ptr_number || '—'
  const patientAddress = patient?.user?.address || '—'

  const hospitalAddressLine = 'Address: ________________________________'

  const examDateLabel = useMemo(() => {
    const raw = appointment?.appointment_date
    if (!raw) return new Date().toLocaleDateString()
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? String(raw).slice(0, 10) : d.toLocaleDateString()
  }, [appointment?.appointment_date])

  const availableLabResults = useMemo(() => {
    return safeParseLabResults(medicalRecord?.lab_results)
  }, [medicalRecord?.lab_results])

  const buildDocumentsPayload = () => {
    const mc = {
      diagnosis: (medCertForm.diagnosis || '').trim() || null,
      findings: (medCertForm.findings || '').trim() || null,
      recommendation: {
        type: medCertForm.recommendationType === 'fit' ? 'fit' : 'unfit',
        days_unfit: medCertForm.recommendationType === 'unfit' ? Number(medCertForm.daysUnfit || 1) : null,
      },
      generated_at: new Date().toISOString().slice(0, 10),
    }

    const includedLabResults = []
    for (let i = 0; i < availableLabResults.length; i++) {
      if (!referralForm.includeLabResults?.[i]) continue
      const r = availableLabResults[i] || {}
      includedLabResults.push({
        test_name: r.test_name ?? null,
        value: r.value ?? null,
        unit: r.unit ?? null,
        normal_range: r.normal_range ?? null,
      })
    }

    const rl = {
      referred_to: {
        doctor_name: (referralForm.referredDoctorName || '').trim() || null,
        hospital_clinic: (referralForm.referredHospitalClinic || '').trim() || null,
        specialty: (referralForm.referredSpecialty || '').trim() || null,
      },
      reason: (referralForm.reason || '').trim() || null,
      summary: (referralForm.summary || '').trim() || null,
      urgency: referralForm.urgency === 'urgent' ? 'urgent' : 'routine',
      included_lab_results: includedLabResults,
      generated_at: new Date().toISOString().slice(0, 10),
    }

    return {
      medical_certificate: mc,
      referral_letter: rl,
    }
  }

  const onGenerateMedicalCertificate = () => {
    setDocError('')
    setDocSuccess('')

    if (!String(medCertForm.diagnosis || '').trim()) {
      setDocError('Please confirm/edit the diagnosis before generating')
      return
    }

    if (medCertForm.recommendationType === 'unfit') {
      const d = Number(medCertForm.daysUnfit)
      if (!Number.isFinite(d) || d <= 0) {
        setDocError('Please set number of days unfit')
        return
      }
    }

    const next = buildDocumentsPayload()
    setDocuments(next)
    setDocSuccess('Medical certificate generated')
  }

  const onGenerateReferralLetter = () => {
    setDocError('')
    setDocSuccess('')

    const hasReferredTo =
      String(referralForm.referredDoctorName || '').trim() ||
      String(referralForm.referredHospitalClinic || '').trim() ||
      String(referralForm.referredSpecialty || '').trim()

    if (!hasReferredTo) {
      setDocError('Please fill at least one "Referred to" field')
      return
    }

    const next = buildDocumentsPayload()
    setDocuments(next)
    setDocSuccess('Referral letter generated')
  }

  const onSaveDocumentsToRecord = async () => {
    setDocError('')
    setDocSuccess('')

    if (isFinalized) {
      setDocError('Encounter is finalized and read-only')
      return
    }

    try {
      setSaving(true)
      const payload = { ...buildPayload(), documents: documents || buildDocumentsPayload() }
      const res = await medicalRecordAPI.saveDraft(appointmentId, payload)
      setMedicalRecord(res.data)
      setDocSuccess('Saved to patient record')
    } catch (e) {
      console.error('Save documents failed:', e)
      setDocError(e.response?.data?.message || 'Failed to save documents')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {/* Print-only content */}
      <div className="hidden print:block" ref={printRef}>
        {printMode === 'prescription' ? (
          <div>
            <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">OMSDH</h1>
              <p className="text-gray-600">Hospital Prescription</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
              <div>
                <p className="text-gray-600">Doctor</p>
                <p className="font-semibold text-gray-900">{doctorName}</p>
                <p className="text-gray-700">PRC: {doctorPrc}</p>
                <p className="text-gray-700">PTR: {doctorPtr}</p>
              </div>
              <div>
                <p className="text-gray-600">Date</p>
                <p className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mb-6 text-sm">
              <p className="text-gray-600">Patient</p>
              <p className="font-semibold text-gray-900">{patientName}</p>
              <p className="text-gray-700">Age: {patientAge ?? '—'}</p>
              <p className="text-gray-700">Address: {patientAddress}</p>
            </div>

            <div className="mb-2 text-lg font-bold">℞</div>

            <div className="space-y-3">
              {prescriptions.length ? (
                prescriptions.map((p) => (
                  <div key={p.key} className="text-sm">
                    <div className="font-semibold text-gray-900">
                      {p.generic_name ? p.generic_name.toUpperCase() : '—'}
                      {p.brand_name ? <span className="font-normal text-gray-700"> ({p.brand_name})</span> : null}
                    </div>
                    <div className="text-gray-800">
                      {[p.dosage, p.form].filter(Boolean).join(' • ')}
                      {p.frequency_code || p.frequency_text ? ` • ${p.frequency_text || p.frequency_code}` : ''}
                      {p.duration_days ? ` • ${p.duration_days} day(s)` : ''}
                      {p.quantity !== '' && p.quantity !== null && p.quantity !== undefined ? ` • Qty: ${p.quantity}` : ''}
                    </div>
                    {p.instructions ? <div className="text-gray-800">Sig: {p.instructions}</div> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-700">No medicines added.</p>
              )}
            </div>

            <div className="mt-10">
              <div className="border-t border-gray-400 pt-2 w-64">
                <p className="text-sm text-gray-700">Doctor Signature</p>
              </div>
            </div>
          </div>
        ) : printMode === 'medical_certificate' ? (
          <div>
            <div className="flex items-start justify-between border-b-2 border-gray-300 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">OMSDH Hospital</h1>
                <p className="text-sm text-gray-600">{hospitalAddressLine}</p>
              </div>
              <div className="border border-gray-300 w-24 h-14 flex items-center justify-center text-xs text-gray-600">LOGO</div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">MEDICAL CERTIFICATE</h2>
            </div>

            <div className="text-sm text-gray-800 space-y-4">
              <div>
                This is to certify that <span className="font-semibold">{patientName}</span> (Age: {patientAge ?? '—'}, Sex: {patientSex}) was examined on <span className="font-semibold">{examDateLabel}</span>.
              </div>

              <div>
                <div className="font-semibold">Diagnosis</div>
                <div className="whitespace-pre-wrap">{documents?.medical_certificate?.diagnosis || medCertForm.diagnosis || '—'}</div>
              </div>

              <div>
                <div className="font-semibold">Findings</div>
                <div className="whitespace-pre-wrap">{documents?.medical_certificate?.findings || medCertForm.findings || '—'}</div>
              </div>

              <div>
                <div className="font-semibold">Recommendation</div>
                {(() => {
                  const reco = documents?.medical_certificate?.recommendation || medCertForm.recommendationType
                  const days = documents?.medical_certificate?.days_unfit ?? medCertForm.daysUnfit
                  if (reco === 'fit') return <div>Fit to work/return to school.</div>
                  return <div>Unfit for work/school for {days} day(s).</div>
                })()}
              </div>

              <div className="mt-8">
                <div className="text-sm text-gray-800">Attending Physician: {doctorName}</div>
                <div className="text-sm text-gray-800">PRC: {doctorPrc} • PTR: {doctorPtr}</div>
                <div className="mt-10 border-t border-gray-400 pt-2 w-72">
                  <p className="text-sm text-gray-700">Signature over printed name</p>
                </div>
              </div>
            </div>
          </div>
        ) : printMode === 'referral_letter' ? (
          <div>
            <div className="flex items-start justify-between border-b-2 border-gray-300 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">OMSDH Hospital</h1>
                <p className="text-sm text-gray-600">{hospitalAddressLine}</p>
              </div>
              <div className="border border-gray-300 w-24 h-14 flex items-center justify-center text-xs text-gray-600">LOGO</div>
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">REFERRAL LETTER</h2>
                <p className="text-sm text-gray-700">Date: {new Date().toLocaleDateString()}</p>
              </div>
              <div className={`text-sm font-semibold ${referralForm.urgency === 'urgent' ? 'text-red-700' : 'text-gray-800'}`}>
                {referralForm.urgency.toUpperCase()}
              </div>
            </div>

            <div className="text-sm text-gray-800 space-y-4">
              <div>
                <div className="font-semibold">To</div>
                <div>{documents?.referral_letter?.referred_doctor_name || referralForm.referredDoctorName || '—'}</div>
                <div>{documents?.referral_letter?.referred_hospital_clinic || referralForm.referredHospitalClinic || '—'}</div>
                <div>{documents?.referral_letter?.referred_specialty || referralForm.referredSpecialty || '—'}</div>
              </div>

              <div>
                <div className="font-semibold">Patient</div>
                <div>{patientName}</div>
                <div>Age/Sex: {patientAge ?? '—'} / {patientSex} • Civil Status: {patientCivilStatus}</div>
              </div>

              <div>
                <div className="font-semibold">Reason for Referral</div>
                <div className="whitespace-pre-wrap">{documents?.referral_letter?.reason || referralForm.reason || '—'}</div>
              </div>

              <div>
                <div className="font-semibold">Summary of Findings</div>
                <div className="whitespace-pre-wrap">{documents?.referral_letter?.summary || referralForm.summary || '—'}</div>
              </div>

              <div>
                <div className="font-semibold">Relevant Lab Results</div>
                {(() => {
                  const included = documents?.referral_letter?.included_lab_results
                  if (Array.isArray(included) && included.length) {
                    return (
                      <ul className="list-disc pl-5">
                        {included.map((r, idx) => (
                          <li key={idx}>{r.test_name || '—'}: {r.value ?? '—'}{r.unit ? ` ${r.unit}` : ''}</li>
                        ))}
                      </ul>
                    )
                  }

                  const selected = availableLabResults
                    .map((r, idx) => ({ r, idx }))
                    .filter((x) => referralForm.includeLabResults?.[x.idx])

                  if (!selected.length) return <div>—</div>
                  return (
                    <ul className="list-disc pl-5">
                      {selected.map(({ r, idx }) => (
                        <li key={idx}>{r.test_name || '—'}: {r.value ?? '—'}{r.unit ? ` ${r.unit}` : ''}</li>
                      ))}
                    </ul>
                  )
                })()}
              </div>

              <div className="mt-8">
                <div className="text-sm text-gray-800">Referring Physician: {doctorName}</div>
                <div className="text-sm text-gray-800">PRC: {doctorPrc} • PTR: {doctorPtr}</div>
                <div className="mt-10 border-t border-gray-400 pt-2 w-72">
                  <p className="text-sm text-gray-700">Signature over printed name</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">ENCOUNTER SUMMARY</h1>
              <p className="text-gray-600">OMSDH Hospital Management System</p>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600">Patient</p>
                <p className="font-semibold text-gray-900">{patientName}</p>
                <p className="text-sm text-gray-700">Age: {patientAge ?? '—'} • Sex: {patientSex} • Blood Type: {patientBloodType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold text-gray-900">{appointment?.appointment_date ? String(appointment.appointment_date).slice(0, 10) : '—'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">Vital Signs</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>BP: {formData.bp_systolic || '—'}/{formData.bp_diastolic || '—'}</div>
                <div>Temp: {formData.temperature || '—'} °C</div>
                <div>Pulse: {formData.pulse_rate || '—'} bpm</div>
                <div>RR: {formData.respiratory_rate || '—'} /min</div>
                <div>O2: {formData.oxygen_saturation || '—'} %</div>
                <div>Pain: {String(formData.pain_scale ?? 0)}/10</div>
                <div>Wt: {formData.weight || '—'} kg</div>
                <div>Ht: {formData.height || '—'} cm</div>
                <div>BMI: {bmi ?? '—'}</div>
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 mb-2">SOAP Notes</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">S - Chief Complaint</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{formData.subjective_chief_complaint || '—'}</p>
                </div>
                <div>
                  <p className="font-medium">S - HPI</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{formData.subjective_hpi || '—'}</p>
                </div>
                <div>
                  <p className="font-medium">O - Physical Exam</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{formData.objective_findings || '—'}</p>
                </div>
                <div>
                  <p className="font-medium">A - Diagnoses</p>
                  <ul className="list-disc pl-5">
                    {diagnoses.length ? diagnoses.map((d) => (
                      <li key={d.code}>{d.code} - {d.description}</li>
                    )) : <li>—</li>}
                  </ul>
                  {formData.assessment_notes ? (
                    <p className="text-gray-800 whitespace-pre-wrap mt-2">{formData.assessment_notes}</p>
                  ) : null}
                </div>
                <div>
                  <p className="font-medium">P - Plan</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{formData.plan_management || '—'}</p>
                  {formData.plan_follow_up ? (
                    <p className="text-gray-800 whitespace-pre-wrap mt-2">Follow-up: {formData.plan_follow_up}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Screen content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* LEFT PANEL */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6 space-y-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{patientName}</h1>
              <p className="text-sm text-gray-600">
                Age: {patientAge ?? '—'} • Sex: {patientSex} • Blood Type: {patientBloodType}
              </p>
            </div>

            {!isAllergyNone(allergyAlert) && (
              <div className="border border-red-300 bg-red-50 rounded-lg p-4">
                <p className="text-red-800 font-bold text-base">ALLERGY ALERT</p>
                <p className="text-red-700 mt-1 whitespace-pre-wrap">{allergyAlert}</p>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Current Active Medications</h2>
              {activeMedications.length ? (
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  {activeMedications.map((m, idx) => (
                    <li key={`${idx}-${m}`}>{m}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">None recorded</p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Last 3 Visits</h2>
              {last3Visits.length ? (
                <div className="space-y-3">
                  {last3Visits.map((r) => (
                    <div key={r.id} className="border border-gray-200 rounded-md p-3">
                      <p className="text-xs text-gray-500">
                        {r?.appointment?.appointment_date
                          ? new Date(r.appointment.appointment_date).toLocaleDateString()
                          : '—'}
                        {r?.appointment?.doctor?.name ? ` • ${r.appointment.doctor.name}` : ''}
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {(r?.diagnosis || '—').toString().slice(0, 120)}
                        {(r?.diagnosis || '').toString().length > 120 ? '…' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No prior visits found</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Encounter</h2>
                <p className="text-sm text-gray-600">
                  Appointment #{appointmentId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isFinalized ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    <Lock className="h-3 w-3" /> Finalized
                  </span>
                ) : (
                  <span className="text-xs text-gray-600">Draft</span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6">
                  {TABS.map((t) => {
                    const active = activeTab === t.key
                    return (
                      <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`py-2 px-1 border-b-2 text-sm font-medium ${
                          active
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {activeTab === 'vitals' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Blood Pressure (Systolic)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.bp_systolic}
                        onChange={(e) => updateField('bp_systolic', e.target.value)}
                        disabled={isFinalized}
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <label className="form-label">Blood Pressure (Diastolic)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.bp_diastolic}
                        onChange={(e) => updateField('bp_diastolic', e.target.value)}
                        disabled={isFinalized}
                        placeholder="80"
                      />
                    </div>

                    <div>
                      <label className="form-label">Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        value={formData.temperature}
                        onChange={(e) => updateField('temperature', e.target.value)}
                        disabled={isFinalized}
                        placeholder="36.6"
                      />
                    </div>
                    <div>
                      <label className="form-label">Pulse Rate (bpm)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.pulse_rate}
                        onChange={(e) => updateField('pulse_rate', e.target.value)}
                        disabled={isFinalized}
                        placeholder="72"
                      />
                    </div>

                    <div>
                      <label className="form-label">Respiratory Rate (/min)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.respiratory_rate}
                        onChange={(e) => updateField('respiratory_rate', e.target.value)}
                        disabled={isFinalized}
                        placeholder="16"
                      />
                    </div>
                    <div>
                      <label className="form-label">O2 Saturation (%)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.oxygen_saturation}
                        onChange={(e) => updateField('oxygen_saturation', e.target.value)}
                        disabled={isFinalized}
                        placeholder="98"
                      />
                    </div>

                    <div>
                      <label className="form-label">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        value={formData.weight}
                        onChange={(e) => updateField('weight', e.target.value)}
                        disabled={isFinalized}
                        placeholder="70"
                      />
                    </div>
                    <div>
                      <label className="form-label">Height (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        value={formData.height}
                        onChange={(e) => updateField('height', e.target.value)}
                        disabled={isFinalized}
                        placeholder="170"
                      />
                    </div>

                    <div>
                      <label className="form-label">BMI</label>
                      <input
                        type="text"
                        className="form-input bg-gray-50"
                        value={bmi ?? ''}
                        disabled
                        placeholder="Auto-calculated"
                      />
                    </div>
                    <div>
                      <label className="form-label">Pain Scale (0-10)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={formData.pain_scale}
                          onChange={(e) => updateField('pain_scale', e.target.value)}
                          disabled={isFinalized}
                          className="w-full"
                        />
                        <span className="text-sm font-semibold text-gray-900 w-10 text-right">
                          {String(formData.pain_scale)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'soap' && (
                <div className="space-y-6">
                  <div>
                    <label className="form-label">S — Chief Complaint</label>
                    <textarea
                      rows={3}
                      className="form-input"
                      value={formData.subjective_chief_complaint}
                      onChange={(e) => updateField('subjective_chief_complaint', e.target.value)}
                      disabled={isFinalized}
                      placeholder="Enter chief complaint..."
                    />
                  </div>

                  <div>
                    <label className="form-label">S — History of Present Illness</label>
                    <textarea
                      rows={4}
                      className="form-input"
                      value={formData.subjective_hpi}
                      onChange={(e) => updateField('subjective_hpi', e.target.value)}
                      disabled={isFinalized}
                      placeholder="Enter HPI..."
                    />
                  </div>

                  <div>
                    <label className="form-label">O — Physical Examination Findings</label>
                    <textarea
                      rows={4}
                      className="form-input"
                      value={formData.objective_findings}
                      onChange={(e) => updateField('objective_findings', e.target.value)}
                      disabled={isFinalized}
                      placeholder="Enter objective findings..."
                    />
                  </div>

                  <div>
                    <label className="form-label">A — Diagnosis (ICD-10)</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="form-input"
                        value={dxQuery}
                        onChange={(e) => setDxQuery(e.target.value)}
                        disabled={isFinalized}
                        placeholder="Search ICD-10 code or description..."
                      />

                      {(dxLoading || (dxResults && dxResults.length > 0)) && !isFinalized && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow">
                          {dxLoading ? (
                            <div className="px-3 py-2 text-sm text-gray-600">Searching…</div>
                          ) : (
                            dxResults.map((dx) => (
                              <button
                                key={dx.code}
                                type="button"
                                onClick={() => addDiagnosis(dx)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                              >
                                <span className="font-semibold text-gray-900">{dx.code}</span>
                                <span className="text-gray-700"> — {dx.description}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {diagnoses.map((d, idx) => {
                        const label = idx === 0 ? 'PRIMARY' : 'SECONDARY'
                        const tooltip = `${d.code} - ${d.description}`
                        return (
                          <span
                            key={d.code}
                            title={tooltip}
                            className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"
                          >
                            <span className="px-1.5 py-0.5 rounded bg-white text-blue-700 text-[10px] font-bold">
                              {label}
                            </span>
                            {d.code}
                            <span className="text-blue-700/80 font-normal truncate max-w-[18rem]">
                              {d.description}
                            </span>
                            {!isFinalized && (
                              <button
                                type="button"
                                onClick={() => removeDiagnosis(d.code)}
                                className="text-blue-700 hover:text-blue-900"
                                aria-label={`Remove diagnosis ${d.code}`}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        )
                      })}
                      {diagnoses.length === 0 && (
                        <span className="text-sm text-gray-600">No diagnoses added</span>
                      )}
                    </div>
                    {!isFinalized && (
                      <p className="mt-2 text-xs text-gray-500">Max 6 diagnoses per encounter.</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">A — Assessment Notes</label>
                    <textarea
                      rows={3}
                      className="form-input"
                      value={formData.assessment_notes}
                      onChange={(e) => updateField('assessment_notes', e.target.value)}
                      disabled={isFinalized}
                      placeholder="Enter assessment notes..."
                    />
                  </div>

                  <div>
                    <label className="form-label">P — Management Plan</label>
                    <textarea
                      rows={4}
                      className="form-input"
                      value={formData.plan_management}
                      onChange={(e) => updateField('plan_management', e.target.value)}
                      disabled={isFinalized}
                      placeholder="Enter management plan..."
                    />
                  </div>

                  <div>
                    <label className="form-label">P — Follow-up Instructions</label>
                    <textarea
                      rows={3}
                      className="form-input"
                      value={formData.plan_follow_up}
                      onChange={(e) => updateField('plan_follow_up', e.target.value)}
                      disabled={isFinalized}
                      placeholder="Enter follow-up instructions..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'prescriptions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Write prescriptions using generic names first (RA 6675).
                      </p>
                      <p className="text-xs text-gray-500">
                        Stock warnings reflect pharmacy inventory.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onPrintPrescription}
                      className="flex items-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Prescription
                    </button>
                  </div>

                  {prescriptions.length === 0 ? (
                    <div className="border border-gray-200 rounded-md p-4 text-sm text-gray-600">
                      No medicines added yet.
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    {prescriptions.map((p, idx) => {
                      const lowOrOut = p.stock_status === 'low_stock' || p.stock_status === 'out_of_stock'
                      const stockLabel =
                        p.stock_status === 'out_of_stock'
                          ? `OUT OF STOCK${p.stock_quantity !== null ? ` (0)` : ''}`
                          : p.stock_status === 'low_stock'
                            ? `LOW STOCK${p.stock_quantity !== null ? ` (${p.stock_quantity})` : ''}`
                            : p.stock_quantity !== null
                              ? `In Stock (${p.stock_quantity})`
                              : ''

                      return (
                        <div key={p.key} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-gray-500">Medicine #{idx + 1}</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {p.generic_name ? p.generic_name : 'Select a medicine'}
                                {p.brand_name ? <span className="font-normal text-gray-700"> ({p.brand_name})</span> : null}
                              </p>
                              {stockLabel ? (
                                <p className={`text-xs mt-1 ${lowOrOut ? 'text-yellow-800' : 'text-gray-600'}`}>
                                  {stockLabel}
                                </p>
                              ) : null}
                            </div>

                            {!isFinalized && (
                              <button
                                type="button"
                                onClick={() => removePrescriptionRow(p.key)}
                                className="text-gray-500 hover:text-gray-900"
                                aria-label="Remove medicine"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          {p.allergy_warning ? (
                            <div className="mt-3 border border-red-200 bg-red-50 rounded-md p-3">
                              <p className="text-sm font-semibold text-red-800">Allergy Warning</p>
                              <p className="text-xs text-red-700 mt-1">
                                Patient has recorded allergy that may match this medicine.
                                {p.allergy_override_confirmed ? ' (Override confirmed)' : ''}
                              </p>
                            </div>
                          ) : null}

                          {lowOrOut ? (
                            <div className="mt-3 border border-yellow-200 bg-yellow-50 rounded-md p-3">
                              <p className="text-sm font-semibold text-yellow-800">Stock Warning</p>
                              <p className="text-xs text-yellow-700 mt-1">
                                {p.stock_status === 'out_of_stock'
                                  ? 'Out of stock.'
                                  : 'Low stock.'}
                              </p>
                            </div>
                          ) : null}

                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="form-label">Medicine (search by generic name)</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  className="form-input"
                                  value={p.search}
                                  onChange={(e) => onRxSearchChange(p.key, e.target.value)}
                                  disabled={isFinalized}
                                  placeholder="Type generic name..."
                                />

                                {(p.searching || (p.results && p.results.length > 0)) && !isFinalized && (
                                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow max-h-64 overflow-auto">
                                    {p.searching ? (
                                      <div className="px-3 py-2 text-sm text-gray-600">Searching…</div>
                                    ) : (
                                      p.results.map((m) => (
                                        <button
                                          key={m.id}
                                          type="button"
                                          onClick={() => onSelectMedicine(p.key, m)}
                                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                        >
                                          <div className="flex items-center justify-between gap-3">
                                            <div>
                                              <span className="font-semibold text-gray-900">{m.generic_name}</span>
                                              {m.brand_name ? <span className="text-gray-700"> ({m.brand_name})</span> : null}
                                              {m.default_dosage ? <span className="text-gray-600"> • {m.default_dosage}</span> : null}
                                              {m.default_form ? <span className="text-gray-600"> • {m.default_form}</span> : null}
                                            </div>
                                            {m.stock_status ? (
                                              <span className="text-xs text-gray-600">
                                                {m.stock_status === 'out_of_stock'
                                                  ? 'Out'
                                                  : m.stock_status === 'low_stock'
                                                    ? 'Low'
                                                    : 'In'}
                                                {m.stock_quantity !== null && m.stock_quantity !== undefined ? ` (${m.stock_quantity})` : ''}
                                              </span>
                                            ) : null}
                                          </div>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="form-label">Dosage</label>
                              <input
                                type="text"
                                className="form-input"
                                value={p.dosage}
                                onChange={(e) => updatePrescription(p.key, { dosage: e.target.value })}
                                disabled={isFinalized}
                                placeholder="e.g. 500mg"
                              />
                            </div>

                            <div>
                              <label className="form-label">Form</label>
                              <select
                                className="form-input"
                                value={p.form}
                                onChange={(e) => updatePrescription(p.key, { form: e.target.value })}
                                disabled={isFinalized}
                              >
                                {['tablet', 'capsule', 'syrup', 'injection', 'topical'].map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="form-label">Frequency</label>
                              <select
                                className="form-input"
                                value={p.frequency_code}
                                onChange={(e) => {
                                  const nextFreq = e.target.value
                                  setPrescriptions((prev) =>
                                    prev.map((row) => {
                                      if (row.key !== p.key) return row
                                      const next = {
                                        ...row,
                                        frequency_code: nextFreq,
                                        frequency_text: nextFreq === 'OTHER' ? row.frequency_text : '',
                                      }
                                      if (!next.quantity_manual) {
                                        const qty = calculateQuantity(next.frequency_code, next.duration_days)
                                        next.quantity = qty ?? next.quantity
                                      }
                                      return next
                                    })
                                  )
                                }}
                                disabled={isFinalized}
                              >
                                {['OD', 'BID', 'TID', 'QID', 'PRN', 'OTHER'].map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              {p.frequency_code === 'OTHER' && (
                                <input
                                  type="text"
                                  className="form-input mt-2"
                                  value={p.frequency_text}
                                  onChange={(e) => updatePrescription(p.key, { frequency_text: e.target.value })}
                                  disabled={isFinalized}
                                  placeholder="Enter frequency..."
                                />
                              )}
                            </div>

                            <div>
                              <label className="form-label">Duration (days)</label>
                              <input
                                type="number"
                                min="1"
                                className="form-input"
                                value={p.duration_days}
                                onChange={(e) => {
                                  const nextDays = e.target.value
                                  setPrescriptions((prev) =>
                                    prev.map((row) => {
                                      if (row.key !== p.key) return row
                                      const next = { ...row, duration_days: nextDays }
                                      if (!next.quantity_manual) {
                                        const qty = calculateQuantity(next.frequency_code, nextDays)
                                        next.quantity = qty ?? next.quantity
                                      }
                                      return next
                                    })
                                  )
                                }}
                                disabled={isFinalized}
                              />
                            </div>

                            <div>
                              <label className="form-label">Quantity</label>
                              <input
                                type="number"
                                min="0"
                                className="form-input"
                                value={p.quantity}
                                onChange={(e) => updatePrescription(p.key, { quantity: e.target.value, quantity_manual: true })}
                                disabled={isFinalized}
                                placeholder="Auto-calculated"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Auto-calculated for OD/BID/TID/QID × days; editable.
                              </p>
                            </div>

                            <div className="md:col-span-2">
                              <label className="form-label">Instructions / Sig</label>
                              <textarea
                                rows={2}
                                className="form-input"
                                value={p.instructions}
                                onChange={(e) => updatePrescription(p.key, { instructions: e.target.value })}
                                disabled={isFinalized}
                                placeholder='e.g. "Take 1 tablet by mouth twice daily after meals"'
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {!isFinalized && (
                    <button
                      type="button"
                      onClick={addPrescriptionRow}
                      className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      + Add Medicine
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'labs' && (
                <div className="space-y-6">
                  {labError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                      {labError}
                    </div>
                  )}
                  {labSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                      {labSuccess}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Laboratory Request</h3>
                      <p className="text-sm text-gray-600">Select tests by category, set urgency, and add clinical notes for MedTech.</p>
                      {labRequest?.status ? (
                        <p className="text-xs text-gray-500 mt-1">
                          Status: <span className="font-semibold">{labRequest.status}</span>
                          {labRequest.requested_at ? ` • Requested: ${new Date(labRequest.requested_at).toLocaleString()}` : ''}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Urgency</label>
                        <select
                          className={`form-input ${labForm.urgency === 'stat' ? 'border-red-300 text-red-700 bg-red-50' : ''}`}
                          value={labForm.urgency}
                          onChange={(e) => setLabForm((p) => ({ ...p, urgency: e.target.value }))}
                          disabled={isFinalized}
                        >
                          <option value="routine">Routine</option>
                          <option value="stat">STAT</option>
                        </select>
                      </div>
                      {!isFinalized && (
                        <button
                          type="button"
                          onClick={onSaveLabRequest}
                          disabled={labSaving}
                          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {labSaving ? 'Saving…' : 'Save Request'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {Object.entries(LAB_TESTS).map(([category, tests]) => (
                      <div key={category} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">{category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {tests.map((t) => {
                            const checked = (labForm.tests?.[category] || []).includes(t)
                            const label = category === 'MICROBIOLOGY' && t === 'Culture & Sensitivity'
                              ? 'Culture & Sensitivity (specify specimen)'
                              : t

                            return (
                              <label key={t} className="flex items-start gap-2 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  className="mt-1"
                                  checked={checked}
                                  onChange={() => toggleLabTest(category, t)}
                                  disabled={isFinalized}
                                />
                                <span>{label}</span>
                              </label>
                            )
                          })}
                        </div>

                        {category === 'MICROBIOLOGY' && (labForm.tests?.MICROBIOLOGY || []).includes('Culture & Sensitivity') && (
                          <div className="mt-4">
                            <label className="form-label">Specimen (for Culture & Sensitivity)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={labForm.specimen}
                              onChange={(e) => setLabForm((p) => ({ ...p, specimen: e.target.value }))}
                              disabled={isFinalized}
                              placeholder="e.g. urine, sputum, wound swab"
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    <div>
                      <label className="form-label">Others (free text)</label>
                      <textarea
                        rows={3}
                        className="form-input"
                        value={labForm.others}
                        onChange={(e) => setLabForm((p) => ({ ...p, others: e.target.value }))}
                        disabled={isFinalized}
                        placeholder="Any test not in the list..."
                      />
                    </div>

                    <div>
                      <label className="form-label">Clinical Notes for MedTech (optional)</label>
                      <textarea
                        rows={3}
                        className="form-input"
                        value={labForm.clinical_notes}
                        onChange={(e) => setLabForm((p) => ({ ...p, clinical_notes: e.target.value }))}
                        disabled={isFinalized}
                        placeholder="Enter clinical notes..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-6">
                  {docError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                      {docError}
                    </div>
                  )}
                  {docSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                      {docSuccess}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Document Generator</h3>
                      <p className="text-sm text-gray-600">Preview before printing. Saved documents are stored in the patient record for this encounter.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Document</label>
                      <select
                        className="form-input"
                        value={docMode}
                        onChange={(e) => setDocMode(e.target.value)}
                      >
                        <option value="medical_certificate">Medical Certificate</option>
                        <option value="referral_letter">Referral Letter</option>
                      </select>

                      <button
                        type="button"
                        onClick={onSaveDocumentsToRecord}
                        disabled={saving || isFinalized}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        title={isFinalized ? 'Encounter is finalized and read-only' : 'Save documents to patient record (draft)'}
                      >
                        {saving ? 'Saving…' : 'Save to Record'}
                      </button>
                    </div>
                  </div>

                  {docMode === 'medical_certificate' ? (
                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Patient</div>
                            <div className="text-sm font-semibold text-gray-900">{patientName}</div>
                            <div className="text-xs text-gray-600">Age/Sex: {patientAge ?? '—'} / {patientSex}</div>
                            <div className="text-xs text-gray-600">Civil Status: {patientCivilStatus}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Date of Examination</div>
                            <div className="text-sm font-semibold text-gray-900">{examDateLabel}</div>
                            <div className="text-xs text-gray-600">Doctor: {doctorName} • PRC: {doctorPrc} • PTR: {doctorPtr}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Diagnosis (confirm/edit)</label>
                        <textarea
                          rows={4}
                          className="form-input"
                          value={medCertForm.diagnosis}
                          onChange={(e) => setMedCertForm((p) => ({ ...p, diagnosis: e.target.value }))}
                          disabled={isFinalized}
                          placeholder="Diagnosis from ICD-10 assessment..."
                        />
                      </div>

                      <div>
                        <label className="form-label">Findings (from Physical Examination)</label>
                        <textarea
                          rows={4}
                          className="form-input"
                          value={medCertForm.findings}
                          onChange={(e) => setMedCertForm((p) => ({ ...p, findings: e.target.value }))}
                          disabled={isFinalized}
                          placeholder="Physical examination findings..."
                        />
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="text-sm font-semibold text-gray-900 mb-3">Recommendation</div>
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="radio"
                              name="mc_reco"
                              checked={medCertForm.recommendationType === 'unfit'}
                              onChange={() => setMedCertForm((p) => ({ ...p, recommendationType: 'unfit' }))}
                              disabled={isFinalized}
                            />
                            Unfit for work/school
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">for</span>
                            <input
                              type="number"
                              min={1}
                              max={365}
                              className="form-input w-24"
                              value={medCertForm.daysUnfit}
                              onChange={(e) => setMedCertForm((p) => ({ ...p, daysUnfit: e.target.value }))}
                              disabled={isFinalized || medCertForm.recommendationType !== 'unfit'}
                            />
                            <span className="text-sm text-gray-700">day(s)</span>
                          </div>
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="radio"
                              name="mc_reco"
                              checked={medCertForm.recommendationType === 'fit'}
                              onChange={() => setMedCertForm((p) => ({ ...p, recommendationType: 'fit' }))}
                              disabled={isFinalized}
                            />
                            Fit to work/return to school
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {!isFinalized && (
                          <button
                            type="button"
                            onClick={onGenerateMedicalCertificate}
                            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Generate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onPrintMedicalCertificate}
                          className="px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800"
                        >
                          Preview & Print
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="text-sm font-semibold text-gray-900 mb-3">Preview</div>
                        <div className="text-sm text-gray-800 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-lg font-bold">OMSDH Hospital</div>
                              <div className="text-xs text-gray-600">{hospitalAddressLine}</div>
                            </div>
                            <div className="border border-gray-300 w-20 h-12 flex items-center justify-center text-[10px] text-gray-600">LOGO</div>
                          </div>

                          <div className="mt-2"><span className="font-semibold">Patient:</span> {patientName}</div>
                          <div><span className="font-semibold">Age/Sex:</span> {patientAge ?? '—'} / {patientSex}</div>
                          <div><span className="font-semibold">Civil Status:</span> {patientCivilStatus}</div>
                          <div><span className="font-semibold">Date of Examination:</span> {examDateLabel}</div>

                          <div className="mt-3">
                            <div className="font-semibold">Diagnosis</div>
                            <div className="whitespace-pre-wrap">{(documents?.medical_certificate?.diagnosis || medCertForm.diagnosis || '—')}</div>
                          </div>

                          <div className="mt-2">
                            <div className="font-semibold">Findings</div>
                            <div className="whitespace-pre-wrap">{(documents?.medical_certificate?.findings || medCertForm.findings || '—')}</div>
                          </div>

                          <div className="mt-2">
                            <div className="font-semibold">Recommendation</div>
                            {(medCertForm.recommendationType === 'fit') ? (
                              <div>Fit to work/return to school.</div>
                            ) : (
                              <div>Unfit for work/school for {medCertForm.daysUnfit} day(s).</div>
                            )}
                          </div>

                          <div className="mt-4">
                            <div className="text-xs text-gray-600">Doctor: {doctorName} • PRC: {doctorPrc} • PTR: {doctorPtr}</div>
                            <div className="mt-6 border-t border-gray-300 w-64 pt-1 text-xs text-gray-600">Signature</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Referring Doctor</div>
                            <div className="text-sm font-semibold text-gray-900">{doctorName}</div>
                            <div className="text-xs text-gray-600">PRC: {doctorPrc} • PTR: {doctorPtr}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Patient</div>
                            <div className="text-sm font-semibold text-gray-900">{patientName}</div>
                            <div className="text-xs text-gray-600">Age/Sex: {patientAge ?? '—'} / {patientSex} • Civil Status: {patientCivilStatus}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="form-label">Referred To - Doctor Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={referralForm.referredDoctorName}
                            onChange={(e) => setReferralForm((p) => ({ ...p, referredDoctorName: e.target.value }))}
                            disabled={isFinalized}
                            placeholder="Doctor name"
                          />
                        </div>
                        <div>
                          <label className="form-label">Hospital/Clinic</label>
                          <input
                            type="text"
                            className="form-input"
                            value={referralForm.referredHospitalClinic}
                            onChange={(e) => setReferralForm((p) => ({ ...p, referredHospitalClinic: e.target.value }))}
                            disabled={isFinalized}
                            placeholder="Hospital/Clinic"
                          />
                        </div>
                        <div>
                          <label className="form-label">Specialty</label>
                          <input
                            type="text"
                            className="form-input"
                            value={referralForm.referredSpecialty}
                            onChange={(e) => setReferralForm((p) => ({ ...p, referredSpecialty: e.target.value }))}
                            disabled={isFinalized}
                            placeholder="Specialty"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Reason for Referral</label>
                        <textarea
                          rows={4}
                          className="form-input"
                          value={referralForm.reason}
                          onChange={(e) => setReferralForm((p) => ({ ...p, reason: e.target.value }))}
                          disabled={isFinalized}
                          placeholder="Reason for referral..."
                        />
                      </div>

                      <div>
                        <label className="form-label">Summary of Findings (auto-pulled from SOAP)</label>
                        <textarea
                          rows={6}
                          className="form-input"
                          value={referralForm.summary}
                          onChange={(e) => setReferralForm((p) => ({ ...p, summary: e.target.value }))}
                          disabled={isFinalized}
                          placeholder="Summary of findings..."
                        />
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm font-semibold text-gray-900">Relevant Lab Results</div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Urgency</label>
                            <select
                              className={`form-input ${referralForm.urgency === 'urgent' ? 'border-red-300 text-red-700 bg-red-50' : ''}`}
                              value={referralForm.urgency}
                              onChange={(e) => setReferralForm((p) => ({ ...p, urgency: e.target.value }))}
                              disabled={isFinalized}
                            >
                              <option value="routine">Routine</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>
                        </div>

                        {availableLabResults.length === 0 ? (
                          <div className="text-sm text-gray-600 mt-3">No finalized lab results available.</div>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {availableLabResults.map((r, idx) => (
                              <label key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  className="mt-1"
                                  checked={Boolean(referralForm.includeLabResults?.[idx])}
                                  onChange={() =>
                                    setReferralForm((p) => ({
                                      ...p,
                                      includeLabResults: {
                                        ...p.includeLabResults,
                                        [idx]: !p.includeLabResults?.[idx],
                                      },
                                    }))
                                  }
                                  disabled={isFinalized}
                                />
                                <span>
                                  <span className="font-medium">{r.test_name || '—'}</span>: {r.value ?? '—'}{r.unit ? ` ${r.unit}` : ''}
                                  {r.normal_range ? <span className="text-xs text-gray-500"> (NR: {r.normal_range})</span> : null}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {!isFinalized && (
                          <button
                            type="button"
                            onClick={onGenerateReferralLetter}
                            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Generate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onPrintReferralLetter}
                          className="px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800"
                        >
                          Preview & Print
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="text-sm font-semibold text-gray-900 mb-3">Preview</div>
                        <div className="text-sm text-gray-800 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-lg font-bold">OMSDH Hospital</div>
                              <div className="text-xs text-gray-600">{hospitalAddressLine}</div>
                            </div>
                            <div className="border border-gray-300 w-20 h-12 flex items-center justify-center text-[10px] text-gray-600">LOGO</div>
                          </div>

                          <div className="text-xs text-gray-600">Referring Doctor: {doctorName} • PRC: {doctorPrc} • PTR: {doctorPtr}</div>
                          <div className="text-xs text-gray-600">Urgency: <span className={referralForm.urgency === 'urgent' ? 'text-red-700 font-semibold' : 'font-semibold'}>{referralForm.urgency.toUpperCase()}</span></div>

                          <div className="mt-2"><span className="font-semibold">Patient:</span> {patientName}</div>
                          <div><span className="font-semibold">Age/Sex:</span> {patientAge ?? '—'} / {patientSex}</div>
                          <div><span className="font-semibold">Civil Status:</span> {patientCivilStatus}</div>

                          <div className="mt-3">
                            <div className="font-semibold">Referred To</div>
                            <div>{referralForm.referredDoctorName || '—'}</div>
                            <div className="text-gray-700">{referralForm.referredHospitalClinic || '—'}</div>
                            <div className="text-gray-700">{referralForm.referredSpecialty || '—'}</div>
                          </div>

                          <div className="mt-2">
                            <div className="font-semibold">Reason for Referral</div>
                            <div className="whitespace-pre-wrap">{referralForm.reason || '—'}</div>
                          </div>

                          <div className="mt-2">
                            <div className="font-semibold">Summary of Findings</div>
                            <div className="whitespace-pre-wrap">{referralForm.summary || '—'}</div>
                          </div>

                          <div className="mt-2">
                            <div className="font-semibold">Relevant Lab Results</div>
                            {availableLabResults.filter((_, idx) => referralForm.includeLabResults?.[idx]).length ? (
                              <ul className="list-disc pl-5">
                                {availableLabResults
                                  .map((r, idx) => ({ r, idx }))
                                  .filter((x) => referralForm.includeLabResults?.[x.idx])
                                  .map(({ r, idx }) => (
                                    <li key={idx}>{r.test_name || '—'}: {r.value ?? '—'}{r.unit ? ` ${r.unit}` : ''}</li>
                                  ))}
                              </ul>
                            ) : (
                              <div>—</div>
                            )}
                          </div>

                          <div className="mt-4">
                            <div className="mt-6 border-t border-gray-300 w-64 pt-1 text-xs text-gray-600">Signature</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom action bar */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-gray-500">
                  {medicalRecord?.finalized_at
                    ? `Finalized: ${new Date(medicalRecord.finalized_at).toLocaleString()}`
                    : medicalRecord?.updated_at
                      ? `Last saved: ${new Date(medicalRecord.updated_at).toLocaleString()}`
                      : ''}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onSaveDraft}
                    disabled={saving || isFinalized}
                    className="flex items-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </button>

                  <button
                    type="button"
                    onClick={onFinalize}
                    disabled={saving || isFinalized}
                    className="flex items-center px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <LoadingSpinner size="small" text="" />
                    ) : (
                      'Finalize Encounter'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onPrintSummary}
                    className="flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorEncounterPage
