import React, { useState, useEffect } from 'react'
import { Save, X, User, Mail, Phone, MapPin, Stethoscope, Shield } from 'lucide-react'
import { userAPI } from '../../services/api'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'

const UserForm = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'patient',
    phone: '',
    address: '',
    specialization: '',
    license_number: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (user) {
      setIsEditing(true)
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'patient',
        phone: user.phone || '',
        address: user.address || '',
        specialization: user.specialization || '',
        license_number: user.license_number || '',
        is_active: user.is_active !== undefined ? user.is_active : true
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEditing) {
        await userAPI.update(user.id, formData)
      } else {
        // For new users, you might want to use the auth register endpoint
        // This is a simplified version - in real app, you'd handle password generation
        await userAPI.create(formData)
      }
      onSuccess()
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} user`)
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

  const getRoleIcon = (role) => {
    const icons = {
      patient: <User className="h-4 w-4" />,
      doctor: <Stethoscope className="h-4 w-4" />,
      staff: <User className="h-4 w-4" />,
      admin: <Shield className="h-4 w-4" />
    }
    return icons[role] || <User className="h-4 w-4" />
  }

  const getRoleDescription = (role) => {
    const descriptions = {
      patient: 'Can book appointments and view personal medical records',
      doctor: 'Can manage appointments, create medical records, and prescribe medications',
      staff: 'Can manage appointments, view patient information, and handle administrative tasks',
      admin: 'Full system access including user management and system configuration'
    }
    return descriptions[role] || ''
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit User' : 'Create New User'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="form-label">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input pl-10"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input pl-10"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="form-label">
              Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="form-input pl-10"
                placeholder="Enter address"
              />
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="form-label">
            User Role *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['patient', 'doctor', 'staff', 'admin'].map(role => (
              <label
                key={role}
                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  formData.role === role
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={formData.role === role}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-700 font-medium capitalize">
                          {role}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        {getRoleDescription(role)}
                      </p>
                    </div>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 ${
                    formData.role === role
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`} />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Doctor-specific Fields */}
        {formData.role === 'doctor' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
              <Stethoscope className="h-4 w-4 mr-2" />
              Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="specialization" className="form-label">
                  Specialization *
                </label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  required={formData.role === 'doctor'}
                  className="form-input"
                  placeholder="Cardiology, Pediatrics, etc."
                />
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
                  required={formData.role === 'doctor'}
                  className="form-input"
                  placeholder="Medical license number"
                />
              </div>
            </div>
          </div>
        )}

        {/* Status */}
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
            Active User Account
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {isEditing ? `Editing user: ${user.name}` : 'Creating new user account'}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                  {isEditing ? 'Update User' : 'Create User'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Password Note for New Users */}
        {!isEditing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> A temporary password will be generated and sent to the user's email address. 
              The user will be required to change their password on first login.
            </p>
          </div>
        )}
      </form>
    </Modal>
  )
}

export default UserForm