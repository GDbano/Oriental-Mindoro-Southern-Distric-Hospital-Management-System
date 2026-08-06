import React, { useState, useEffect } from 'react'
import { Save, User, Shield, Mail, Phone, MapPin, Eye, EyeOff } from 'lucide-react'
import { userAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

const ProfileUpdateForm = ({ onSuccess, onCancel }) => {
  const { user, logout } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    specialization: '',
    license_number: '',
    date_of_birth: '',
    gender: '',
    blood_type: ''
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  })
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ]

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        specialization: user.specialization || '',
        license_number: user.license_number || '',
        date_of_birth: user.patient?.date_of_birth || '',
        gender: user.patient?.gender || '',
        blood_type: user.patient?.blood_type || ''
      })
    }
  }, [user])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await userAPI.update(user.id, formData)
      setSuccess('Profile updated successfully!')
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordLoading(true)

    try {
      await userAPI.changePassword(user.id, passwordData)
      setPasswordSuccess('Password changed successfully!')
      
      // Clear password fields
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      })

      // Logout user after password change for security
      setTimeout(() => {
        logout()
      }, 2000)
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChangeInput = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

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

  const age = calculateAge(formData.date_of_birth)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {['profile', 'security'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'profile' ? 'Profile Information' : 'Security Settings'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate}>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Update your personal details and contact information
                </p>
              </div>

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

              <div className="space-y-6">
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
                    />
                  </div>

                  {user?.role === 'doctor' && (
                    <>
                      <div>
                        <label htmlFor="specialization" className="form-label">
                          Specialization
                        </label>
                        <input
                          type="text"
                          id="specialization"
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleChange}
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label htmlFor="license_number" className="form-label">
                          License Number
                        </label>
                        <input
                          type="text"
                          id="license_number"
                          name="license_number"
                          value={formData.license_number}
                          onChange={handleChange}
                          className="form-input"
                        />
                      </div>
                    </>
                  )}

                  {user?.role === 'patient' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="date_of_birth" className="form-label">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            id="date_of_birth"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
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
                          Gender
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
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
                    </>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="form-label">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="form-input"
                  />
                </div>

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
                        Update Profile
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Security Settings Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange}>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Security Settings
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Change your password and manage account security
                </p>
              </div>

              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-6">
                  {passwordSuccess}
                  <p className="text-sm mt-1">You will be logged out for security reasons.</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="current_password" className="form-label">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="current_password"
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChangeInput}
                      required
                      className="form-input pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="new_password" className="form-label">
                    New Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="new_password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChangeInput}
                    required
                    minLength="8"
                    className="form-input"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label htmlFor="new_password_confirmation" className="form-label">
                    Confirm New Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="new_password_confirmation"
                    name="new_password_confirmation"
                    value={passwordData.new_password_confirmation}
                    onChange={handlePasswordChangeInput}
                    required
                    className="form-input"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Password Requirements</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Include uppercase and lowercase letters</li>
                    <li>• Include numbers and special characters</li>
                    <li>• Not similar to your personal information</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Back to Profile
                  </button>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="btn-primary flex items-center"
                  >
                    {passwordLoading ? (
                      <LoadingSpinner size="small" text="" />
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Account Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">User ID:</span>
            <p className="text-gray-900">{user?.id}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Role:</span>
            <p className="text-gray-900 capitalize">{user?.role}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Account Created:</span>
            <p className="text-gray-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Last Updated:</span>
            <p className="text-gray-900">
              {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileUpdateForm