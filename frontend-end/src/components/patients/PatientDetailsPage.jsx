import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  User, Phone, Printer, Plus, AlertTriangle, Heart, Users, Activity,
  BarChart3, CreditCard, AlertCircle, Edit2, Save, X, ChevronDown,
  Calendar, ShoppingCart, Pill, Zap, ArrowLeft
} from 'lucide-react'
import { userAPI, appointmentAPI, medicalRecordAPI, labRequestsAPI } from '../../services/api'
import { formatDate, calculateAge } from '../../utils/helpers'
import LoadingSpinner from '../common/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'

const PatientDetailsPage = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [medicalRecords, setMedicalRecords] = useState([])
  const [activeTab, setActiveTab] = useState('demographics')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({})

  const [pendingLabRequests, setPendingLabRequests] = useState([])
  const [pendingLabsLoading, setPendingLabsLoading] = useState(false)
  const [pendingLabsError, setPendingLabsError] = useState('')

  useEffect(() => {
    loadPatientData()
  }, [patientId])

  useEffect(() => {
    const loadPendingLabs = async () => {
      if (activeTab !== 'labs') return
      if (!patient?.id) return

      try {
        setPendingLabsLoading(true)
        setPendingLabsError('')
        const res = await labRequestsAPI.getPendingForPatient(patient.id)
        setPendingLabRequests(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        console.error('Failed to load pending lab requests:', e)
        setPendingLabsError(e.response?.data?.message || 'Failed to load pending lab requests')
        setPendingLabRequests([])
      } finally {
        setPendingLabsLoading(false)
      }
    }

    loadPendingLabs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, patient?.id])

  const loadPatientData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Try to fetch the specific patient by ID
      try {
        // First try to get patient data directly
        const patientRes = await userAPI.getPatients({ patient_id: patientId })
        const patientData = patientRes.data?.data?.[0] || patientRes.data?.[0]
        
        if (!patientData) throw new Error('Patient not found')
        
        setPatient(patientData)

        // Fetch appointments and medical records in parallel
        const [appointmentsRes] = await Promise.all([
          appointmentAPI.getAll({ patient_id: patientData.id }).catch(() => ({ data: [] })),
        ])

        setAppointments(appointmentsRes.data?.data || appointmentsRes.data || [])

        // Try to get medical records
        try {
          const recordsRes = await medicalRecordAPI.getPatientRecords(patientData.id)
          setMedicalRecords(recordsRes.data?.data || recordsRes.data || [])
        } catch (err) {
          console.log('Could not load medical records:', err)
        }

        // Initialize form data
        if (patientData) {
          setEditFormData({
            name: patientData.user?.name || '',
            email: patientData.user?.email || '',
            phone: patientData.user?.phone || '',
            date_of_birth: patientData.date_of_birth || '',
            gender: patientData.gender || '',
            blood_type: patientData.blood_type || '',
            allergies: patientData.allergies || '',
            medical_history: patientData.medical_history || '',
            emergency_contact_name: patientData.emergency_contact_name || '',
            emergency_contact_phone: patientData.emergency_contact_phone || '',
            insurance_info: patientData.insurance_info || ''
          })
        }
      } catch (innerErr) {
        setError('Failed to load patient data')
        console.error('Error loading patient:', innerErr)
      }
    } catch (err) {
      setError('Failed to load patient data')
      console.error('Error loading patient:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdits = async () => {
    try {
      // Update patient profile
      await userAPI.update(patient.user.id, editFormData)
      setEditing(false)
      await loadPatientData()
    } catch (err) {
      setError('Failed to save changes')
      console.error('Error saving:', err)
    }
  }

  const handleNewAppointment = () => {
    navigate(`/dashboard/appointments/new?patient_id=${patientId}`)
  }

  const handleNewEncounter = () => {
    // This would typically navigate to a new encounter/visit creation page
    console.log('New encounter for patient:', patientId)
  }

  const handlePrintIDCard = () => {
    window.print()
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="p-4 text-red-600">{error}</div>
  if (!patient) return <div className="p-4">Patient not found</div>

  const age = patient.date_of_birth ? calculateAge(patient.date_of_birth) : 'N/A'
  const initials = patient.user?.name?.[0]?.toUpperCase() || 'P'
  const hospitalNumber = patient.hospital_number || `HN${String(patient.id).padStart(6, '0')}`

  // Get PhilHealth status
  const philhealthStatus = patient.insurance_info?.includes('PhilHealth') 
    ? 'Member' 
    : patient.insurance_info?.includes('Indigent')
    ? 'Indigent'
    : 'None'

  const hasAllergies = patient.allergies && patient.allergies !== 'None' && patient.allergies.length > 0
  const allergy_items = hasAllergies ? patient.allergies.split(',').map(a => a.trim()) : []

  const summarizePendingTests = (tests, specimen) => {
    if (!tests || typeof tests !== 'object') return []
    const lines = []
    for (const [category, items] of Object.entries(tests)) {
      const list = Array.isArray(items) ? items.filter(Boolean) : []
      if (list.length === 0) continue
      const extra = category === 'MICROBIOLOGY' && list.includes('Culture & Sensitivity') && specimen
        ? ` (Specimen: ${specimen})`
        : ''
      lines.push(`${category}: ${list.join(', ')}${extra}`)
    }
    return lines
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* ============ SIDEBAR ============ */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 shadow-sm flex flex-col">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4 text-white text-4xl font-bold">
            {initials}
          </div>
          
          {/* Hospital Number - Scannable & Large */}
          <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 mb-4 text-center">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Hospital Number
            </div>
            <div className="font-mono text-2xl font-bold text-gray-900 tracking-widest">
              {hospitalNumber}
            </div>
          </div>
        </div>

        {/* Patient Basic Info */}
        <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Name</p>
            <p className="text-lg font-bold text-gray-900">{patient.user?.name}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Age</p>
              <p className="text-lg font-semibold text-gray-900">{age} yrs</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Sex</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{patient.gender}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Blood Type</p>
            <p className="text-lg font-bold text-red-600">{patient.blood_type}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Contact</p>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-gray-400" />
              <p className="text-sm text-gray-900">{patient.user?.phone}</p>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
          {/* PhilHealth Status */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">PhilHealth</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              philhealthStatus === 'Member' ? 'bg-green-100 text-green-800' :
              philhealthStatus === 'Indigent' ? 'bg-amber-100 text-amber-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {philhealthStatus}
            </span>
          </div>

          {/* PWD & Senior Badges */}
          <div className="flex gap-2 flex-wrap">
            {patient.is_pwd && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                <Users size={14} /> PWD
              </span>
            )}
            {patient.is_senior && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                <Heart size={14} /> Senior
              </span>
            )}
            {patient.is_pregnant && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-semibold">
                <Heart size={14} /> Pregnant
              </span>
            )}
          </div>
        </div>

        {/* Allergy Alerts */}
        {hasAllergies && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
              <p className="text-sm font-bold text-red-700">ALLERGIES</p>
            </div>
            <div className="space-y-2">
              {allergy_items.map((allergy, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-red-50 rounded border-l-2 border-red-500">
                  <AlertCircle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium text-red-800">{allergy}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="space-y-2 mt-auto">
          <button
            onClick={handleNewAppointment}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            New Appointment
          </button>
          <button
            onClick={handleNewEncounter}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            <Activity size={18} />
            New Encounter
          </button>
          <button
            onClick={handlePrintIDCard}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            <Printer size={18} />
            Print ID Card
          </button>
        </div>
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'demographics', label: 'Demographics', icon: User },
              { id: 'visits', label: 'Visit History', icon: Calendar },
              { id: 'medications', label: 'Active Medications', icon: Pill },
              { id: 'labs', label: 'Lab Results', icon: BarChart3 },
              { id: 'billing', label: 'Billing History', icon: CreditCard },
              { id: 'allergies', label: 'Allergies & Alerts', icon: AlertCircle }
            ].map(tab => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <TabIcon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Demographics Tab */}
            {activeTab === 'demographics' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Patient Demographics</h3>
                  {['staff', 'records_officer', 'admin'].includes(currentUser?.role) && (
                    <button
                      onClick={() => navigate(`/dashboard/patients/${patient.id}/edit`)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                    >
                      <Edit2 size={16} />
                      Edit Info
                    </button>
                  )}
                </div>

                <ViewDemographicsInfo patient={patient} editFormData={editFormData} />
              </div>
            )}

            {/* Visit History Tab */}
            {activeTab === 'visits' && (
              <div>
                <h3 className="text-xl font-bold mb-6">Visit History</h3>
                <VisitHistoryTable appointments={appointments} />
              </div>
            )}

            {/* Active Medications Tab */}
            {activeTab === 'medications' && (
              <div>
                <h3 className="text-xl font-bold mb-6">Active Medications</h3>
                <ActiveMedicationsTable medicalRecords={medicalRecords} />
              </div>
            )}

            {/* Lab Results Tab */}
            {activeTab === 'labs' && (
              <div>
                <h3 className="text-xl font-bold mb-6">Lab Results</h3>

                <div className="mb-8">
                  <h4 className="text-lg font-bold mb-3">Pending Lab Results</h4>

                  {pendingLabsError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {pendingLabsError}
                    </div>
                  )}

                  {pendingLabsLoading ? (
                    <div className="p-4 bg-white border border-gray-200 rounded">
                      <LoadingSpinner />
                    </div>
                  ) : pendingLabRequests.length === 0 ? (
                    <div className="p-4 bg-white border border-gray-200 rounded text-sm text-gray-600">
                      No pending lab requests.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingLabRequests.map((req) => {
                        const urgency = req?.urgency || 'routine'
                        const requestedAt = req?.requested_at ? new Date(req.requested_at) : null
                        const requestedLabel = requestedAt && !Number.isNaN(requestedAt.getTime())
                          ? requestedAt.toLocaleString()
                          : '—'
                        const lines = summarizePendingTests(req?.tests, req?.specimen)

                        return (
                          <div key={req?.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-gray-900">Request #{req?.id || '—'}</span>
                                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${urgency === 'stat' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {urgency.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-500">Requested: {requestedLabel}</span>
                                </div>
                                {req?.appointment?.doctor?.name && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    Doctor: <span className="font-medium">{req.appointment.doctor.name}</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">Status: {req?.status || 'pending'}</div>
                            </div>

                            {lines.length > 0 && (
                              <div className="mt-3 text-sm text-gray-800 space-y-1">
                                {lines.map((line, idx) => (
                                  <div key={idx}>{line}</div>
                                ))}
                              </div>
                            )}

                            {(req?.others || req?.clinical_notes) && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs font-semibold text-gray-500">Others</div>
                                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{req?.others || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-gray-500">Clinical Notes</div>
                                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{req?.clinical_notes || '—'}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <LabResultsTable medicalRecords={medicalRecords} />
              </div>
            )}

            {/* Billing History Tab */}
            {activeTab === 'billing' && (
              <div>
                <h3 className="text-xl font-bold mb-6">Billing History</h3>
                <BillingHistoryTable appointments={appointments} />
              </div>
            )}

            {/* Allergies & Alerts Tab */}
            {activeTab === 'allergies' && (
              <div>
                <h3 className="text-xl font-bold mb-6">Allergies & Alerts</h3>
                <AllergiesAlertsView patient={patient} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ COMPONENT SECTIONS ============

const ViewDemographicsInfo = ({ patient, editFormData }) => (
  <div className="grid grid-cols-2 gap-6">
    <InfoField label="Full Name" value={editFormData.name} />
    <InfoField label="Email" value={editFormData.email} />
    <InfoField label="Phone" value={editFormData.phone} />
    <InfoField label="Date of Birth" value={editFormData.date_of_birth} />
    <InfoField label="Age" value={calculateAge(editFormData.date_of_birth)} />
    <InfoField label="Gender" value={editFormData.gender} />
    <InfoField label="Blood Type" value={editFormData.blood_type} />
    <InfoField label="Insurance Info" value={editFormData.insurance_info} />
    <InfoField label="Emergency Contact" value={editFormData.emergency_contact_name} />
    <InfoField label="Emergency Phone" value={editFormData.emergency_contact_phone} />
    <div className="col-span-2">
      <InfoField label="Allergies" value={editFormData.allergies} />
    </div>
    <div className="col-span-2">
      <InfoField label="Medical History" value={editFormData.medical_history} />
    </div>
  </div>
)

const EditDemographicsForm = ({ data, setData }) => (
  <div className="grid grid-cols-2 gap-6">
    <FormField
      label="Full Name"
      value={data.name}
      onChange={(val) => setData({ ...data, name: val })}
    />
    <FormField
      label="Email"
      value={data.email}
      onChange={(val) => setData({ ...data, email: val })}
    />
    <FormField
      label="Phone"
      value={data.phone}
      onChange={(val) => setData({ ...data, phone: val })}
    />
    <FormField
      label="Date of Birth"
      type="date"
      value={data.date_of_birth}
      onChange={(val) => setData({ ...data, date_of_birth: val })}
    />
    <FormField
      label="Gender"
      value={data.gender}
      onChange={(val) => setData({ ...data, gender: val })}
    />
    <FormField
      label="Blood Type"
      value={data.blood_type}
      onChange={(val) => setData({ ...data, blood_type: val })}
    />
    <FormField
      label="Insurance Info"
      value={data.insurance_info}
      onChange={(val) => setData({ ...data, insurance_info: val })}
    />
    <FormField
      label="Emergency Contact Name"
      value={data.emergency_contact_name}
      onChange={(val) => setData({ ...data, emergency_contact_name: val })}
    />
    <FormField
      label="Emergency Contact Phone"
      value={data.emergency_contact_phone}
      onChange={(val) => setData({ ...data, emergency_contact_phone: val })}
    />
    <div className="col-span-2">
      <FormField
        label="Allergies"
        value={data.allergies}
        onChange={(val) => setData({ ...data, allergies: val })}
      />
    </div>
    <div className="col-span-2">
      <FormField
        label="Medical History"
        value={data.medical_history}
        onChange={(val) => setData({ ...data, medical_history: val })}
      />
    </div>
  </div>
)

const InfoField = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
    <p className="text-sm text-gray-900 font-medium">{value || 'N/A'}</p>
  </div>
)

const FormField = ({ label, value, onChange, type = 'text' }) => (
  <div>
    <label className="text-xs font-semibold text-gray-700 uppercase mb-2 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
)

const VisitHistoryTable = ({ appointments }) => {
  if (appointments.length === 0) {
    return <div className="text-center p-8 text-gray-500">No appointments found</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Doctor</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Department</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Queue</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((apt, idx) => (
            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-4 py-3">{formatDate(apt.appointment_date)}</td>
              <td className="px-4 py-3">{apt.doctor?.name || 'N/A'}</td>
              <td className="px-4 py-3">{apt.department?.name || 'N/A'}</td>
              <td className="px-4 py-3">{apt.appointment_type?.name || 'N/A'}</td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                  apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                  apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  apt.status === 'no-show' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {apt.status}
                </span>
              </td>
              <td className="px-4 py-3 font-mono font-bold">{apt.queue_number || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const ActiveMedicationsTable = ({ medicalRecords }) => {
  const medications = medicalRecords.flatMap(record => 
    record.medications?.map(med => ({ ...med, recordId: record.id })) || []
  )

  if (medications.length === 0) {
    return <div className="text-center p-8 text-gray-500">No active medications</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Medication</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Dosage</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Frequency</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Start Date</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {medications.map((med, idx) => (
            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{med.name}</td>
              <td className="px-4 py-3">{med.dosage}</td>
              <td className="px-4 py-3">{med.frequency}</td>
              <td className="px-4 py-3">{formatDate(med.start_date)}</td>
              <td className="px-4 py-3">
                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                  Active
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const LabResultsTable = ({ medicalRecords }) => {
  const labResults = medicalRecords.flatMap(record =>
    record.lab_results?.map(result => ({ ...result, recordId: record.id })) || []
  )

  if (labResults.length === 0) {
    return <div className="text-center p-8 text-gray-500">No lab results available</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Test Name</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Result</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Unit</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Normal Range</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {labResults.map((result, idx) => {
            const isAbnormal = result.is_abnormal || result.status === 'abnormal'
            return (
              <tr key={idx} className={`border-b border-gray-200 ${isAbnormal ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-3 font-medium">{result.test_name}</td>
                <td className={`px-4 py-3 font-bold ${isAbnormal ? 'text-red-700' : 'text-gray-900'}`}>
                  {result.value}
                </td>
                <td className="px-4 py-3">{result.unit}</td>
                <td className="px-4 py-3 text-xs">{result.normal_range}</td>
                <td className="px-4 py-3">
                  {isAbnormal ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                      <AlertCircle size={14} />
                      Abnormal
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                      Normal
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const BillingHistoryTable = ({ appointments }) => {
  if (appointments.length === 0) {
    return <div className="text-center p-8 text-gray-500">No billing records found</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((apt, idx) => (
            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-4 py-3">{formatDate(apt.appointment_date)}</td>
              <td className="px-4 py-3">{apt.appointment_type?.name} - {apt.department?.name}</td>
              <td className="px-4 py-3 text-right font-semibold">₱{(apt.amount || 0).toLocaleString()}</td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                  apt.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                  apt.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {apt.payment_status || 'Unpaid'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const AllergiesAlertsView = ({ patient }) => {
  const allergies = patient.allergies?.split(',').map(a => a.trim()) || []
  const alerts = []

  if (patient.is_senior) alerts.push({ type: 'Senior Citizen', severity: 'info', icon: Heart })
  if (patient.is_pwd) alerts.push({ type: 'PWD', severity: 'info', icon: Users })
  if (patient.is_pregnant) alerts.push({ type: 'Pregnant', severity: 'warning', icon: Heart })
  if (allergies.length > 0) alerts.push({ type: `${allergies.length} Known Allergies`, severity: 'danger', icon: AlertTriangle })

  return (
    <div className="space-y-4">
      {/* Known Allergies */}
      {allergies.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <h4 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Known Allergies
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allergies.map((allergy, idx) => (
              <div key={idx} className="bg-white border-l-4 border-red-500 p-4 rounded">
                <p className="font-semibold text-gray-900">{allergy}</p>
                <p className="text-sm text-red-600 mt-1">⚠️ Confirm before prescribing</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Alerts */}
      <div>
        <h4 className="text-lg font-bold text-gray-900 mb-4">Clinical Alerts</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert, idx) => {
            const AlertIcon = alert.icon
            const bgColor = alert.severity === 'danger' ? 'bg-red-50 border-red-200' :
                           alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                           'bg-blue-50 border-blue-200'
            const textColor = alert.severity === 'danger' ? 'text-red-900' :
                            alert.severity === 'warning' ? 'text-yellow-900' :
                            'text-blue-900'
            
            return (
              <div key={idx} className={`border rounded-lg p-4 ${bgColor}`}>
                <div className="flex items-center gap-3">
                  <AlertIcon size={20} className={textColor} />
                  <p className={`font-semibold ${textColor}`}>{alert.type}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PatientDetailsPage
