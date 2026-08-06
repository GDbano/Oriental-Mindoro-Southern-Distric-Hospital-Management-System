import React, { useState } from 'react'
import { Calendar, User, Stethoscope, FileText, Search, Filter, Heart, Activity, Thermometer, Droplet, Eye, Pill, ClipboardList, TrendingUp, ChevronRight, Download, Share2, X } from 'lucide-react'
import { formatDateTime } from '../../utils/helpers'
import MedicalRecordView from './MedicalRecordView'
import Modal from '../common/Modal'
import SearchBar from '../common/SearchBar'

const PatientMedicalHistory = ({ medicalRecords }) => {
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.treatment_plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.prescription?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === 'with_prescription') {
      return matchesSearch && record.prescription
    }
    if (filterStatus === 'with_lab_results') {
      return matchesSearch && record.lab_results
    }
    
    return matchesSearch
  })

  const handleViewRecord = (record) => {
    setSelectedRecord(record)
    setShowRecordModal(true)
  }

  const getAppointmentForRecord = (record) => {
    // In a real app, this would come from the API
    return {
      id: record.appointment_id,
      patient: { user: { name: "Patient Name" } },
      doctor: { name: "Dr. Smith", specialization: "General Medicine" },
      appointment_date: record.created_at,
      reason: "Regular checkup"
    }
  }

  if (medicalRecords.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-12 text-center border border-blue-100">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full">
              <FileText className="h-16 w-16 text-blue-600" />
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Medical History Yet</h3>
        <p className="text-gray-600 mb-2 text-lg">Your medical records will appear here after your appointments.</p>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Healthcare providers will document your visits, diagnoses, treatments, and prescriptions in this section.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header and Filters */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-slate-200/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Medical History</h2>
              <p className="text-sm text-gray-600 mt-1">
                {medicalRecords.length} medical record{medicalRecords.length !== 1 ? 's' : ''} • Complete health timeline
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search diagnoses, treatments..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-8 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer"
              >
                <option value="all">All Records</option>
                <option value="with_prescription">With Prescription</option>
                <option value="with_lab_results">With Lab Results</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <ClipboardList className="h-8 w-8 opacity-80" />
            <TrendingUp className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-3xl font-bold mb-1">{medicalRecords.length}</p>
          <p className="text-blue-100 text-sm font-medium">Total Records</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Pill className="h-8 w-8 opacity-80" />
            <Activity className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-3xl font-bold mb-1">
            {medicalRecords.filter(r => r.prescription).length}
          </p>
          <p className="text-purple-100 text-sm font-medium">Prescriptions</p>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-8 w-8 opacity-80" />
            <Heart className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-3xl font-bold mb-1">
            {medicalRecords.filter(r => r.lab_results).length}
          </p>
          <p className="text-emerald-100 text-sm font-medium">Lab Results</p>
        </div>
      </div>

      {/* Enhanced Records Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRecords.map((record) => {
          const appointment = getAppointmentForRecord(record)
          return (
            <div
              key={record.id}
              className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
              onClick={() => handleViewRecord(record)}
            >
              {/* Card Header with Gradient */}
              <div className="px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      {new Date(record.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {record.prescription && (
                      <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold flex items-center space-x-1">
                        <Pill className="h-3 w-3" />
                        <span>Rx</span>
                      </span>
                    )}
                    {record.lab_results && (
                      <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold flex items-center space-x-1">
                        <Activity className="h-3 w-3" />
                        <span>Lab</span>
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Doctor Info */}
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {appointment.doctor.name}
                    </p>
                    <p className="text-xs text-blue-100 truncate">
                      {appointment.doctor.specialization}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                {/* Diagnosis */}
                {record.diagnosis && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <div className="flex items-start space-x-2 mb-2">
                      <ClipboardList className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-red-900 uppercase tracking-wide">Diagnosis</p>
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-2 leading-relaxed">
                      {record.diagnosis}
                    </p>
                  </div>
                )}

                {/* Treatment */}
                {record.treatment_plan && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start space-x-2 mb-2">
                      <Heart className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">Treatment Plan</p>
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-2 leading-relaxed">
                      {record.treatment_plan}
                    </p>
                  </div>
                )}

                {/* Vital Signs */}
                <div className="grid grid-cols-2 gap-3">
                  {record.blood_pressure && (
                    <div className="flex items-center space-x-2 p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-100">
                      <div className="p-1.5 bg-red-500 rounded-lg">
                        <Droplet className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 font-medium">Blood Pressure</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{record.blood_pressure}</p>
                      </div>
                    </div>
                  )}
                  {record.temperature && (
                    <div className="flex items-center space-x-2 p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                      <div className="p-1.5 bg-orange-500 rounded-lg">
                        <Thermometer className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 font-medium">Temperature</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{record.temperature}°C</p>
                      </div>
                    </div>
                  )}
                  {record.heart_rate && (
                    <div className="flex items-center space-x-2 p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-100">
                      <div className="p-1.5 bg-pink-500 rounded-lg">
                        <Heart className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 font-medium">Heart Rate</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{record.heart_rate} bpm</p>
                      </div>
                    </div>
                  )}
                  {record.height && record.weight && (
                    <div className="flex items-center space-x-2 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                      <div className="p-1.5 bg-purple-500 rounded-lg">
                        <Activity className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 font-medium">BMI</p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {calculateBMI(record.height, record.weight)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewRecord(record)
                  }}
                  className="group/btn w-full flex items-center justify-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Full Record</span>
                  <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* No Results */}
      {filteredRecords.length === 0 && medicalRecords.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gray-100 rounded-full">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">No matching records found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search or filter criteria to find what you're looking for.
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterStatus('all')
            }}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        </div>
      )}

      {/* Medical Record Modal */}
      {showRecordModal && selectedRecord && (
        <Modal
          isOpen={showRecordModal}
          onClose={() => setShowRecordModal(false)}
          title="Medical Record Details"
          size="xl"
        >
          <MedicalRecordView
            medicalRecord={selectedRecord}
            appointment={getAppointmentForRecord(selectedRecord)}
          />
        </Modal>
      )}
    </div>
  )
}

// Helper function to calculate BMI
const calculateBMI = (height, weight) => {
  if (!height || !weight) return 'N/A'
  const heightInMeters = height / 100
  const bmi = weight / (heightInMeters * heightInMeters)
  return bmi.toFixed(1)
}

export default PatientMedicalHistory