import React from 'react'
import { Calendar, User, Stethoscope, Activity, Heart, Thermometer, FileText } from 'lucide-react'
import { formatDateTime } from '../../utils/helpers'

const MedicalRecordView = ({ medicalRecord, appointment }) => {
  if (!medicalRecord) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical Record</h3>
        <p className="text-gray-600">No medical record has been created for this appointment yet.</p>
      </div>
    )
  }

  const calculateBMI = () => {
    if (!medicalRecord.height || !medicalRecord.weight) return null
    const heightInMeters = medicalRecord.height / 100
    const bmi = medicalRecord.weight / (heightInMeters * heightInMeters)
    return bmi.toFixed(1)
  }

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'bg-yellow-100 text-yellow-800' }
    if (bmi < 25) return { category: 'Normal', color: 'bg-green-100 text-green-800' }
    if (bmi < 30) return { category: 'Overweight', color: 'bg-orange-100 text-orange-800' }
    return { category: 'Obese', color: 'bg-red-100 text-red-800' }
  }

  const bmi = calculateBMI()
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Medical Record</h2>
            <p className="text-sm text-gray-600">
              Created on {formatDateTime(medicalRecord.created_at)}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Stethoscope className="h-4 w-4" />
            <span>Dr. {appointment.doctor?.name}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Patient and Appointment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Patient Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">Name:</span>
                <p className="text-gray-900">{appointment.patient?.user?.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Appointment Date:</span>
                <p className="text-gray-900">{formatDateTime(appointment.appointment_date)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Reason for Visit:</span>
                <p className="text-gray-900">{appointment.reason}</p>
              </div>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Vital Signs
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {medicalRecord.height && (
                <div>
                  <span className="font-medium text-gray-600">Height:</span>
                  <p className="text-gray-900">{medicalRecord.height} cm</p>
                </div>
              )}
              {medicalRecord.weight && (
                <div>
                  <span className="font-medium text-gray-600">Weight:</span>
                  <p className="text-gray-900">{medicalRecord.weight} kg</p>
                </div>
              )}
              {medicalRecord.blood_pressure && (
                <div>
                  <span className="font-medium text-gray-600">Blood Pressure:</span>
                  <p className="text-gray-900">{medicalRecord.blood_pressure}</p>
                </div>
              )}
              {medicalRecord.temperature && (
                <div>
                  <span className="font-medium text-gray-600">Temperature:</span>
                  <p className="text-gray-900">{medicalRecord.temperature}°C</p>
                </div>
              )}
              {medicalRecord.heart_rate && (
                <div>
                  <span className="font-medium text-gray-600">Heart Rate:</span>
                  <p className="text-gray-900">{medicalRecord.heart_rate} bpm</p>
                </div>
              )}
            </div>
            {bmi && (
              <div className="mt-3">
                <span className="font-medium text-gray-600">BMI:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900">{bmi}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${bmiCategory.color}`}>
                    {bmiCategory.category}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Diagnosis */}
        {medicalRecord.diagnosis && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Diagnosis</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{medicalRecord.diagnosis}</p>
            </div>
          </div>
        )}

        {/* Treatment Plan */}
        {medicalRecord.treatment_plan && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Treatment Plan</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{medicalRecord.treatment_plan}</p>
            </div>
          </div>
        )}

        {/* Prescription */}
        {medicalRecord.prescription && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Prescription</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <pre className="text-gray-900 whitespace-pre-wrap font-sans text-sm">
                {medicalRecord.prescription}
              </pre>
            </div>
          </div>
        )}

        {/* Lab Results */}
        {medicalRecord.lab_results && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Lab Results & Findings</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{medicalRecord.lab_results}</p>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {medicalRecord.notes && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Notes</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{medicalRecord.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              <p>Record ID: {medicalRecord.id}</p>
              <p>Last updated: {formatDateTime(medicalRecord.updated_at)}</p>
            </div>
            <div className="text-right">
              <p>Attending Physician</p>
              <p className="font-medium text-gray-900">Dr. {appointment.doctor?.name}</p>
              {appointment.doctor?.specialization && (
                <p className="text-gray-600">{appointment.doctor.specialization}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MedicalRecordView