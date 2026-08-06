import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Calendar, Clock, User, FileText, Plus, History, AlertCircle, CheckCircle, Heart, Settings, Receipt, Activity, TrendingUp, MapPin, Phone, Mail, Stethoscope, Pill, Bell, ChevronRight, X } from 'lucide-react'
import { appointmentAPI, dashboardAPI, medicalRecordAPI, billingAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import StatsCard from '../common/StatsCard'
import AppointmentList from '../appointments/AppointmentList'
import AppointmentForm from '../appointments/AppointmentForm'
import PatientMedicalHistory from '../medical/PatientMedicalHistory'
import LoadingSpinner from '../common/LoadingSpinner'

const PatientDashboard = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [appointments, setAppointments] = useState([])
  const [medicalRecords, setMedicalRecords] = useState([])
  const [bills, setBills] = useState([])
  const [stats, setStats] = useState({})
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Determine active tab based on URL path
  const getInitialTab = () => {
    if (location.pathname.includes('/medical-records')) return 'medical'
    if (location.pathname.includes('/billing')) return 'billing'
    if (location.pathname.includes('/profile')) return 'profile'
    return 'appointments'
  }

  const [activeTab, setActiveTab] = useState(getInitialTab())

  useEffect(() => {
    // Update active tab when location changes
    setActiveTab(getInitialTab())
  }, [location.pathname])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setError(null)
      const [appointmentsRes, statsRes] = await Promise.all([
        appointmentAPI.getAll(),
        dashboardAPI.getStats()
      ])
      setAppointments(appointmentsRes.data || [])
      setStats(statsRes.data || {})

      // Load medical records and bills if patient has appointments
      if (appointmentsRes.data && appointmentsRes.data.length > 0) {
        const patientId = appointmentsRes.data[0]?.patient_id
        if (patientId) {
          const [recordsRes, billsRes] = await Promise.all([
            medicalRecordAPI.getPatientRecords(patientId),
            billingAPI.getPatientBills(patientId)
          ])
          setMedicalRecords(recordsRes.data || [])
          setBills(billsRes.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const upcomingAppointments = appointments.filter(apt => 
    ['scheduled', 'confirmed'].includes(apt.status)
  )

  const pastAppointments = appointments.filter(apt => 
    ['completed', 'cancelled'].includes(apt.status)
  )

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start space-x-3 shadow-sm animate-in slide-in-from-top">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Enhanced Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/60 shadow-xl shadow-blue-100/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Welcome Section */}
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <User className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-1">
                    Welcome back, {user?.name?.split(' ')[0] || 'Patient'}! 👋
                  </h1>
                  <p className="text-slate-600 text-sm sm:text-base">
                    {upcomingAppointments.length > 0 
                      ? `You have ${upcomingAppointments.length} upcoming appointment${upcomingAppointments.length > 1 ? 's' : ''}`
                      : 'Your health dashboard is ready'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs sm:text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {user?.email}
                    </span>
                    {user?.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        {user.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowAppointmentForm(true)}
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-xl shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/40 w-full lg:w-auto overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <Plus className="h-5 w-5 mr-2 relative z-10" />
                <span className="relative z-10">Book New Appointment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-white/60" />
            </div>
            <div className="text-white">
              <p className="text-3xl font-bold mb-1">{stats.upcoming_appointments || 0}</p>
              <p className="text-blue-100 text-sm font-medium">Upcoming Appointments</p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <Activity className="h-5 w-5 text-white/60" />
            </div>
            <div className="text-white">
              <p className="text-3xl font-bold mb-1">{stats.total_appointments || 0}</p>
              <p className="text-emerald-100 text-sm font-medium">Total Appointments</p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <Heart className="h-5 w-5 text-white/60" />
            </div>
            <div className="text-white">
              <p className="text-3xl font-bold mb-1">{stats.completed_appointments || 0}</p>
              <p className="text-purple-100 text-sm font-medium">Completed Visits</p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <Stethoscope className="h-5 w-5 text-white/60" />
            </div>
            <div className="text-white">
              <p className="text-3xl font-bold mb-1">{medicalRecords.length}</p>
              <p className="text-amber-100 text-sm font-medium">Medical Records</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Content Area - 8 cols */}
          <div className="col-span-12 lg:col-span-8">
            {/* Navigation Tabs */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mb-6">
              <div className="p-1.5 bg-slate-100/50">
                <nav className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('appointments')}
                    className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center space-x-2 rounded-xl transition-all duration-200 cursor-pointer ${
                      activeTab === 'appointments'
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Calendar className="h-4.5 w-4.5" />
                    <span className="hidden sm:inline">Appointments</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('medical')}
                    className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center space-x-2 rounded-xl transition-all duration-200 cursor-pointer ${
                      activeTab === 'medical'
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <FileText className="h-4.5 w-4.5" />
                    <span className="hidden sm:inline">Medical History</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('billing')}
                    className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center space-x-2 rounded-xl transition-all duration-200 cursor-pointer ${
                      activeTab === 'billing'
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Receipt className="h-4.5 w-4.5" />
                    <span className="hidden sm:inline">Billing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center space-x-2 rounded-xl transition-all duration-200 cursor-pointer ${
                      activeTab === 'profile'
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <User className="h-4.5 w-4.5" />
                    <span className="hidden sm:inline">Profile</span>
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6 space-y-6">
                {/* Appointments Tab */}
                {activeTab === 'appointments' && (
                  <div className="space-y-6">
                    {/* Next Appointment Highlight */}
                    {upcomingAppointments.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl mb-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">NEXT APPOINTMENT</p>
                            <h3 className="text-2xl font-bold">
                              {new Date(upcomingAppointments[0].appointment_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h3>
                          </div>
                          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Calendar className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Clock className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-blue-100 text-xs">Time</p>
                              <p className="font-semibold">{upcomingAppointments[0].scheduled_time || 'TBD'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Stethoscope className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-blue-100 text-xs">Doctor</p>
                              <p className="font-semibold">{upcomingAppointments[0].doctor?.name || 'Assigned'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-blue-100 text-xs">Department</p>
                              <p className="font-semibold">{upcomingAppointments[0].department?.name || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                            Queue: {upcomingAppointments[0].queue_number || 'Pending'}
                          </span>
                          <button className="flex items-center space-x-2 text-white hover:text-blue-100 transition-colors">
                            <span className="text-sm font-medium">View Details</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Upcoming Appointments */}
                    {upcomingAppointments.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                              <Clock className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">Upcoming Appointments</h2>
                              <p className="text-sm text-gray-500">Your scheduled visits</p>
                            </div>
                          </div>
                          <span className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">
                            {upcomingAppointments.length}
                          </span>
                        </div>
                        <AppointmentList 
                          appointments={upcomingAppointments} 
                          onUpdate={loadData}
                          userRole="patient"
                        />
                      </div>
                    )}

                    {/* Past Appointments */}
                    {pastAppointments.length > 0 && (
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-gray-100 rounded-lg mr-3">
                              <History className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">Appointment History</h2>
                              <p className="text-sm text-gray-500">Past visits and records</p>
                            </div>
                          </div>
                          <span className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-full">
                            {pastAppointments.length}
                          </span>
                        </div>
                        <AppointmentList 
                          appointments={pastAppointments} 
                          onUpdate={loadData}
                          userRole="patient"
                        />
                      </div>
                    )}

                    {appointments.length === 0 && (
                      <div className="text-center py-20">
                        <div className="flex justify-center mb-6">
                          <div className="relative">
                            <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                            <div className="relative p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full">
                              <Calendar className="h-12 w-12 text-blue-600" />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No appointments yet</h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                          Start your healthcare journey by booking your first appointment with our medical professionals.
                        </p>
                        <button
                          onClick={() => setShowAppointmentForm(true)}
                          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Schedule Your First Appointment
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Medical History Tab */}
                {activeTab === 'medical' && (
                  <div className="space-y-6">
                    <div className="flex items-center mb-4">
                      <Heart className="h-5 w-5 text-red-600 mr-2" />
                      <h2 className="text-xl font-bold text-gray-900">Medical History</h2>
                      <span className="ml-2 px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                        {medicalRecords.length}
                      </span>
                    </div>
                    {medicalRecords.length > 0 ? (
                      <PatientMedicalHistory medicalRecords={medicalRecords} />
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No medical records available yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Billing History Tab */}
                {activeTab === 'billing' && (
                  <div className="space-y-6">
                    <div className="flex items-center mb-4">
                      <Receipt className="h-5 w-5 text-blue-600 mr-2" />
                      <h2 className="text-xl font-bold text-gray-900">Billing History</h2>
                      <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                        {bills.length}
                      </span>
                    </div>
                    {bills.length > 0 ? (
                      <div className="space-y-4">
                        {bills.map(bill => (
                          <div key={bill.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">Invoice #{bill.id.toString().padStart(5, '0')}</h3>
                                <p className="text-sm text-gray-500">Date: {new Date(bill.created_at).toLocaleDateString()}</p>
                              </div>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                bill.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {bill.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="border-t border-b border-gray-100 py-3 mb-3 space-y-2">
                              {bill.items?.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span className="text-gray-700">{item.description}</span>
                                  <span className="font-medium">₱{parseFloat(item.total).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-1">
                              {parseFloat(bill.philhealth_discount) > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                  <span>PhilHealth Discount (20%)</span>
                                  <span>-₱{parseFloat(bill.philhealth_discount).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-base font-bold text-gray-900 pt-2">
                                <span>Total Amount Due</span>
                                <span>₱{parseFloat(bill.net_amount).toFixed(2)}</span>
                              </div>
                            </div>
                            {bill.status === 'paid' && (
                              <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded flex justify-between">
                                <span>Paid via {bill.payment_method?.toUpperCase()}</span>
                                <span>{new Date(bill.paid_at).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No billing history available.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      My Profile
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Information */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                        <div className="space-y-4">
                          <ProfileField label="Full Name" value={user?.name || 'N/A'} />
                          <ProfileField label="Email" value={user?.email || 'N/A'} />
                          <ProfileField label="Phone" value={user?.phone || 'Not provided'} />
                          <ProfileField label="Role" value={user?.role || 'Patient'} />
                        </div>
                      </div>
                      
                      {/* Medical Information */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h3>
                        <div className="space-y-4">
                          <ProfileField label="Account Status" value="Active" badge="active" />
                          <ProfileField label="Total Appointments" value={stats.total_appointments || 0} />
                          <ProfileField label="Medical Records" value={medicalRecords.length} />
                          <ProfileField label="Member Since" value="April 2026" />
                        </div>
                      </div>
                    </div>

                    {/* Edit Profile Button */}
                    <div className="flex justify-end pt-4">
                      <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200">
                        Edit Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Column - 4 cols */}
          <div className="col-span-12 lg:col-span-4">
            <div className="space-y-6 lg:sticky lg:top-6">
              {/* Enhanced Profile Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-6 text-white">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-4 ring-white/30">
                      <User className="h-8 w-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{user?.name || 'Patient'}</h3>
                      <p className="text-blue-100 text-sm">Patient ID: #{user?.id || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-blue-50">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{user?.email || 'N/A'}</span>
                    </div>
                    {user?.phone && (
                      <div className="flex items-center space-x-2 text-blue-50">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 pt-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-200 font-medium">Active Account</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Enhanced */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/60 p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowAppointmentForm(true)}
                    className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl text-blue-700 font-semibold transition-all duration-200 border border-blue-200/50 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="p-2 bg-blue-500 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs">Book Now</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('medical')}
                    className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-xl text-emerald-700 font-semibold transition-all duration-200 border border-emerald-200/50 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="p-2 bg-emerald-500 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs">Records</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('billing')}
                    className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl text-purple-700 font-semibold transition-all duration-200 border border-purple-200/50 hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="p-2 bg-purple-500 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                      <Receipt className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs">Billing</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 rounded-xl text-amber-700 font-semibold transition-all duration-200 border border-amber-200/50 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="p-2 bg-amber-500 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs">Profile</span>
                  </button>
                </div>
              </div>

              {/* Health Stats - Enhanced */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl shadow-lg border border-green-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  Health Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white/90 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Total Visits</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stats.total_appointments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white/90 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Completed</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stats.completed_appointments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white/90 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-100 rounded-lg group-hover:scale-110 transition-transform">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Pending</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{upcomingAppointments.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white/90 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Records</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{medicalRecords.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Health Tips - Enhanced */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <Pill className="h-5 w-5 mr-2 text-pink-600" />
                  Daily Health Tips
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">💧</span>
                    </div>
                    <p className="text-sm text-gray-700">Drink 8 glasses of water daily for optimal hydration</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-xl">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">🏃</span>
                    </div>
                    <p className="text-sm text-gray-700">Exercise 30 minutes daily to stay active and healthy</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-xl">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">😴</span>
                    </div>
                    <p className="text-sm text-gray-700">Sleep 7-9 hours each night for better recovery</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-xl">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">🥗</span>
                    </div>
                    <p className="text-sm text-gray-700">Eat balanced meals with fruits and vegetables</p>
                  </div>
                </div>
              </div>

              {/* Alert if no appointments */}
              {upcomingAppointments.length === 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-amber-500 rounded-lg flex-shrink-0">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-900 mb-1">No Upcoming Appointments</p>
                      <p className="text-amber-700 text-sm">Schedule your next visit to maintain your health routine</p>
                      <button
                        onClick={() => setShowAppointmentForm(true)}
                        className="mt-3 text-sm font-semibold text-amber-900 hover:text-amber-700 flex items-center group"
                      >
                        Book Now
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Form Modal */}
        {showAppointmentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
                <button
                  onClick={() => setShowAppointmentForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-light"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <AppointmentForm onSuccess={() => {
                  setShowAppointmentForm(false)
                  loadData()
                }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper component for profile fields (used in Profile tab)
const ProfileField = ({ label, value, badge }) => (
  <div>
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">{label}</label>
    <div className="flex items-center gap-2">
      <p className="text-gray-900 font-medium">{value}</p>
      {badge === 'active' && (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>
      )}
    </div>
  </div>
)

export default PatientDashboard
