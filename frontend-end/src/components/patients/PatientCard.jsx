import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Phone, Mail, Calendar, MapPin, MoreVertical, Eye, Edit, FileText } from 'lucide-react'
import { formatDate, calculateAge, getInitials } from '../../utils/helpers'
import Modal from '../common/Modal'

const PatientCard = ({ patient, onView, onEdit, onViewMedical }) => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const user = patient.user
  const age = calculateAge(patient.date_of_birth)

  const handleViewDetails = () => {
    if (onView) {
      onView(patient)
    } else {
      navigate(`/dashboard/patients/${patient.id}`)
    }
    setShowMenu(false)
  }

  const handleViewMedical = () => {
    if (onViewMedical) {
      onViewMedical(patient)
    }
    setShowMenu(false)
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(patient)
    }
    setShowMenu(false)
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
        {/* Card Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {getInitials(user.name)}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">Patient ID: {patient.id}</p>
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={handleViewDetails}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    <button
                      onClick={handleViewMedical}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Medical History
                    </button>
                    <button
                      onClick={handleEdit}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4">
          <div className="space-y-3">
            {/* Contact Information */}
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-900 truncate">{user.email}</span>
            </div>

            {user.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900">{user.phone}</span>
              </div>
            )}

            {patient.date_of_birth && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900">
                  {formatDate(patient.date_of_birth)} {age && `(${age} years)`}
                </span>
              </div>
            )}

            {patient.gender && (
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900 capitalize">{patient.gender}</span>
              </div>
            )}

            {user.address && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-900 line-clamp-2">{user.address}</span>
              </div>
            )}
          </div>

          {/* Medical Information Summary */}
          {(patient.blood_type || patient.allergies) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Medical Info</h4>
              <div className="space-y-2">
                {patient.blood_type && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Blood Type:</span>
                    <span className="text-xs font-medium text-gray-900">{patient.blood_type}</span>
                  </div>
                )}
                {patient.allergies && (
                  <div>
                    <span className="text-xs text-gray-600">Allergies:</span>
                    <p className="text-xs text-gray-900 line-clamp-2 mt-1">
                      {patient.allergies}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Joined {formatDate(patient.created_at)}
            </span>
            <button
              onClick={handleViewDetails}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Patient Details Modal */}
      {showDetailsModal && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Patient Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900">{user.address || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                  <p className="text-gray-900">
                    {patient.date_of_birth ? formatDate(patient.date_of_birth) : 'Not provided'}
                    {age && ` (${age} years)`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Gender</label>
                  <p className="text-gray-900 capitalize">{patient.gender || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Blood Type</label>
                  <p className="text-gray-900">{patient.blood_type || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Insurance</label>
                  <p className="text-gray-900">{patient.insurance_info || 'Not provided'}</p>
                </div>
              </div>

              {patient.allergies && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">Allergies</label>
                  <p className="text-gray-900 mt-1">{patient.allergies}</p>
                </div>
              )}

              {patient.medical_history && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">Medical History</label>
                  <p className="text-gray-900 mt-1">{patient.medical_history}</p>
                </div>
              )}
            </div>

            {/* Emergency Contact */}
            {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patient.emergency_contact_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Contact Name</label>
                      <p className="text-gray-900">{patient.emergency_contact_name}</p>
                    </div>
                  )}
                  {patient.emergency_contact_phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Contact Phone</label>
                      <p className="text-gray-900">{patient.emergency_contact_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleViewMedical}
                className="btn-primary flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Medical History
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default PatientCard