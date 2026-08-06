import React, { useState, useEffect } from 'react'
import { Search, User, Phone, Mail, Calendar, Filter, X } from 'lucide-react'
import { userAPI } from '../../services/api'
import { formatDate, calculateAge } from '../../utils/helpers'
import LoadingSpinner from '../common/LoadingSpinner'
import Modal from '../common/Modal'

const PatientSearch = ({ onPatientSelect, showAdvanced = false }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [filters, setFilters] = useState({
    gender: '',
    ageRange: '',
    hasMedicalHistory: ''
  })

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const delayDebounce = setTimeout(() => {
        performSearch()
      }, 500)

      return () => clearTimeout(delayDebounce)
    } else {
      setPatients([])
      setShowResults(false)
    }
  }, [searchTerm])

  const performSearch = async () => {
    try {
      setLoading(true)
      const response = await userAPI.getPatients({ search: searchTerm })
      setPatients(response.data.data || response.data)
      setShowResults(true)
    } catch (error) {
      console.error('Error searching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePatientSelect = (patient) => {
    if (onPatientSelect) {
      onPatientSelect(patient)
    } else {
      setSelectedPatient(patient)
      setShowDetailsModal(true)
    }
    setShowResults(false)
    setSearchTerm('')
  }

  const clearSearch = () => {
    setSearchTerm('')
    setPatients([])
    setShowResults(false)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      gender: '',
      ageRange: '',
      hasMedicalHistory: ''
    })
  }

  const filteredPatients = patients.filter(patient => {
    if (filters.gender && patient.gender !== filters.gender) return false
    if (filters.ageRange) {
      const age = calculateAge(patient.date_of_birth)
      if (!age) return false
      
      switch (filters.ageRange) {
        case 'child': return age < 18
        case 'adult': return age >= 18 && age < 65
        case 'senior': return age >= 65
        default: return true
      }
    }
    return true
  })

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search patients by name, email, or phone..."
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Age Range</label>
              <select
                value={filters.ageRange}
                onChange={(e) => handleFilterChange('ageRange', e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Ages</option>
                <option value="child">Child (0-17)</option>
                <option value="adult">Adult (18-64)</option>
                <option value="senior">Senior (65+)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Medical History</label>
              <select
                value={filters.hasMedicalHistory}
                onChange={(e) => handleFilterChange('hasMedicalHistory', e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Patients</option>
                <option value="with_records">With Medical Records</option>
                <option value="without_records">Without Medical Records</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4">
              <LoadingSpinner size="small" text="Searching..." />
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="py-1">
              {filteredPatients.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {patient.user?.name}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500 truncate">
                            {patient.user?.email}
                          </span>
                        </div>
                        {patient.user?.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {patient.user.phone}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        {patient.date_of_birth && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDate(patient.date_of_birth)}
                              {calculateAge(patient.date_of_birth) && ` (${calculateAge(patient.date_of_birth)} yrs)`}
                            </span>
                          </div>
                        )}
                        {patient.gender && (
                          <span className="text-xs text-gray-500 capitalize">
                            {patient.gender}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">ID: {patient.id}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-900">No patients found</p>
              <p className="text-xs text-gray-500 mt-1">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}
        </div>
      )}

      {/* Patient Details Modal */}
      {showDetailsModal && selectedPatient && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Patient Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedPatient.user?.name}
                </h3>
                <p className="text-gray-600">Patient ID: {selectedPatient.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{selectedPatient.user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-gray-900">{selectedPatient.user?.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                <p className="text-gray-900">
                  {selectedPatient.date_of_birth ? formatDate(selectedPatient.date_of_birth) : 'Not provided'}
                  {calculateAge(selectedPatient.date_of_birth) && ` (${calculateAge(selectedPatient.date_of_birth)} years)`}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Gender</label>
                <p className="text-gray-900 capitalize">{selectedPatient.gender || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="text-gray-900">{selectedPatient.user?.address || 'Not provided'}</p>
              </div>
            </div>

            {(selectedPatient.blood_type || selectedPatient.allergies) && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Medical Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPatient.blood_type && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Blood Type</label>
                      <p className="text-gray-900">{selectedPatient.blood_type}</p>
                    </div>
                  )}
                  {selectedPatient.allergies && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Allergies</label>
                      <p className="text-gray-900">{selectedPatient.allergies}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button className="btn-primary">
                View Full Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default PatientSearch