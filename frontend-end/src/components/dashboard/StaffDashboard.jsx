import React, { useState, useEffect } from 'react'
import { Calendar, Search, AlertTriangle, Users, Clock, Phone, Mail, Plus, ArrowRight } from 'lucide-react'
import { dashboardAPI, appointmentAPI, inventoryAPI, userAPI } from '../../services/api'
import StatsCard from '../common/StatsCard'
import AppointmentCalendar from '../appointments/AppointmentCalendar'
import PatientSearch from '../patients/PatientSearch'
import LoadingSpinner from '../common/LoadingSpinner'

const StaffDashboard = () => {
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({})
  const [lowStockItems, setLowStockItems] = useState([])
  const [recentPatients, setRecentPatients] = useState([])
  const [activeView, setActiveView] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [appointmentsRes, statsRes, lowStockRes, patientsRes] = await Promise.all([
        appointmentAPI.getAll(),
        dashboardAPI.getStats(),
        inventoryAPI.getLowStock(),
        userAPI.getPatients({ per_page: 5 })
      ])
      setAppointments(appointmentsRes.data)
      setStats(statsRes.data)
      setLowStockItems(lowStockRes.data)
      setRecentPatients(patientsRes.data.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const todayAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date).toDateString() === new Date().toDateString()
  )

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date) > new Date() && 
    ['scheduled', 'confirmed'].includes(apt.status)
  ).slice(0, 5)

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage clinic operations and patient services</p>
            </div>
            <div className="text-right bg-white rounded-xl shadow-sm p-4 min-w-64">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <p className="font-semibold text-gray-900 text-lg">Staff Member</p>
              <p className="text-sm text-blue-600 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Today's Appointments"
            value={stats.today_appointments || 0}
            icon={Calendar}
            color="blue"
          />
          <StatsCard
            title="Pending Appointments"
            value={stats.pending_appointments || 0}
            icon={Clock}
            color="yellow"
          />
          <StatsCard
            title="Total Patients"
            value={stats.total_patients || 0}
            icon={Users}
            color="green"
          />
          <StatsCard
            title="Low Stock Items"
            value={stats.low_stock_items || 0}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Dashboard Overview', icon: Users },
                { id: 'calendar', label: 'Appointment Calendar', icon: Calendar },
                { id: 'patients', label: 'Patient Management', icon: Search },
                { id: 'inventory', label: 'Inventory Alerts', icon: AlertTriangle }
              ].map(tab => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                      activeView === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeView === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Today's Schedule */}
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
                          <p className="text-gray-600">
                            {todayAppointments.length} appointments for today
                          </p>
                        </div>
                        <button 
                          onClick={() => setActiveView('calendar')}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                        >
                          View Calendar
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {todayAppointments.map(appointment => (
                          <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors duration-200 group">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex-shrink-0">
                                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                  <Users className="h-6 w-6 text-blue-600" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-base font-semibold text-gray-900">
                                  {appointment.patient?.user?.name || 'Unknown Patient'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  with Dr. {appointment.doctor?.name}
                                </p>
                                <p className="text-sm text-blue-600 font-medium">
                                  {new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {appointment.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                        {todayAppointments.length === 0 && (
                          <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">No appointments scheduled for today</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Patient Search */}
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <Search className="h-5 w-5 mr-2" />
                        Quick Patient Search
                      </h2>
                    </div>
                    <div className="p-6">
                      <PatientSearch />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Recent Patients */}
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Patients</h2>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {recentPatients.length} new
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {recentPatients.map(patient => (
                          <div key={patient.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {patient.user?.name?.charAt(0) || 'P'}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {patient.user?.name}
                              </p>
                              <p className="text-xs text-gray-600 flex items-center mt-1">
                                <Phone className="h-3 w-3 mr-1" />
                                {patient.user?.phone || 'No phone'}
                              </p>
                            </div>
                          </div>
                        ))}
                        {recentPatients.length === 0 && (
                          <p className="text-center text-gray-500 py-4">No recent patients</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Low Stock Alerts */}
                  <div className="bg-white rounded-xl border border-red-200 bg-red-50">
                    <div className="px-6 py-4 border-b border-red-200">
                      <h2 className="text-lg font-semibold text-red-900 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Low Stock Alerts
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {lowStockItems.slice(0, 3).map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-red-900 truncate">{item.name}</p>
                              <p className="text-xs text-red-700">{item.category}</p>
                            </div>
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium whitespace-nowrap ml-2">
                              {item.quantity} left
                            </span>
                          </div>
                        ))}
                        {lowStockItems.length === 0 && (
                          <p className="text-center text-gray-500 py-2">No low stock items</p>
                        )}
                        {lowStockItems.length > 3 && (
                          <button 
                            onClick={() => setActiveView('inventory')}
                            className="w-full text-center text-sm text-red-700 hover:text-red-800 font-medium py-2"
                          >
                            View all {lowStockItems.length} items
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        <button 
                          onClick={() => setActiveView('calendar')}
                          className="w-full text-left p-4 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-blue-600 group-hover:text-blue-700">View Full Calendar</span>
                              <p className="text-sm text-gray-600 mt-1">See all appointments</p>
                            </div>
                            <Calendar className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
                          </div>
                        </button>
                        <button 
                          onClick={() => setActiveView('patients')}
                          className="w-full text-left p-4 border-2 border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50 transition-all duration-200 group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-green-600 group-hover:text-green-700">Manage Patients</span>
                              <p className="text-sm text-gray-600 mt-1">Search and view patients</p>
                            </div>
                            <Users className="h-5 w-5 text-green-600 group-hover:text-green-700" />
                          </div>
                        </button>
                        <button className="w-full text-left p-4 border-2 border-gray-100 rounded-xl bg-gray-50 opacity-75 cursor-not-allowed">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-gray-600">Send Reminders</span>
                              <p className="text-sm text-gray-500 mt-1">(Coming Soon)</p>
                            </div>
                            <Mail className="h-5 w-5 text-gray-500" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'calendar' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Appointment Calendar</h2>
                  <p className="text-gray-600">View and manage all appointments</p>
                </div>
                <AppointmentCalendar appointments={appointments} />
              </div>
            )}

            {activeView === 'patients' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
                  <p className="text-gray-600">Search and manage patient records</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <PatientSearch showAdvanced={true} />
                </div>
              </div>
            )}

            {activeView === 'inventory' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Inventory Alerts</h2>
                  <p className="text-gray-600">Manage medical supplies and equipment</p>
                </div>
                {lowStockItems.length > 0 ? (
                  <div className="grid gap-4">
                    {lowStockItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-6 border-2 border-red-200 rounded-xl bg-red-50 hover:bg-red-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-semibold text-lg text-red-900">{item.name}</p>
                          <p className="text-red-700 mt-1">{item.description}</p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-red-800">
                            <span>Category: {item.category}</span>
                            <span>•</span>
                            <span>Current: {item.quantity}</span>
                            <span>•</span>
                            <span>Minimum: {item.min_stock}</span>
                          </div>
                          {item.supplier && (
                            <p className="text-sm text-red-800 mt-2">Supplier: {item.supplier}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <span className="px-4 py-2 bg-red-200 text-red-900 rounded-full text-sm font-semibold">
                            Low Stock
                          </span>
                          {item.price && (
                            <p className="text-lg font-bold text-red-900 mt-2">${item.price}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No low stock items</h3>
                    <p className="text-gray-600">All inventory items are sufficiently stocked.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard