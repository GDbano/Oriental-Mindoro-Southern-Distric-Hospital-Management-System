import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { formatDate, formatTime } from '../../utils/helpers'
import { APPOINTMENT_STATUS_COLORS } from '../../utils/constants'

const AppointmentCalendar = ({ appointments }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate.toDateString() === date.toDateString()
    })
  }

  const getStatusColor = (status) => {
    return APPOINTMENT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Previous month days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const daysInPrevMonth = getDaysInMonth(prevMonth)
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i)
      days.push(
        <div key={`prev-${i}`} className="p-2 text-gray-400 bg-gray-50 border">
          {daysInPrevMonth - i}
        </div>
      )
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      const dayAppointments = getAppointmentsForDate(date)
      const isToday = date.toDateString() === new Date().toDateString()
      const isSelected = date.toDateString() === selectedDate.toDateString()

      days.push(
        <div
          key={`current-${i}`}
          className={`p-2 border cursor-pointer transition-colors ${
            isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'
          } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${
              isToday ? 'text-blue-600' : 'text-gray-900'
            }`}>
              {i}
            </span>
            {dayAppointments.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                {dayAppointments.length}
              </span>
            )}
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {dayAppointments.slice(0, 3).map(apt => (
              <div
                key={apt.id}
                className={`text-xs p-1 rounded ${
                  getStatusColor(apt.status)
                } truncate`}
                title={`${formatTime(apt.appointment_date)} - ${apt.patient?.user?.name}`}
              >
                {formatTime(apt.appointment_date)} {apt.patient?.user?.name.split(' ')[0]}
              </div>
            ))}
            {dayAppointments.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{dayAppointments.length - 3} more
              </div>
            )}
          </div>
        </div>
      )
    }

    // Next month days
    const totalCells = 42 // 6 weeks
    const nextMonthDays = totalCells - days.length
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i)
      days.push(
        <div key={`next-${i}`} className="p-2 text-gray-400 bg-gray-50 border">
          {i}
        </div>
      )
    }

    return days
  }

  const selectedDateAppointments = getAppointmentsForDate(selectedDate)

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-medium text-gray-500 text-sm py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {renderCalendarDays()}
        </div>

        {/* Selected Date Appointments */}
        {selectedDateAppointments.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Appointments for {formatDate(selectedDate)}
            </h3>
            <div className="space-y-3">
              {selectedDateAppointments.map(appointment => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.patient?.user?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatTime(appointment.appointment_date)} • Dr. {appointment.doctor?.name}
                      </p>
                      <p className="text-sm text-gray-500">{appointment.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getStatusColor(appointment.status)
                    }`}>
                      {appointment.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDateAppointments.length === 0 && selectedDate.toDateString() !== new Date().toDateString() && (
          <div className="mt-8 border-t pt-6 text-center text-gray-500">
            <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p>No appointments scheduled for {formatDate(selectedDate)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentCalendar