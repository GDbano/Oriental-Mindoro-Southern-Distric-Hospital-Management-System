import React, { useState } from 'react'
import { Save, User, Heart, Phone, MapPin, Calendar } from 'lucide-react'
import { userAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'

const PatientRegistrationForm = ({ onSuccess, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    date_of_birth: initialData.date_of_birth || '',
    gender: initialData.gender || '',
    blood_type: initialData.blood_type || '',
    allergies: initialData.allergies || '',
    medical_history: initialData.medical_history || '',
    emergency_contact_name: initialData.emergency_contact_name || '',
    emergency_contact_phone: initialData.emergency_contact_phone || '',
    insurance_info: initialData.insurance_info || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ]

  const calculateAge = (dateString) => {
    if (!dateString) return null
    const today = new Date()
    const birthDate = new Date(dateString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        role: 'patient',
        password: 'TempPassword123!', // Default password
        password_confirmation: 'TempPassword123!'
      }

      if (initialData.id) {
        // Update existing patient
        await userAPI.update(initialData.id, submitData)
        setSuccess('Patient information updated successfully!')
      } else {
        // Create new patient
        await userAPI.register(submitData)
        setSuccess('Patient registered successfully!')
      }

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save patient information')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const age = calculateAge(formData.date_of_birth)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <User className="h-6 w-6 mr-2 text-blue-600" />
            {initialData.id ? 'Update Patient Information' : 'Register New Patient'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {initialData.id 
              ? 'Update the patient personal and medical information'
              : 'Add a new patient to the healthcare system'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-6">
              {success}
            </div>
          )}

          <div className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="form-label">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="form-label">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="patient@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date_of_birth" className="form-label">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Age</label>
                    <div className="form-input bg-gray-50">
                      {age ? `${age} years` : '--'}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="form-label">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="form-input"
                  >
                    <option value="">Select Gender</option>
                    {genders.map(gender => (
                      <option key={gender.value} value={gender.value}>
                        {gender.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="blood_type" className="form-label">
                    Blood Type
                  </label>
                  <select
                    id="blood_type"
                    name="blood_type"
                    value={formData.blood_type}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">Select Blood Type</option>
                    {bloodTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="form-label">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                    className="form-input"
                    placeholder="Full residential address"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-600" />
                Medical Information
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="allergies" className="form-label">
                    Allergies
                  </label>
                  <textarea
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    rows="3"
                    className="form-input"
                    placeholder="List any known allergies (medications, food, environmental, etc.)...
                    
Example:
- Penicillin
- Peanuts
- Latex"
                  />
                </div>

                <div>
                  <label htmlFor="medical_history" className="form-label">
                    Medical History
                  </label>
                  <textarea
                    id="medical_history"
                    name="medical_history"
                    value={formData.medical_history}
                    onChange={handleChange}
                    rows="4"
                    className="form-input"
                    placeholder="Chronic conditions, previous surgeries, family medical history, etc...
                    
Example:
- Hypertension (diagnosed 2018)
- Type 2 Diabetes (diagnosed 2020)
- Appendectomy (2015)
- Family history of heart disease"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact & Insurance */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-green-600" />
                Emergency Contact & Insurance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="emergency_contact_name" className="form-label">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Emergency contact full name"
                  />
                </div>

                <div>
                  <label htmlFor="emergency_contact_phone" className="form-label">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="+1 (555) 987-6543"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="insurance_info" className="form-label">
                    Insurance Information
                  </label>
                  <textarea
                    id="insurance_info"
                    name="insurance_info"
                    value={formData.insurance_info}
                    onChange={handleChange}
                    rows="3"
                    className="form-input"
                    placeholder="Insurance provider, policy number, group number, etc...
                    
Example:
Provider: Blue Cross Blue Shield
Policy No: BCBS-123456789
Group No: GRP-987654
Member ID: MEM-456123"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center"
              >
                {loading ? (
                  <LoadingSpinner size="small" text="" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {initialData.id ? 'Update Patient' : 'Register Patient'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Important Notes */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Important Information</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• A temporary password will be generated and the patient will be prompted to change it on first login</li>
          <li>• The patient will receive an email with login credentials to access their patient portal</li>
          <li>• All medical information is stored securely and confidentially</li>
          <li>• Emergency contact information is critical for urgent medical situations</li>
        </ul>
      </div>
    </div>
  )
}

export default PatientRegistrationForm