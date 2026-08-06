import React, { useState } from 'react'
import { Save, UserPlus, Award, BookOpen } from 'lucide-react'
import { userAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'

const DoctorRegistrationForm = ({ onSuccess, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    specialization: initialData.specialization || '',
    license_number: initialData.license_number || '',
    qualifications: initialData.qualifications || '',
    experience_years: initialData.experience_years || '',
    department: initialData.department || '',
    bio: initialData.bio || '',
    is_active: initialData.is_active !== undefined ? initialData.is_active : true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const specializations = [
    'Cardiology',
    'Dermatology',
    'Emergency Medicine',
    'Family Medicine',
    'Gastroenterology',
    'General Surgery',
    'Internal Medicine',
    'Neurology',
    'Obstetrics and Gynecology',
    'Oncology',
    'Ophthalmology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Urology',
    'Other'
  ]

  const departments = [
    'Emergency',
    'Outpatient',
    'Inpatient',
    'Surgery',
    'Pediatrics',
    'Maternity',
    'ICU',
    'Radiology',
    'Laboratory',
    'Pharmacy',
    'Administration'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        role: 'doctor',
        password: 'TempPassword123!', // Default password, should be changed by user
        password_confirmation: 'TempPassword123!'
      }

      if (initialData.id) {
        // Update existing doctor
        await userAPI.update(initialData.id, submitData)
        setSuccess('Doctor information updated successfully!')
      } else {
        // Create new doctor
        await userAPI.register(submitData)
        setSuccess('Doctor registered successfully!')
      }

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save doctor information')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <UserPlus className="h-6 w-6 mr-2 text-blue-600" />
            {initialData.id ? 'Update Doctor Information' : 'Register New Doctor'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {initialData.id 
              ? 'Update the doctor professional information and details'
              : 'Add a new medical practitioner to the healthcare system'
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
                <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
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
                    placeholder="Dr. John Smith"
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
                    placeholder="doctor.smith@hospital.com"
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

                <div>
                  <label htmlFor="department" className="form-label">
                    Department
                  </label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
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
                    placeholder="Clinic or hospital address"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-green-600" />
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="specialization" className="form-label">
                    Specialization *
                  </label>
                  <select
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                    className="form-input"
                  >
                    <option value="">Select Specialization</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="license_number" className="form-label">
                    License Number *
                  </label>
                  <input
                    type="text"
                    id="license_number"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="MD-123456"
                  />
                </div>

                <div>
                  <label htmlFor="experience_years" className="form-label">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    id="experience_years"
                    name="experience_years"
                    value={formData.experience_years}
                    onChange={handleChange}
                    min="0"
                    max="50"
                    className="form-input"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label htmlFor="qualifications" className="form-label">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    id="qualifications"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="MD, MBBS, PhD, etc."
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                Additional Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="bio" className="form-label">
                    Professional Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    className="form-input"
                    placeholder="Brief professional background, areas of expertise, and any other relevant information..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active status (doctor can receive appointments)
                  </label>
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
                    {initialData.id ? 'Update Doctor' : 'Register Doctor'}
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
          <li>• A temporary password will be generated and the doctor will be prompted to change it on first login</li>
          <li>• The doctor will receive an email with login credentials</li>
          <li>• Ensure all professional credentials are verified before activation</li>
          <li>• License number must be valid and current</li>
        </ul>
      </div>
    </div>
  )
}

export default DoctorRegistrationForm