import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, Filter, Download, Plus, UserCheck } from 'lucide-react'
import { userAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import PatientCard from './PatientCard'
import SearchBar from '../common/SearchBar'
import LoadingSpinner from '../common/LoadingSpinner'
import Modal from '../common/Modal'

const PatientList = ({ onPatientSelect, showActions = true }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isDoctor = user?.role === 'doctor'
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showPatientModal, setShowPatientModal] = useState(false)

  useEffect(() => {
    loadPatients()
  }, [currentPage])

  useEffect(() => {
    filterPatients()
  }, [patients, searchTerm, statusFilter])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const response = await userAPI.getPatients({
        page: currentPage,
        per_page: 12,
        search: searchTerm || undefined
      })
      setPatients(response.data.data || response.data)
      setTotalPages(response.data.last_page || 1)
    } catch (error) {
      console.error('Error loading patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPatients = () => {
    let filtered = patients

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.user?.phone?.includes(searchTerm)
      )
    }

    // Status filter (you can add more status filters as needed)
    if (statusFilter !== 'all') {
      // Add status-based filtering logic here
    }

    setFilteredPatients(filtered)
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handlePatientSelect = (patient) => {
    if (onPatientSelect) {
      onPatientSelect(patient)
    } else {
      // Navigate to patient details page
      navigate(`/dashboard/patients/${patient.id}`)
    }
  }

  const handleViewMedical = (patient) => {
    // Navigate to medical history or show in modal
    console.log('View medical history for:', patient)
  }

  const handleEdit = (patient) => {
    // Open edit modal or navigate to edit page
    console.log('Edit patient:', patient)
  }

  const handleExport = () => {
    // Export functionality
    console.log('Export patients')
  }

  if (loading && patients.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isDoctor ? 'My Patients' : 'Patients'}
            </h2>
            <p className="text-sm text-gray-600">
              {isDoctor
                ? `${filteredPatients.length} patient${filteredPatients.length !== 1 ? 's' : ''} from your consultations`
                : `${filteredPatients.length} patient${filteredPatients.length !== 1 ? 's' : ''} found`
              }
            </p>
            {isDoctor && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                Showing only patients you have seen
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-64">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search patients..."
              />
            </div>
            
            <div className="flex space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input w-full sm:w-auto"
              >
                <option value="all">All Patients</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {showActions && !isDoctor && (
                <>
                  <button
                    onClick={handleExport}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                  
                  <button className="btn-primary flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Patient
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patients Grid */}
      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPatients.map(patient => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onView={handlePatientSelect}
              onEdit={handleEdit}
              onViewMedical={handleViewMedical}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No matching patients' : 'No patients found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search criteria to find what you\'re looking for.'
              : 'Get started by adding your first patient.'
            }
          </p>
          {!searchTerm && (
            <button className="btn-primary flex items-center mx-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add First Patient
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (
        <Modal
          isOpen={showPatientModal}
          onClose={() => setShowPatientModal(false)}
          title="Patient Details"
          size="xl"
        >
          <div className="max-h-96 overflow-y-auto">
            <PatientCard
              patient={selectedPatient}
              onView={handlePatientSelect}
              onEdit={handleEdit}
              onViewMedical={handleViewMedical}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}

export default PatientList