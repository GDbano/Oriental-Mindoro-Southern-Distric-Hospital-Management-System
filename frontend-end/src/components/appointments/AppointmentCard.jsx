import React, { useState } from 'react'
import { Calendar, Clock, User, MapPin, FileText } from 'lucide-react'
import { formatDateTime, formatTime } from '../../utils/helpers'
import StatusBadge from '../common/StatusBadge'
import ReassignAppointmentModal from './ReassignAppointmentModal'

const AppointmentCard = ({ 
  appointment, 
  onUpdate, 
  onViewDetails, 
  userRole,
  showActions = true 
}) => {
  const [showReassignModal, setShowReassignModal] = useState(false)

  const handleStatusUpdate = async (newStatus) => {
    try {
      // Import appointmentAPI
      const { appointmentAPI } = await import('../../services/api')
      await appointmentAPI.updateStatus(appointment.id, newStatus)
      // Call onUpdate to refresh the list
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating appointment status:', error)
      alert('Failed to update appointment status. Please try again.')
    }
  }

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const { appointmentAPI } = await import('../../services/api')
        const reason = prompt('Please provide a reason for cancellation (optional):')
        await appointmentAPI.cancel(appointment.id, reason || 'Patient requested cancellation')
        // Call onUpdate to refresh the list
        if (onUpdate) {
          onUpdate()
        }
        alert('✅ Appointment cancelled successfully')
      } catch (error) {
        console.error('Error cancelling appointment:', error)
        alert('Failed to cancel appointment. Please try again.')
      }
    }
  }

  const canCancel = ['scheduled', 'confirmed'].includes(appointment.status)
  const canReschedule = ['scheduled', 'confirmed'].includes(appointment.status)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {userRole === 'patient' 
                    ? `Dr. ${appointment.doctor?.name}`
                    : appointment.patient?.user?.name
                  }
                </h3>
                <p className="text-sm text-gray-600">
                  {userRole === 'patient' 
                    ? appointment.doctor?.specialization
                    : `Patient`
                  }
                </p>
              </div>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>{formatDateTime(appointment.appointment_date)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                <span>
                  {userRole === 'patient' 
                    ? `Dr. ${appointment.doctor?.name}`
                    : appointment.patient?.user?.name
                  }
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {appointment.doctor?.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{appointment.doctor?.phone}</span>
                </div>
              )}
              <div className="flex items-start text-sm text-gray-600">
                <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span className="flex-1">{appointment.reason}</span>
              </div>
            </div>
          </div>

          {/* Symptoms (if any) */}
          {appointment.symptoms && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Symptoms:</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {appointment.symptoms}
              </p>
            </div>
          )}

          {/* Notes (if any) */}
          {appointment.notes && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {appointment.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewDetails?.(appointment)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              View Details
            </button>
            
            {userRole === 'patient' && canReschedule && (
              <button className="text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors">
                Reschedule
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {userRole === 'patient' && canCancel && (
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Cancel
              </button>
            )}

            {userRole === 'doctor' && (
              <div className="flex items-center space-x-2">
                {appointment.status === 'scheduled' && (
                  <button
                    onClick={() => handleStatusUpdate('confirmed')}
                    className="px-3 py-1.5 text-sm text-green-600 hover:text-green-700 font-medium border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Confirm
                  </button>
                )}
                {appointment.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusUpdate('in_progress')}
                    className="px-3 py-1.5 text-sm text-yellow-600 hover:text-yellow-700 font-medium border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors"
                  >
                    Start
                  </button>
                )}
                {appointment.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Complete
                  </button>
                )}
              </div>
            )}

            {userRole === 'staff' && (
              <div className="flex items-center space-x-2">
                {['scheduled', 'confirmed'].includes(appointment.status) && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('confirmed')}
                      className="px-3 py-1.5 text-sm text-green-600 hover:text-green-700 font-medium border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setShowReassignModal(true)}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Reassign
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showReassignModal && (
        <ReassignAppointmentModal
          appointment={appointment}
          onClose={() => setShowReassignModal(false)}
          onSuccess={() => {
            setShowReassignModal(false)
            if (onUpdate) onUpdate()
          }}
        />
      )}
    </div>
  )
}

export default AppointmentCard