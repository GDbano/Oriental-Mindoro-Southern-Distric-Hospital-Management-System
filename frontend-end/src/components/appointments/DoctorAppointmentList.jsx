import React, { useState } from 'react'
import { Search, Filter, User, Clock, Calendar, Stethoscope } from 'lucide-react'
import { formatDateTime, formatTime } from '../../utils/helpers'
import StatusBadge from '../common/StatusBadge'
import SearchBar from '../common/SearchBar'
import { APPOINTMENT_STATUS } from '../../utils/constants'

const DoctorAppointmentList = ({ 
  appointments, 
  onUpdate, 
  onAddMedicalRecord,
  showActions = true 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patient?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.symptoms?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await onUpdate(appointmentId, { status: newStatus })
    } catch (error) {
      console.error('Error updating appointment status:', error)
    }
  }

  const canAddMedicalRecord = (appointment) => {
    return appointment.status === APPOINTMENT_STATUS.COMPLETED && !appointment.medical_record
  }

  const getAppointmentActions = (appointment) => {
    const actions = []

    if (appointment.status === APPOINTMENT_STATUS.SCHEDULED) {
      actions.push({
        label: 'Confirm',
        action: () => handleStatusUpdate(appointment.id, APPOINTMENT_STATUS.CONFIRMED),
        color: 'green'
      })
    }

    if (appointment.status === APPOINTMENT_STATUS.CONFIRMED) {
      actions.push({
        label: 'Start Consultation',
        action: () => handleStatusUpdate(appointment.id, APPOINTMENT_STATUS.IN_PROGRESS),
        color: 'yellow'
      })
    }

    if (appointment.status === APPOINTMENT_STATUS.IN_PROGRESS) {
      actions.push({
        label: 'Complete Visit',
        action: () => handleStatusUpdate(appointment.id, APPOINTMENT_STATUS.COMPLETED),
        color: 'blue'
      })
    }

    if (canAddMedicalRecord(appointment)) {
      actions.push({
        label: 'Add Medical Record',
        action: () => onAddMedicalRecord(appointment),
        color: 'purple',
        icon: Stethoscope
      })
    }

    return actions
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search patients or reasons..."
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value={APPOINTMENT_STATUS.SCHEDULED}>Scheduled</option>
                <option value={APPOINTMENT_STATUS.CONFIRMED}>Confirmed</option>
                <option value={APPOINTMENT_STATUS.IN_PROGRESS}>In Progress</option>
                <option value={APPOINTMENT_STATUS.COMPLETED}>Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredAppointments.length} of {appointments.length} appointments
        </p>
        {searchQuery && (
          <p className="text-sm text-gray-500">
            Search: "{searchQuery}"
          </p>
        )}
      </div>

      {/* Appointments Grid */}
      {filteredAppointments.length > 0 ? (
        <div className="grid gap-4">
          {filteredAppointments
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
            .map(appointment => {
              const actions = getAppointmentActions(appointment)
              
              return (
                <div
                  key={appointment.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Patient Info */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.patient?.user?.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDateTime(appointment.appointment_date)}
                            </div>
                            {appointment.patient?.age && (
                              <span>Age: {appointment.patient.age}</span>
                            )}
                            {appointment.patient?.gender && (
                              <span>Gender: {appointment.patient.gender}</span>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={appointment.status} />
                      </div>

                      {/* Appointment Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Reason for Visit</h4>
                          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {appointment.reason}
                          </p>
                        </div>
                        
                        {appointment.symptoms && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Symptoms</h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {appointment.symptoms}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Patient Medical Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {appointment.patient?.blood_type && (
                          <div>
                            <span className="font-medium text-gray-700">Blood Type:</span>
                            <span className="ml-1 text-gray-600">{appointment.patient.blood_type}</span>
                          </div>
                        )}
                        {appointment.patient?.allergies && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-700">Allergies:</span>
                            <span className="ml-1 text-gray-600">{appointment.patient.allergies}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {appointment.notes && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-700 mb-2">Notes</h4>
                          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {showActions && actions.length > 0 && (
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200 mt-4">
                      {actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.action}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                            action.color === 'green' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : action.color === 'yellow'
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : action.color === 'blue'
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          {action.icon && <action.icon className="h-4 w-4 mr-1" />}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow border">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {appointments.length === 0 ? 'No appointments scheduled' : 'No matching appointments'}
          </h3>
          <p className="text-gray-600">
            {appointments.length === 0 
              ? 'You have no appointments scheduled for this period.'
              : 'Try adjusting your search criteria.'
            }
          </p>
        </div>
      )}

      {/* Quick Stats */}
      {appointments.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Today's Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">
                {appointments.filter(a => a.status === APPOINTMENT_STATUS.SCHEDULED).length}
              </div>
              <div className="text-gray-600">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">
                {appointments.filter(a => a.status === APPOINTMENT_STATUS.CONFIRMED).length}
              </div>
              <div className="text-gray-600">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-yellow-600">
                {appointments.filter(a => a.status === APPOINTMENT_STATUS.IN_PROGRESS).length}
              </div>
              <div className="text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-600">
                {appointments.filter(a => a.status === APPOINTMENT_STATUS.COMPLETED).length}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorAppointmentList