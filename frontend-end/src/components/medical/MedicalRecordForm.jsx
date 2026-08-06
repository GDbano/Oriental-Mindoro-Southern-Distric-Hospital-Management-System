import React, { useState, useEffect } from 'react'
import { X, Save, Stethoscope, Activity, Heart, Thermometer } from 'lucide-react'
import { medicalRecordAPI } from '../../services/api'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'

const MedicalRecordForm = ({ appointment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    diagnosis: '',
    treatment_plan: '',
    prescription: '',
    notes: '',
    height: '',
    weight: '',
    blood_pressure: '',
    temperature: '',
    heart_rate: '',
    lab_results: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingRecord, setExistingRecord] = useState(null)

  useEffect(() => {
    loadExistingRecord()
  }, [appointment.id])

  const loadExistingRecord = async () => {
    try {
      const response = await medicalRecordAPI.getByAppointment(appointment.id)
      if (response.data) {
        setExistingRecord(response.data)
        setFormData({
          diagnosis: response.data.diagnosis || '',
          treatment_plan: response.data.treatment_plan || '',
          prescription: response.data.prescription || '',
          notes: response.data.notes || '',
          height: response.data.height || '',
          weight: response.data.weight || '',
          blood_pressure: response.data.blood_pressure || '',
          temperature: response.data.temperature || '',
          heart_rate: response.data.heart_rate || '',
          lab_results: response.data.lab_results || ''
        })
      }
    } catch (error) {
      // No existing record found, that's fine
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Filter out empty values
      const submitData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '')
      )

      await medicalRecordAPI.create(appointment.id, submitData)
      onSuccess()
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save medical record')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const calculateBMI = () => {
    if (!formData.height || !formData.weight) return null
    const heightInMeters = formData.height / 100
    const bmi = formData.weight / (heightInMeters * heightInMeters)
    return bmi.toFixed(1)
  }

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-yellow-600' }
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' }
    if (bmi < 30) return { category: 'Overweight', color: 'text-orange-600' }
    return { category: 'Obese', color: 'text-red-600' }
  }

  const bmi = calculateBMI()
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null

  return (
    <Modal isOpen={true} onClose={onClose} title="Medical Record" size="xl">
      <div className="max-h-96 overflow-y-auto">
        {/* Patient Information */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Patient:</span>
              <p className="text-gray-900">{appointment.patient?.user?.name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Appointment Date:</span>
              <p className="text-gray-900">
                {new Date(appointment.appointment_date).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Reason:</span>
              <p className="text-gray-900">{appointment.reason}</p>
            </div>
            {appointment.symptoms && (
              <div>
                <span className="font-medium text-gray-600">Symptoms:</span>
                <p className="text-gray-900">{appointment.symptoms}</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vital Signs */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Vital Signs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="height" className="form-label">
                  Height (cm)
                </label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="170"
                  step="0.1"
                />
              </div>
              <div>
                <label htmlFor="weight" className="form-label">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="70"
                  step="0.1"
                />
              </div>
              <div>
                <label htmlFor="blood_pressure" className="form-label">
                  Blood Pressure
                </label>
                <input
                  type="text"
                  id="blood_pressure"
                  name="blood_pressure"
                  value={formData.blood_pressure}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="120/80"
                />
              </div>
              <div>
                <label htmlFor="temperature" className="form-label">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  id="temperature"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="36.6"
                  step="0.1"
                />
              </div>
              <div>
                <label htmlFor="heart_rate" className="form-label">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  id="heart_rate"
                  name="heart_rate"
                  value={formData.heart_rate}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="72"
                />
              </div>
            </div>

            {/* BMI Calculation */}
            {bmi && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  BMI: {bmi} - <span className={bmiCategory.color}>{bmiCategory.category}</span>
                </p>
              </div>
            )}
          </div>

          {/* Diagnosis */}
          <div>
            <label htmlFor="diagnosis" className="form-label">
              Diagnosis *
            </label>
            <textarea
              id="diagnosis"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              required
              rows="3"
              className="form-input"
              placeholder="Enter primary diagnosis..."
            />
          </div>

          {/* Treatment Plan */}
          <div>
            <label htmlFor="treatment_plan" className="form-label">
              Treatment Plan
            </label>
            <textarea
              id="treatment_plan"
              name="treatment_plan"
              value={formData.treatment_plan}
              onChange={handleChange}
              rows="3"
              className="form-input"
              placeholder="Describe the treatment plan, procedures, or recommendations..."
            />
          </div>

          {/* Prescription */}
          <div>
            <label htmlFor="prescription" className="form-label">
              Prescription
            </label>
            <textarea
              id="prescription"
              name="prescription"
              value={formData.prescription}
              onChange={handleChange}
              rows="4"
              className="form-input font-mono text-sm"
              placeholder="Enter prescription details including medication name, dosage, frequency, and duration...
              
Example:
- Amoxicillin 500mg: 1 tablet every 8 hours for 7 days
- Ibuprofen 400mg: 1 tablet as needed for pain"
            />
          </div>

          {/* Lab Results */}
          <div>
            <label htmlFor="lab_results" className="form-label">
              Lab Results & Findings
            </label>
            <textarea
              id="lab_results"
              name="lab_results"
              value={formData.lab_results}
              onChange={handleChange}
              rows="3"
              className="form-input"
              placeholder="Enter lab results, imaging findings, or other diagnostic information..."
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label htmlFor="notes" className="form-label">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="form-input"
              placeholder="Any additional observations, follow-up instructions, or patient education..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div>
              {existingRecord && (
                <p className="text-sm text-gray-600">
                  Updating existing medical record from {new Date(existingRecord.created_at).toLocaleDateString()}
                </p>
              )}
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
                    {existingRecord ? 'Update Medical Record' : 'Save Medical Record'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default MedicalRecordForm