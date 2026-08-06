import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, User } from 'lucide-react'
import { appointmentAPI } from '../../services/api'
import { formatDateTime } from '../../utils/helpers'

const ReassignAppointmentModal = ({ appointment, onClose, onSuccess }) => {
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loading, setLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await appointmentAPI.getDoctorsByDepartment(appointment.department_id)
        setDoctors(res.data.doctors || [])
        // Select current doctor by default
        setSelectedDoctorId(appointment.doctor_id)
      } catch (err) {
        console.error('Failed to fetch doctors', err)
      }
    }
    fetchDoctors()
  }, [appointment])

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDoctorId || !selectedDate) {
        setAvailableSlots([])
        return
      }
      try {
        setSlotsLoading(true)
        const res = await appointmentAPI.getAvailableSlots(selectedDoctorId, selectedDate, appointment.department_id)
        setAvailableSlots(res.data.available_slots || [])
        setSelectedSlot('') // Reset slot selection
      } catch (err) {
        console.error('Failed to fetch slots', err)
        setAvailableSlots([])
      } finally {
        setSlotsLoading(false)
      }
    }
    fetchSlots()
  }, [selectedDoctorId, selectedDate, appointment.department_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await appointmentAPI.reassign(appointment.id, {
        doctor_id: selectedDoctorId,
        appointment_date: selectedDate,
        scheduled_time: selectedSlot
      })
      onSuccess()
    } catch (err) {
      console.error('Failed to reassign', err)
      setError(err.response?.data?.message || 'Failed to reassign appointment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-60">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Reassign Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm text-blue-800 border border-blue-100">
            <p><span className="font-semibold">Patient:</span> {appointment.patient?.user?.name}</p>
            <p><span className="font-semibold">Current Schedule:</span> {formatDateTime(appointment.appointment_date)} at {appointment.scheduled_time}</p>
            <p><span className="font-semibold">Current Doctor:</span> Dr. {appointment.doctor?.name}</p>
          </div>

          <form id="reassign-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Doctor
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="" disabled>Choose a doctor</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.name} {doc.id === appointment.doctor_id ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Time Slots
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  required
                  disabled={slotsLoading || availableSlots.length === 0}
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="" disabled>
                    {slotsLoading 
                      ? 'Loading slots...' 
                      : (!selectedDate || !selectedDoctorId)
                        ? 'Select doctor and date first'
                        : availableSlots.length === 0
                          ? 'No slots available'
                          : 'Choose a time slot'
                    }
                  </option>
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="reassign-form"
            disabled={loading || !selectedDoctorId || !selectedDate || !selectedSlot}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? 'Reassigning...' : 'Confirm Reassignment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReassignAppointmentModal
