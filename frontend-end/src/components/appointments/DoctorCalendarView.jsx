import React, { useState, useEffect } from 'react'
import { appointmentAPI, userAPI } from '../../services/api'
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle, Plus } from 'lucide-react'
import './DoctorCalendarView.css'

const DoctorCalendarView = () => {
  const [calendar, setCalendar] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  // Get the Monday of the given date
  function getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff)).toISOString().split('T')[0]
  }

  // Initialize by fetching doctors list
  useEffect(() => {
    const initializeDoctors = async () => {
      try {
        const response = await appointmentAPI.getDoctors()
        setDoctors(response.data)
        if (response.data && response.data.length > 0) {
          setSelectedDoctor(response.data[0].id)
        }
      } catch (err) {
        setError('Failed to fetch doctors list')
        console.error(err)
      }
    }
    initializeDoctors()
  }, [])

  // Fetch calendar data whenever selected doctor or week start changes
  useEffect(() => {
    if (!selectedDoctor) return

    const fetchCalendar = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await appointmentAPI.getWeeklyCalendar(selectedDoctor, weekStart)
        setCalendar(response.data)
      } catch (err) {
        setError('Failed to fetch calendar data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCalendar()
  }, [selectedDoctor, weekStart])

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(weekStart)
    newDate.setDate(newDate.getDate() - 7)
    setWeekStart(newDate.toISOString().split('T')[0])
  }

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(weekStart)
    newDate.setDate(newDate.getDate() + 7)
    setWeekStart(newDate.toISOString().split('T')[0])
  }

  // Go to today
  const goToToday = () => {
    setWeekStart(getMonday(new Date()))
  }

  // Get color class for appointment status
  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'status-blue',
      'confirmed': 'status-green',
      'completed': 'status-gray',
      'no_show': 'status-red',
      'cancelled': 'status-strikethrough',
      'in_consultation': 'status-yellow',
      'arrived': 'status-blue'
    }
    return colors[status] || 'status-gray'
  }

  // Get priority indicator
  const getPriorityIndicator = (priority) => {
    const indicators = {
      'Senior': '👴',
      'PWD': '♿',
      'Pregnant': '🤰',
      'Emergency': '🚨',
      'Regular': ''
    }
    return indicators[priority] || ''
  }

  // Handle appointment click
  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment)
    setShowDetails(true)
  }

  // Handle free slot click (optional - for adding appointments)
  const handleSlotClick = (date, time) => {
    console.log(`Clicked free slot: ${date} at ${time}`)
    // Could implement adding appointment modal here
  }

  if (!calendar || !selectedDoctor) {
    return (
      <div className="doctor-calendar">
        {loading && <div className="loading">Loading calendar...</div>}
        {error && <div className="error">{error}</div>}
      </div>
    )
  }

  const doctor = doctors.find(d => d.id === selectedDoctor)

  return (
    <div className="doctor-calendar">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-left">
          <h1 className="title">Doctor's Appointment Calendar</h1>
          {doctor && (
            <div className="doctor-info">
              <span className="doctor-name">{doctor.name}</span>
              {doctor.specialization && <span className="specialization">{doctor.specialization}</span>}
            </div>
          )}
        </div>
        <div className="header-right">
          <select 
            value={selectedDoctor} 
            onChange={(e) => setSelectedDoctor(Number(e.target.value))}
            className="doctor-select"
          >
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="calendar-controls">
        <div className="nav-buttons">
          <button onClick={goToPreviousWeek} className="btn btn-nav">
            <ChevronLeft size={20} /> Previous
          </button>
          <button onClick={goToToday} className="btn btn-today">
            <Calendar size={20} /> Today
          </button>
          <button onClick={goToNextWeek} className="btn btn-nav">
            Next <ChevronRight size={20} />
          </button>
        </div>
        <div className="week-display">
          <span className="week-range">
            {calendar.week_start} to {calendar.week_end}
          </span>
          <span className="appointment-stats">
            {calendar.total_appointments} appointments, {calendar.total_available_slots} available slots
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <div className="legend-color status-blue"></div>
          <span>Scheduled/Arrived</span>
        </div>
        <div className="legend-item">
          <div className="legend-color status-green"></div>
          <span>Confirmed</span>
        </div>
        <div className="legend-item">
          <div className="legend-color status-yellow"></div>
          <span>In Consultation</span>
        </div>
        <div className="legend-item">
          <div className="legend-color status-gray"></div>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <div className="legend-color status-red"></div>
          <span>No Show</span>
        </div>
        <div className="legend-item">
          <div className="legend-color status-strikethrough"></div>
          <span>Cancelled</span>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="loading">Loading calendar...</div>
      ) : error ? (
        <div className="error">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      ) : (
        <div className="calendar-grid-wrapper">
          <div className="calendar-grid">
            {/* Time labels column */}
            <div className="time-column">
              <div className="time-header">Time</div>
              {calendar.time_slots.map(time => (
                <div key={time} className="time-slot">
                  {time}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {calendar.calendar_grid.map(dayData => (
              <div key={dayData.date} className="day-column">
                <div className="day-header">
                  <div className="day-name">{dayData.day_name}</div>
                  <div className="day-date">{dayData.formatted_date}</div>
                  <div className="day-count">
                    {dayData.appointment_count > 0 && <span className="badge">{dayData.appointment_count}</span>}
                  </div>
                </div>

                <div className="day-slots">
                  {dayData.time_slots.map((slot, index) => (
                    <div 
                      key={`${dayData.date}-${slot.time}`} 
                      className="time-slot-cell"
                      onClick={() => !slot.appointment && handleSlotClick(dayData.date, slot.time)}
                    >
                      {slot.appointment ? (
                        <div 
                          className={`appointment-card ${getStatusColor(slot.appointment.status)}`}
                          onClick={() => handleAppointmentClick(slot.appointment)}
                        >
                          <div className="appointment-priority">
                            {getPriorityIndicator(slot.appointment.priority_level)}
                          </div>
                          <div className="appointment-patient">
                            {slot.appointment.patient_name}
                          </div>
                          <div className="appointment-type">
                            {slot.appointment.appointment_type}
                          </div>
                          <div className="appointment-queue">
                            Q#{slot.appointment.queue_number}
                          </div>
                        </div>
                      ) : (
                        <div className="empty-slot" title="Click to add appointment">
                          <Plus size={16} className="plus-icon" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showDetails && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Appointment Details</h2>
              <button className="modal-close" onClick={() => setShowDetails(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="label">Patient:</span>
                <span className="value">{selectedAppointment.patient_name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Appointment Type:</span>
                <span className="value">{selectedAppointment.appointment_type}</span>
              </div>
              <div className="detail-row">
                <span className="label">Date & Time:</span>
                <span className="value">
                  {selectedAppointment.appointment_date} at {selectedAppointment.scheduled_time}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`value status-text ${getStatusColor(selectedAppointment.status)}`}>
                  {selectedAppointment.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Priority:</span>
                <span className="value">
                  {getPriorityIndicator(selectedAppointment.priority_level)} {selectedAppointment.priority_level}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Queue Number:</span>
                <span className="value">{selectedAppointment.queue_number}</span>
              </div>
              <div className="detail-row">
                <span className="label">Reason for Visit:</span>
                <span className="value">{selectedAppointment.reason}</span>
              </div>
              <div className="detail-row">
                <span className="label">Duration:</span>
                <span className="value">{selectedAppointment.duration_minutes} minutes</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowDetails(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorCalendarView
