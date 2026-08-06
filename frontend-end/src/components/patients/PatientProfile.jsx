import React, { useState, useEffect } from 'react'
import { User, Phone, Mail, Calendar, MapPin, Edit, Save, X, FileText, Clock } from 'lucide-react'
import { userAPI, appointmentAPI, medicalRecordAPI } from '../../services/api'
import { formatDate, calculateAge, formatDateTime } from '../../utils/helpers'
import LoadingSpinner from '../common/LoadingSpinner'
import PatientMedicalHistory from '../medical/PatientMedicalHistory'

const PatientProfile = ({ patientId, onBack }) => {
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [medicalRecords, setMedicalRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [formData, setFormData] = useState({})

  useEffect(() => {
    if (patientId) {
      loadPatientData()
    }
  }, [patientId])

  const loadPatientData = async () => {
    try {
      setLoading(true)
      const [patientRes, appointmentsRes] = await Promise.all([
        userAPI.getPatients({ search: patientId }), // This would need adjustment for single patient
        appointmentAPI.getAll({ patient_id: patientId })
      ])

      // For demo purposes, using the first patient from search
      const patientData = patientRes.data.data?.[0] || patientRes.data?.[0]
      setPatient(patientData)
      setAppointments(appointmentsRes.data)

      if (patientData) {
        setFormData({
          name: patientData.user?.name || '',
          email: patientData.user?.email || '',
          phone: patientData.user?.phone || '',
          address: patientData.user?.address || '',
          date_of_birth: patientData.date_of_birth || '',
          gender: patientData.gender || '',
          blood_type: patientData.blood_type || '',
          allergies: patientData.allergies || '',
          medical_history: patientData.medical_history || '',
          insurance_info: patientData.insurance_info || '',
          emergency_contact_name: patientData.emergency_contact_name || '',
          emergency_contact_phone: patientData.emergency_contact_phone || ''
        })

        // Load medical records
        const recordsRes = await medicalRecordAPI.getPatientRecords(patientData.id)
        setMedicalRecords(recordsRes.data)
      }
    } catch (error) {
      console.error('Error loading patient data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Update patient logic here
      console.log('Saving patient data:', formData)
      setEditing(false)
      // You would typically call an API to update the patient here
    } catch (error) {
      console.error('Error saving patient:', error)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: patient.user?.name || '',
      email: patient.user?.email || '',
      phone: patient.user?.phone || '',
      address: patient.user?.address || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || '',
      blood_type: patient.blood_type || '',
      allergies: patient.allergies || '',
      medical_history: patient.medical_history || '',
      insurance_info: patient.insurance_info || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || ''
    })
    setEditing(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!patient) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Not Found</h3>
        <p className="text-gray-600">The requested patient could not be found.</p>
        {onBack && (
          <button onClick={onBack} className="btn-primary mt-4">
            Back to Patients
          </button>
        )}
      </div>
    )
  }

  const user = patient.user
  const age = calculateAge(patient.date_of_birth)
  const upcomingAppointments = appointments.filter(apt => 
    ['scheduled', 'confirmed'].includes(apt.status)
  )
  const pastAppointments = appointments.filter(apt => 
    ['completed', 'cancelled'].includes(apt.status)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-xl">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">Patient ID: {patient.id}</p>
                <p className="text-sm text-gray-500">
                  Member since {formatDate(patient.created_at)}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back to List
                </button>
              )}
              {editing ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-primary flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {['overview', 'medical', 'appointments', 'documents'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'overview' ? 'Profile Overview' :
                 tab === 'medical' ? 'Medical History' :
                 tab === 'appointments' ? 'Appointments' :
                 'Documents'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Full Name</label>
                    {editing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="form-input"
                      />
                    ) : (
                      <p className="text-gray-900">{user.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">Email Address</label>
                    {editing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-input"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Phone Number</label>
                    {editing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="form-input"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Date of Birth</label>
                    {editing ? (
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        className="form-input"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">
                          {patient.date_of_birth ? formatDate(patient.date_of_birth) : 'Not provided'}
                          {age && ` (${age} years)`}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Gender</label>
                    {editing ? (
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="form-input"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900 capitalize">{patient.gender || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Blood Type</label>
                    {editing ? (
                      <input
                        type="text"
                        name="blood_type"
                        value={formData.blood_type}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="e.g., O+"
                      />
                    ) : (
                      <p className="text-gray-900">{patient.blood_type || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label">Address</label>
                    {editing ? (
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        className="form-input"
                      />
                    ) : (
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <p className="text-gray-900">{user.address || 'Not provided'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Medical Information</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Allergies</label>
                    {editing ? (
                      <textarea
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        rows="3"
                        className="form-input"
                        placeholder="List any known allergies..."
                      />
                    ) : (
                      <p className="text-gray-900">{patient.allergies || 'No known allergies'}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Medical History</label>
                    {editing ? (
                      <textarea
                        name="medical_history"
                        value={formData.medical_history}
                        onChange={handleChange}
                        rows="4"
                        className="form-input"
                        placeholder="Describe relevant medical history..."
                      />
                    ) : (
                      <p className="text-gray-900">{patient.medical_history || 'No significant medical history'}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Insurance Information</label>
                    {editing ? (
                      <input
                        type="text"
                        name="insurance_info"
                        value={formData.insurance_info}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Insurance provider and policy number"
                      />
                    ) : (
                      <p className="text-gray-900">{patient.insurance_info || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Emergency Contact</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Contact Name</label>
                    {editing ? (
                      <input
                        type="text"
                        name="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={handleChange}
                        className="form-input"
                      />
                    ) : (
                      <p className="text-gray-900">{patient.emergency_contact_name || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Contact Phone</label>
                    {editing ? (
                      <input
                        type="tel"
                        name="emergency_contact_phone"
                        value={formData.emergency_contact_phone}
                        onChange={handleChange}
                        className="form-input"
                      />
                    ) : (
                      <p className="text-gray-900">{patient.emergency_contact_phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2">
                  <span className="text-gray-600">Total Appointments</span>
                  <span className="font-semibold text-gray-900">{appointments.length}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-gray-600">Upcoming</span>
                  <span className="font-semibold text-blue-600">{upcomingAppointments.length}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-gray-600">Medical Records</span>
                  <span className="font-semibold text-green-600">{medicalRecords.length}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-gray-600">Age</span>
                  <span className="font-semibold text-gray-900">{age || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Appointments</h3>
              <div className="space-y-3">
                {appointments.slice(0, 3).map(appointment => (
                  <div key={appointment.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Dr. {appointment.doctor?.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDateTime(appointment.appointment_date)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
                {appointments.length === 0 && (
                  <p className="text-gray-500 text-sm text-center">No appointments</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('medical')}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-4 w-4 text-blue-600 mb-1" />
                  <span className="font-medium text-blue-600">View Medical History</span>
                  <p className="text-sm text-gray-600">Access complete health records</p>
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Clock className="h-4 w-4 text-green-600 mb-1" />
                  <span className="font-medium text-green-600">View Appointments</span>
                  <p className="text-sm text-gray-600">See appointment history</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'medical' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Medical History</h2>
            <p className="text-sm text-gray-600">Complete medical records and visit history</p>
          </div>
          <div className="p-6">
            <PatientMedicalHistory medicalRecords={medicalRecords} />
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Appointment History</h2>
            <p className="text-sm text-gray-600">
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {appointments.map(appointment => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Dr. {appointment.doctor?.name}</p>
                        <p className="text-sm text-gray-600">{appointment.reason}</p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(appointment.appointment_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    appointment.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {appointments.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments</h3>
                  <p className="text-gray-600">This patient has no appointment history.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientProfile