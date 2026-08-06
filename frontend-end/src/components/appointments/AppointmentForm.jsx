import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, AlertCircle, Loader } from 'lucide-react'
import { appointmentAPI } from '../../services/api'

const AppointmentForm = ({ onSuccess, onClose = null }) => {
  const [formData, setFormData] = useState({
    doctor_id: '',
    department_id: '',
    appointment_type_id: '',
    appointment_date: '',
    scheduled_time: '',
    reason: '',
    symptoms: ''
  })

  const [formState, setFormState] = useState({
    doctors: [],
    departments: [],
    appointmentTypes: [],
    availableSlots: [],
    loading: false,
    submitting: false,
    errors: {},
    fetchingSlots: false
  })

  // Load form data on mount
  useEffect(() => {
    loadFormData()
  }, [])

  // Fetch available slots when doctor and date change
  useEffect(() => {
    if (formData.doctor_id && formData.appointment_date) {
      fetchAvailableSlots()
    }
  }, [formData.doctor_id, formData.appointment_date])

  // Fetch doctors for selected department
  useEffect(() => {
    if (formData.department_id) {
      fetchDoctorsByDepartment()
    }
  }, [formData.department_id])

  const loadFormData = async () => {
    try {
      setFormState(prev => ({ ...prev, loading: true }))
      const response = await appointmentAPI.getFormData()
      const { doctors = [], departments = [], appointmentTypes = [] } = response.data

      setFormState(prev => ({
        ...prev,
        doctors,
        departments,
        appointmentTypes,
        loading: false
      }))
    } catch (error) {
      console.error('Error loading form data:', error)
      setFormState(prev => ({
        ...prev,
        loading: false,
        errors: { api: 'Failed to load form data. Please refresh.' }
      }))
    }
  }

  const fetchAvailableSlots = async () => {
    try {
      setFormState(prev => ({ ...prev, fetchingSlots: true }))
      const response = await appointmentAPI.getAvailableSlots(
        formData.doctor_id,
        formData.appointment_date
      )
      setFormState(prev => ({
        ...prev,
        availableSlots: response.data.available_slots || [],
        fetchingSlots: false
      }))
    } catch (error) {
      console.error('Error fetching slots:', error)
      setFormState(prev => ({
        ...prev,
        fetchingSlots: false,
        availableSlots: []
      }))
    }
  }

  const fetchDoctorsByDepartment = async () => {
    try {
      const response = await appointmentAPI.getDoctorsByDepartment(formData.department_id)
      // Clear previous doctor selection when department changes
      setFormData(prev => ({
        ...prev,
        doctor_id: '',
        scheduled_time: ''
      }))
      setFormState(prev => ({
        ...prev,
        doctors: response.data.doctors || [],
        availableSlots: [] // Clear available slots
      }))
    } catch (error) {
      console.error('Error fetching department doctors:', error)
      setFormState(prev => ({
        ...prev,
        doctors: []
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.doctor_id) {
      newErrors.doctor_id = 'Please select a doctor'
    }

    if (!formData.department_id) {
      newErrors.department_id = 'Please select a department'
    }

    if (!formData.appointment_date) {
      newErrors.appointment_date = 'Please select a date'
    } else {
      // Fix: Allow appointments for today and future dates
      const selected = new Date(formData.appointment_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      selected.setHours(0, 0, 0, 0)
      
      if (selected < today) {
        newErrors.appointment_date = 'Appointment date cannot be in the past'
      }
    }

    if (!formData.appointment_type_id) {
      newErrors.appointment_type_id = 'Please select an appointment type'
    }

    if (!formData.scheduled_time) {
      newErrors.scheduled_time = 'Please select a time'
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Please provide a reason for the appointment'
    }

    setFormState(prev => ({ ...prev, errors: newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setFormState(prev => ({ ...prev, submitting: true }))

    try {
      const appointmentDateTime = `${formData.appointment_date} ${formData.scheduled_time}:00`

      const appointmentData = {
        doctor_id: parseInt(formData.doctor_id),
        department_id: parseInt(formData.department_id),
        appointment_type_id: parseInt(formData.appointment_type_id),
        appointment_date: appointmentDateTime,
        scheduled_time: formData.scheduled_time,
        reason: formData.reason,
        symptoms: formData.symptoms || null
      }

      const response = await appointmentAPI.create(appointmentData)

      // Show success with queue number
      if (response.data.appointment?.queue_number) {
        alert(`✅ Appointment booked successfully!\nYour Queue Number: ${response.data.appointment.queue_number}`)
      }

      setFormState(prev => ({
        ...prev,
        submitting: false,
        errors: {}
      }))

      // Reset form
      setFormData({
        doctor_id: '',
        department_id: '',
        appointment_type_id: '',
        appointment_date: '',
        scheduled_time: '',
        reason: '',
        symptoms: ''
      })

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error submitting appointment:', error)
      const errorMessage = error.response?.data?.message || 'Failed to book appointment. Please try again.'
      setFormState(prev => ({
        ...prev,
        submitting: false,
        errors: { submit: errorMessage }
      }))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user modifies field
    if (formState.errors[name]) {
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [name]: ''
        }
      }))
    }
  }

  const getTodayMinDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const selectedDoctor = formState.doctors.find(d => d.id === parseInt(formData.doctor_id))
  const selectedDepartment = formState.departments.find(d => d.id === parseInt(formData.department_id))

  if (formState.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading form data...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Submit Error Alert */}
      {formState.errors.submit && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{formState.errors.submit}</p>
        </div>
      )}

      {/* API Error Alert */}
      {formState.errors.api && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{formState.errors.api}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Department Selection */}
        <div>
          <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-2">
            Department *
          </label>
          <select
            id="department_id"
            name="department_id"
            value={formData.department_id}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formState.errors.department_id ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a department...</option>
            {formState.departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          {formState.errors.department_id && (
            <p className="mt-1 text-sm text-red-600">{formState.errors.department_id}</p>
          )}
        </div>

        {/* Doctor Selection */}
        <div>
          <label htmlFor="doctor_id" className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Select Doctor *
          </label>
          <select
            id="doctor_id"
            name="doctor_id"
            value={formData.doctor_id}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formState.errors.doctor_id ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Choose a doctor...</option>
            {formState.doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.name}
              </option>
            ))}
          </select>
          {formState.errors.doctor_id && (
            <p className="mt-1 text-sm text-red-600">{formState.errors.doctor_id}</p>
          )}
        </div>

        {/* Appointment Type Selection */}
        <div>
          <label htmlFor="appointment_type_id" className="block text-sm font-medium text-gray-700 mb-2">
            Appointment Type *
          </label>
          <select
            id="appointment_type_id"
            name="appointment_type_id"
            value={formData.appointment_type_id}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formState.errors.appointment_type_id ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select type...</option>
            {formState.appointmentTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {formState.errors.appointment_type_id && (
            <p className="mt-1 text-sm text-red-600">{formState.errors.appointment_type_id}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointment Date */}
        <div>
          <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Appointment Date *
          </label>
          <input
            type="date"
            id="appointment_date"
            name="appointment_date"
            value={formData.appointment_date}
            onChange={handleChange}
            min={getTodayMinDate()}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formState.errors.appointment_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formState.errors.appointment_date && (
            <p className="mt-1 text-sm text-red-600">{formState.errors.appointment_date}</p>
          )}
        </div>

        {/* Appointment Time */}
        <div>
          <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="h-4 w-4 inline mr-1" />
            Appointment Time *
          </label>
          <select
            id="scheduled_time"
            name="scheduled_time"
            value={formData.scheduled_time}
            onChange={handleChange}
            disabled={!formData.doctor_id || !formData.appointment_date || formState.fetchingSlots}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formState.errors.scheduled_time ? 'border-red-500' : 'border-gray-300'
            } ${!formData.doctor_id || !formData.appointment_date ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">
              {formState.fetchingSlots ? 'Loading available slots...' : 'Select a time slot...'}
            </option>
            {formState.availableSlots.map(slot => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          {formState.errors.scheduled_time && (
            <p className="mt-1 text-sm text-red-600">{formState.errors.scheduled_time}</p>
          )}
          {formState.fetchingSlots && (
            <p className="mt-1 text-xs text-blue-600 flex items-center">
              <Loader className="h-3 w-3 animate-spin mr-1" />
              Checking available times...
            </p>
          )}
        </div>
      </div>

      {/* Doctor Info */}
      {selectedDoctor && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Selected Doctor</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Name:</strong> Dr. {selectedDoctor.name}</p>
            <p><strong>Specialization:</strong> {selectedDoctor.specialization}</p>
            {selectedDoctor.phone && <p><strong>Phone:</strong> {selectedDoctor.phone}</p>}
          </div>
        </div>
      )}

      {/* Department Info */}
      {selectedDepartment && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">Department</h4>
          <div className="text-sm text-green-800 space-y-1">
            <p><strong>Name:</strong> {selectedDepartment.name}</p>
            {selectedDepartment.description && (
              <p><strong>Info:</strong> {selectedDepartment.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Reason for Visit */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
          Reason for Visit *
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          value={formData.reason}
          onChange={handleChange}
          placeholder="Please describe the reason for your appointment..."
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            formState.errors.reason ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formState.errors.reason && (
          <p className="mt-1 text-sm text-red-600">{formState.errors.reason}</p>
        )}
      </div>

      {/* Symptoms */}
      <div>
        <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
          Symptoms (Optional)
        </label>
        <textarea
          id="symptoms"
          name="symptoms"
          rows={3}
          value={formData.symptoms}
          onChange={handleChange}
          placeholder="Describe any symptoms you're experiencing..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Appointment Summary */}
      {formData.appointment_date && formData.scheduled_time && selectedDoctor && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Appointment Summary</h4>
          <div className="text-sm text-gray-700 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Date:</span>
              <span>
                {new Date(formData.appointment_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Time:</span>
              <span>{formData.scheduled_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Doctor:</span>
              <span>Dr. {selectedDoctor.name}</span>
            </div>
            {selectedDepartment && (
              <div className="flex justify-between">
                <span className="font-medium">Department:</span>
                <span>{selectedDepartment.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={formState.submitting}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={formState.submitting || formState.loading}
          className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {formState.submitting ? (
            <>
              <Loader className="h-4 w-4 animate-spin mr-2" />
              Booking...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Book Appointment
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default AppointmentForm