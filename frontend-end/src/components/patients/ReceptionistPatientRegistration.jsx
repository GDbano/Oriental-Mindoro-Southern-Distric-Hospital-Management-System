import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, MapPin, Search, UserPlus } from 'lucide-react'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'
import { patientAPI } from '../../services/api'

const debounceMs = 450

const ReceptionistPatientRegistration = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [hospitalNumberPreview, setHospitalNumberPreview] = useState('')
  const [form, setForm] = useState({
    name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    barangay: '',
    municipality: '',
    province: '',
    philhealth_number: '',
    is_indigent: false,
    staff_remarks: '',
  })

  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)
  const [duplicateMatches, setDuplicateMatches] = useState([])
  const [duplicateLoading, setDuplicateLoading] = useState(false)
  const duplicateGateRef = useRef({ lastKey: null, allowed: false })

  const [barangayQuery, setBarangayQuery] = useState('')
  const [barangayResults, setBarangayResults] = useState([])
  const [barangayLoading, setBarangayLoading] = useState(false)
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false)

  const [createdPatient, setCreatedPatient] = useState(null)

  const canCheckDuplicates = useMemo(() => {
    return form.name.trim().length >= 2 && !!form.date_of_birth
  }, [form.name, form.date_of_birth])

  const setField = (key, value) => {
    if (key === 'name' || key === 'date_of_birth') {
      duplicateGateRef.current = { lastKey: null, allowed: false }
    }
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const loadPreview = async () => {
    try {
      const res = await patientAPI.getNextHospitalNumber()
      setHospitalNumberPreview(res.data?.hospital_number || '')
    } catch (e) {
      console.error('Failed to load hospital number preview:', e)
      setHospitalNumberPreview('')
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        await loadPreview()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!canCheckDuplicates) return

    const key = `${form.name.trim().toLowerCase()}|${form.date_of_birth}`
    if (duplicateGateRef.current.lastKey === key) return

    const t = setTimeout(async () => {
      // If receptionist chose to continue for this exact key, do not re-prompt.
      if (duplicateGateRef.current.allowed && duplicateGateRef.current.lastKey === key) {
        return
      }

      try {
        setDuplicateLoading(true)
        const res = await patientAPI.findDuplicates({
          name: form.name.trim(),
          date_of_birth: form.date_of_birth,
        })
        const matches = res.data?.matches || []
        duplicateGateRef.current.lastKey = key

        if (matches.length > 0) {
          setDuplicateMatches(matches)
          setDuplicateModalOpen(true)
        }
      } catch (e) {
        console.error('Duplicate check failed:', e)
      } finally {
        setDuplicateLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(t)
  }, [canCheckDuplicates, form.name, form.date_of_birth])

  useEffect(() => {
    if (!barangayQuery || barangayQuery.trim().length < 2) {
      setBarangayResults([])
      return
    }

    const t = setTimeout(async () => {
      try {
        setBarangayLoading(true)
        const res = await patientAPI.searchBarangays({ q: barangayQuery.trim() })
        setBarangayResults(res.data?.results || [])
      } catch (e) {
        console.error('Barangay search failed:', e)
        setBarangayResults([])
      } finally {
        setBarangayLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(t)
  }, [barangayQuery])

  const selectExistingPatient = (patient) => {
    setDuplicateModalOpen(false)
    navigate(`/dashboard/patients/${patient.id}`)
  }

  const continueNewPatient = () => {
    const key = `${form.name.trim().toLowerCase()}|${form.date_of_birth}`
    duplicateGateRef.current = { lastKey: key, allowed: true }
    setDuplicateModalOpen(false)
  }

  const selectBarangay = (b) => {
    setField('barangay', b.name)
    setField('municipality', b.municipality)
    setField('province', b.province)
    setBarangayQuery(b.name)
    setShowBarangayDropdown(false)
  }

  const save = async () => {
    setError(null)

    if (!form.name.trim()) {
      setError('Full name is required')
      return
    }
    if (!form.date_of_birth) {
      setError('Date of birth is required')
      return
    }
    if (!form.gender) {
      setError('Gender is required')
      return
    }

    if (canCheckDuplicates) {
      const key = `${form.name.trim().toLowerCase()}|${form.date_of_birth}`
      const alreadyAllowed = duplicateGateRef.current.allowed && duplicateGateRef.current.lastKey === key

      if (!alreadyAllowed) {
        try {
          const res = await patientAPI.findDuplicates({
            name: form.name.trim(),
            date_of_birth: form.date_of_birth,
          })
          const matches = res.data?.matches || []
          duplicateGateRef.current.lastKey = key
          duplicateGateRef.current.allowed = matches.length === 0

          if (matches.length > 0) {
            setDuplicateMatches(matches)
            setDuplicateModalOpen(true)
            return
          }
        } catch (e) {
          console.error('Duplicate check failed (save):', e)
        }
      }
    }

    try {
      setSaving(true)
      const res = await patientAPI.staffRegister({
        ...form,
        name: form.name.trim(),
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
        address: form.address?.trim() || null,
        barangay: form.barangay?.trim() || null,
        municipality: form.municipality?.trim() || null,
        province: form.province?.trim() || null,
        philhealth_number: form.philhealth_number?.trim() || null,
      })
      setCreatedPatient(res.data?.patient)
      await loadPreview()
    } catch (e) {
      console.error('Failed to register patient:', e)
      setError(e.response?.data?.message || 'Failed to register patient')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Register Patient (Receptionist)</h1>
            <p className="text-gray-600 mt-2">Staff-assisted patient registration with duplicate detection</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-white border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {createdPatient ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Patient Registered</h2>
                </div>
                <div className="mt-3 text-sm text-gray-700 space-y-1">
                  <div>
                    <span className="text-gray-500">Hospital No.</span>{' '}
                    <span className="font-mono font-semibold">{createdPatient.hospital_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Name</span>{' '}
                    <span className="font-semibold">{createdPatient.user?.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/patients/${createdPatient.id}`)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <ClipboardList className="h-4 w-4" />
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/appointments/book?patient_id=${createdPatient.id}`)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Book Appointment
                </button>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setCreatedPatient(null)
                  setForm({
                    name: '',
                    date_of_birth: '',
                    gender: '',
                    phone: '',
                    email: '',
                    address: '',
                    barangay: '',
                    municipality: '',
                    province: '',
                    philhealth_number: '',
                    is_indigent: false,
                    staff_remarks: '',
                  })
                  duplicateGateRef.current = { lastKey: null, allowed: false }
                  setBarangayQuery('')
                  setBarangayResults([])
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Register another patient
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Number</label>
                <input
                  value={hospitalNumberPreview || 'Auto-generated on save'}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-gray-50 text-gray-700 font-mono"
                />
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_indigent}
                    onChange={(e) => setField('is_indigent', e.target.checked)}
                    className="h-4 w-4"
                  />
                  Indigent (zero billing)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Juan Dela Cruz"
                />
                {duplicateLoading && (
                  <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking duplicates...
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setField('date_of_birth', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select
                  value={form.gender}
                  onChange={(e) => setField('gender', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="09xx..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="patient@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address (House/Street)</label>
                <input
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="House No., Street"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                <div className="relative">
                  <MapPin className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={barangayQuery}
                    onChange={(e) => {
                      setBarangayQuery(e.target.value)
                      setField('barangay', e.target.value)
                      setShowBarangayDropdown(true)
                    }}
                    onFocus={() => setShowBarangayDropdown(true)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type barangay..."
                  />
                </div>

                {showBarangayDropdown && (barangayLoading || barangayResults.length > 0) && (
                  <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                    {barangayLoading ? (
                      <div className="p-3 text-sm text-gray-600 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching...
                      </div>
                    ) : (
                      barangayResults.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => selectBarangay(b)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-sm font-medium text-gray-900">{b.name}</div>
                          <div className="text-xs text-gray-500">{b.municipality}, {b.province}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                <input
                  value={form.municipality}
                  onChange={(e) => setField('municipality', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <input
                  value={form.province}
                  onChange={(e) => setField('province', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PhilHealth Number</label>
                <input
                  value={form.philhealth_number}
                  onChange={(e) => setField('philhealth_number', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="00-123456789-0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (staff only)</label>
                <textarea
                  value={form.staff_remarks}
                  onChange={(e) => setField('staff_remarks', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Staff notes (not visible to patient)"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="px-5 py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Patient'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        title="Possible Duplicate Patient"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-700 mt-0.5" />
            <div>
              <div className="font-semibold text-yellow-900">Similar patient records found</div>
              <div className="text-sm text-yellow-800 mt-1">Select an existing patient or continue creating a new one.</div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Matches
            </div>
            <div className="divide-y">
              {duplicateMatches.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{p.user?.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      DOB: {p.date_of_birth} • {p.hospital_number || '—'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectExistingPatient(p)}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Use This
                  </button>
                </div>
              ))}
              {duplicateMatches.length === 0 && (
                <div className="p-4 text-sm text-gray-600">No matches.</div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDuplicateModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={continueNewPatient}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Continue New Patient
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ReceptionistPatientRegistration
