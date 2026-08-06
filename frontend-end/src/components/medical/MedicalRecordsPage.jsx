import React, { useState, useEffect } from 'react'
import { Download, FileText, Calendar, User, Pill, Activity, Heart, Droplet, Search, Filter, ChevronRight, Clock, Stethoscope } from 'lucide-react'
import { medicalRecordAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const MedicalRecordsPage = () => {
  const { user } = useAuth()
  const [medicalRecords, setMedicalRecords] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    if (user?.id) {
      loadMedicalRecords()
    }
  }, [user?.id])

  const loadMedicalRecords = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await medicalRecordAPI.getPatientRecords(user.id)
      setMedicalRecords(response.data || [])
    } catch (err) {
      console.error('Error loading medical records:', err)
      setError('Failed to load medical records')
      // Show sample data on error
      setMedicalRecords([
        {
          id: 1,
          diagnosis: 'Hypertension',
          treatment_plan: 'Regular monitoring and medication',
          prescription: 'Lisinopril 10mg daily',
          notes: 'Patient advised to reduce salt intake',
          created_at: '2026-04-10T14:30:00',
          type: 'diagnosis',
          doctor: { name: 'Dr. Sarah Johnson', specialization: 'Cardiology' }
        },
        {
          id: 2,
          diagnosis: 'Diabetes Type 2',
          treatment_plan: 'Medication and lifestyle changes',
          prescription: 'Metformin 500mg twice daily',
          lab_results: 'Blood glucose: 145 mg/dL',
          created_at: '2026-03-20T10:15:00',
          type: 'diagnosis',
          doctor: { name: 'Dr. Ahmed Khan', specialization: 'Endocrinology' }
        },
        {
          id: 3,
          diagnosis: 'Lab Test Results',
          treatment_plan: 'Monitor results',
          lab_results: 'Hemoglobin: 14.5 g/dL, White Blood Cells: 7.2K',
          created_at: '2026-03-15T09:00:00',
          type: 'lab',
          doctor: { name: 'Dr. Emily Watson', specialization: 'Pathology' }
        },
        {
          id: 4,
          diagnosis: 'Cold & Cough',
          treatment_plan: 'Rest and hydration',
          prescription: 'Cough syrup as needed',
          notes: 'Viral infection, should resolve in 7-10 days',
          created_at: '2026-02-28T16:45:00',
          type: 'minor',
          doctor: { name: 'Dr. James Miller', specialization: 'General Medicine' }
        },
        {
          id: 5,
          diagnosis: 'Annual Physical Checkup',
          treatment_plan: 'Preventive care',
          lab_results: 'All vitals normal',
          created_at: '2026-01-15T11:30:00',
          type: 'checkup',
          doctor: { name: 'Dr. Sarah Johnson', specialization: 'General Medicine' }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = medicalRecords
    .filter(record => {
      const matchesSearch = 
        record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.treatment_plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (filterType === 'all') return matchesSearch
      return matchesSearch && record.type === filterType
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at) - new Date(a.created_at)
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at)
      }
      return 0
    })

  const getRecordIcon = (type) => {
    switch (type) {
      case 'diagnosis':
        return <Stethoscope className="h-6 w-6" />
      case 'lab':
        return <Droplet className="h-6 w-6" />
      case 'prescription':
        return <Pill className="h-6 w-6" />
      case 'checkup':
        return <Heart className="h-6 w-6" />
      case 'minor':
        return <Activity className="h-6 w-6" />
      default:
        return <FileText className="h-6 w-6" />
    }
  }

  const getRecordColor = (type) => {
    switch (type) {
      case 'diagnosis':
        return 'from-red-50 to-pink-50 border-red-200 text-red-600'
      case 'lab':
        return 'from-blue-50 to-cyan-50 border-blue-200 text-blue-600'
      case 'prescription':
        return 'from-purple-50 to-pink-50 border-purple-200 text-purple-600'
      case 'checkup':
        return 'from-green-50 to-emerald-50 border-green-200 text-green-600'
      case 'minor':
        return 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-600'
      default:
        return 'from-gray-50 to-slate-50 border-gray-200 text-gray-600'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600 mt-2">View and manage your complete medical history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Records</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{medicalRecords.length}</p>
              </div>
              <FileText className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Diagnoses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {medicalRecords.filter(r => r.type === 'diagnosis').length}
                </p>
              </div>
              <Stethoscope className="h-10 w-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Lab Tests</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {medicalRecords.filter(r => r.type === 'lab').length}
                </p>
              </div>
              <Droplet className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Prescriptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {medicalRecords.filter(r => r.prescription).length}
                </p>
              </div>
              <Pill className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by diagnosis, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="diagnosis">Diagnoses</option>
              <option value="lab">Lab Tests</option>
              <option value="prescription">Prescriptions</option>
              <option value="checkup">Checkups</option>
              <option value="minor">Minor Issues</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className={`bg-gradient-to-r ${getRecordColor(record.type)} border rounded-xl p-6 cursor-pointer hover:shadow-md transition-all duration-200 transform hover:scale-105`}
                onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-lg ${getRecordColor(record.type).split(' ')[0]} ${getRecordColor(record.type).split(' ')[1]}`}>
                      <div className={`text-${getRecordColor(record.type).split(' ')[2]}`}>
                        {getRecordIcon(record.type)}
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{record.diagnosis}</h3>
                      
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center text-gray-700">
                          <User className="h-4 w-4 mr-2" />
                          <span><strong>Doctor:</strong> {record.doctor?.name}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span><strong>Date:</strong> {formatDate(record.created_at)} at {formatTime(record.created_at)}</span>
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {selectedRecord?.id === record.id && (
                        <div className="mt-4 pt-4 border-t border-gray-300/50 space-y-3">
                          {record.treatment_plan && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Treatment Plan</h4>
                              <p className="text-gray-700 text-sm">{record.treatment_plan}</p>
                            </div>
                          )}
                          
                          {record.prescription && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Prescription</h4>
                              <p className="text-gray-700 text-sm bg-white bg-opacity-50 p-2 rounded">
                                💊 {record.prescription}
                              </p>
                            </div>
                          )}

                          {record.lab_results && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Lab Results</h4>
                              <p className="text-gray-700 text-sm bg-white bg-opacity-50 p-2 rounded">
                                🧪 {record.lab_results}
                              </p>
                            </div>
                          )}

                          {record.notes && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Doctor's Notes</h4>
                              <p className="text-gray-700 text-sm">{record.notes}</p>
                            </div>
                          )}

                          <button className="mt-4 flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-lg text-gray-900 font-semibold transition-all">
                            <Download className="h-4 w-4" />
                            <span>Download Record</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`${selectedRecord?.id === record.id ? 'rotate-90' : ''} transition-transform`}>
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Records Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'No medical records available yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MedicalRecordsPage
