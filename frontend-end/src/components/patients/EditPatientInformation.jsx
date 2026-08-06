import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Edit3, History, Loader2, Save, ShieldAlert } from 'lucide-react'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'
import { patientAPI, userAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const ROLE_ALLOWED = new Set(['staff', 'records_officer', 'admin'])

const formatDisplay = (val) => {
  if (val === null || val === undefined || val === '') return '—'
  return String(val)
}

const normalize = (val) => {
  if (val === undefined) return null
  if (val === null) return null
  if (typeof val === 'string') {
    const t = val.trim()
    return t === '' ? null : t
  }
  return val
}

const EditPatientInformation = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [patient, setPatient] = useState(null)
  const [original, setOriginal] = useState(null)
  const [form, setForm] = useState(null)

  const [historyLoading, setHistoryLoading] = useState(false)
  const [history, setHistory] = useState([])

  const [reviewOpen, setReviewOpen] = useState(false)
  const [success, setSuccess] = useState(null)

  const allowed = ROLE_ALLOWED.has(user?.role)

  const formatRole = (role) => {
    if (role === 'staff') return 'Receptionist'
    if (role === 'records_officer') return 'Records Officer'
    if (role === 'admin') return 'Admin'
    return 'Staff'
  }

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const loadPatient = async () => {
    const res = await userAPI.getPatients({ patient_id: Number(patientId) })
    const found = res.data?.patients?.[0] || res.data?.data?.[0] || res.data?.[0]
    if (!found) throw new Error('Patient not found')
    return found
  }

  const toForm = (p) => {
    return {
      hospital_number: p.hospital_number || '',

      // Personal
      name: p.user?.name || '',
      date_of_birth: p.date_of_birth ? String(p.date_of_birth).slice(0, 10) : '',
      gender: p.gender || '',
      civil_status: p.civil_status || '',
      blood_type: p.blood_type || '',

      // Address
      address: p.user?.address || '',
      barangay: p.barangay || '',
      municipality: p.municipality || '',
      province: p.province || '',

      // Contact
      email: p.user?.email || '',
      phone: p.user?.phone || '',

      // Insurance
      philhealth_number: p.philhealth_number || '',
      philhealth_membership_type: p.philhealth_membership_type || '',

      // Gov IDs
      pwd_id_number: p.pwd_id_number || '',
      senior_citizen_id_number: p.senior_citizen_id_number || '',
    }
  }

  const loadHistory = async () => {
    try {
      setHistoryLoading(true)
      const res = await patientAPI.getDemographicsAuditLogs(patientId, { limit: 50 })
      setHistory(res.data?.logs || [])
    } catch (e) {
      console.error('Failed to load demographics audit logs:', e)
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        setSuccess(null)

        const p = await loadPatient()
        setPatient(p)
        const o = toForm(p)
        setOriginal(o)
        setForm(o)

        await loadHistory()
      } catch (e) {
        console.error('Failed to load patient:', e)
        setError(e.response?.data?.message || e.message || 'Failed to load patient')
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const changes = useMemo(() => {
    if (!original || !form) return []

    const meta = [
      { key: 'name', label: 'Name' },
      { key: 'date_of_birth', label: 'Date of birth' },
      { key: 'gender', label: 'Sex' },
      { key: 'civil_status', label: 'Civil status' },
      { key: 'blood_type', label: 'Blood type' },
      { key: 'address', label: 'Address' },
      { key: 'barangay', label: 'Barangay' },
      { key: 'municipality', label: 'Municipality' },
      { key: 'province', label: 'Province' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'philhealth_number', label: 'PhilHealth number' },
      { key: 'philhealth_membership_type', label: 'PhilHealth membership type' },
      { key: 'pwd_id_number', label: 'PWD ID' },
      { key: 'senior_citizen_id_number', label: 'Senior Citizen ID' },
    ]

    return meta
      .map((m) => {
        const from = normalize(original[m.key])
        const to = normalize(form[m.key])
        const same = String(from ?? '') === String(to ?? '')
        return same ? null : { ...m, from, to }
      })
      .filter(Boolean)
  }, [original, form])

  const submit = async () => {
    if (!form) return
    if (changes.length === 0) {
      setError('No changes detected')
      setReviewOpen(false)
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const payload = {
        name: form.name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        civil_status: form.civil_status,
        blood_type: form.blood_type,
        address: form.address,
        barangay: form.barangay,
        municipality: form.municipality,
        province: form.province,
        email: form.email,
        phone: form.phone,
        philhealth_number: form.philhealth_number,
        philhealth_membership_type: form.philhealth_membership_type,
        pwd_id_number: form.pwd_id_number,
        senior_citizen_id_number: form.senior_citizen_id_number,
      }

      const res = await patientAPI.updateDemographics(patientId, payload)
      const changed = res.data?.changed || []

      setSuccess({
        message: res.data?.message || 'Updated successfully',
        changed,
      })

      // Refresh patient + history
      const p = await loadPatient()
      setPatient(p)
      const o = toForm(p)
      setOriginal(o)
      setForm(o)
      await loadHistory()

      setReviewOpen(false)
    } catch (e) {
      console.error('Failed to update demographics:', e)
      setError(e.response?.data?.message || 'Failed to update patient information')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (!allowed) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="h-5 w-5" />
              <div className="font-semibold">Unauthorized</div>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              Only receptionist, records officer, or admin can edit patient demographics.
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!patient || !form) {
    return <div className="p-6 text-red-700">Patient not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">Edit Patient Information</h1>
            <p className="text-sm text-gray-600 mt-1">Demographics only (medical records cannot be edited here)</p>
          </div>

          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Review & Save
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-white border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-white border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              {success.message}
            </div>
            <div className="mt-2 text-sm text-gray-700">
              {success.changed.length > 0 ? (
                <div>
                  <div className="font-semibold">Changes saved:</div>
                  <div className="mt-2 space-y-1">
                    {success.changed.map((c, idx) => (
                      <div key={idx}>
                        {c.label} changed from {formatDisplay(c.from)} to {formatDisplay(c.to)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>No changes detected.</div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Number (permanent)</label>
                  <input
                    value={form.hospital_number}
                    readOnly
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-gray-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                  <input
                    value={form.civil_status}
                    onChange={(e) => setField('civil_status', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Single / Married / ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                  <input
                    value={form.blood_type}
                    onChange={(e) => setField('blood_type', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="O+"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    value={form.address}
                    onChange={(e) => setField('address', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                  <input
                    value={form.barangay}
                    onChange={(e) => setField('barangay', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Insurance / PhilHealth</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PhilHealth Number</label>
                  <input
                    value={form.philhealth_number}
                    onChange={(e) => setField('philhealth_number', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
                  <input
                    value={form.philhealth_membership_type}
                    onChange={(e) => setField('philhealth_membership_type', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Member / Dependent / ..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Government IDs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PWD ID</label>
                  <input
                    value={form.pwd_id_number}
                    onChange={(e) => setField('pwd_id_number', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senior Citizen ID</label>
                  <input
                    value={form.senior_citizen_id_number}
                    onChange={(e) => setField('senior_citizen_id_number', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Change History</h2>
                </div>
                <button
                  type="button"
                  onClick={loadHistory}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Refresh
                </button>
              </div>

              {historyLoading ? (
                <div className="mt-4 text-sm text-gray-600 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : history.length === 0 ? (
                <div className="mt-4 text-sm text-gray-600">No changes logged yet.</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {history.map((h) => {
                    const label = h.changes?.label || 'Field'
                    const from = formatDisplay(h.changes?.from)
                    const to = formatDisplay(h.changes?.to)
                    const actorName = h.user?.name || 'Unknown'
                    const actorRole = formatRole(h.user?.role)
                    const when = h.performed_at ? new Date(h.performed_at).toLocaleString() : ''
                    return (
                      <div key={h.id} className="border border-gray-200 rounded-xl p-3">
                        <div className="text-sm font-semibold text-gray-900">
                          {label} changed from {from} to {to}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          by {actorRole} {actorName}{when ? ` on ${when}` : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={reviewOpen} onClose={() => setReviewOpen(false)} title="Review Changes" size="lg">
        <div className="space-y-4">
          {changes.length === 0 ? (
            <div className="text-sm text-gray-700">No changes detected.</div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-50 text-xs font-semibold text-gray-600">
                <div className="px-4 py-2">Field</div>
                <div className="px-4 py-2">Current</div>
                <div className="px-4 py-2">New</div>
              </div>
              <div className="divide-y">
                {changes.map((c) => (
                  <div key={c.key} className="grid grid-cols-3">
                    <div className="px-4 py-3 text-sm text-gray-900 font-medium">{c.label}</div>
                    <div className="px-4 py-3 text-sm text-gray-700">{formatDisplay(c.from)}</div>
                    <div className="px-4 py-3 text-sm text-gray-700">{formatDisplay(c.to)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600">Are you sure you want to update this patient's information?</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EditPatientInformation
