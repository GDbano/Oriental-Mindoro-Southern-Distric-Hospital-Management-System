import React, { useState } from 'react'
import { Search, Filter, Calendar, Clock } from 'lucide-react'
import AppointmentCard from './AppointmentCard'
import SearchBar from '../common/SearchBar'
import { formatDate } from '../../utils/helpers'
import { APPOINTMENT_STATUS } from '../../utils/constants'

const AppointmentList = ({ appointments, onUpdate, userRole = 'patient' }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patient?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.doctor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    const matchesDate = !dateFilter || formatDate(appointment.appointment_date) === formatDate(dateFilter)

    return matchesSearch && matchesStatus && matchesDate
  })

  const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
    const date = formatDate(appointment.appointment_date)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(appointment)
    return groups
  }, {})

  const sortedDates = Object.keys(groupedAppointments).sort((a, b) => new Date(b) - new Date(a))

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setDateFilter('')
  }

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFilter

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search appointments..."
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Status Filter */}
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
                <option value={APPOINTMENT_STATUS.CANCELLED}>Cancelled</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredAppointments.length} of {appointments.length} appointments
        </p>
        {hasActiveFilters && (
          <p className="text-sm text-gray-500">
            {searchQuery && `Search: "${searchQuery}"`}
            {statusFilter !== 'all' && ` • Status: ${statusFilter}`}
            {dateFilter && ` • Date: ${formatDate(dateFilter)}`}
          </p>
        )}
      </div>

      {/* Appointments List */}
      {sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date} className="space-y-4">
              {/* Date Header */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                </div>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                  {groupedAppointments[date].length} appointment{groupedAppointments[date].length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Appointments for this date */}
              <div className="space-y-4">
                {groupedAppointments[date]
                  .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
                  .map(appointment => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onUpdate={onUpdate}
                      userRole={userRole}
                    />
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow border">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {appointments.length === 0 ? 'No appointments found' : 'No matching appointments'}
          </h3>
          <p className="text-gray-600 mb-4">
            {appointments.length === 0 
              ? 'You have no appointments scheduled.'
              : 'Try adjusting your search criteria or filters.'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {appointments.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Appointment Summary</h4>
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

export default AppointmentList