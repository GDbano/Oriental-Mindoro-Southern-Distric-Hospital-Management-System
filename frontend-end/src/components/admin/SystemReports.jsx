import React, { useState, useEffect } from 'react'
import { Download, Calendar, Users, TrendingUp, BarChart3, FileText, Filter } from 'lucide-react'
import { dashboardAPI, appointmentAPI, userAPI } from '../../services/api'
import StatsCard from '../common/StatsCard'
import LoadingSpinner from '../common/LoadingSpinner'

const SystemReports = () => {
  const [reports, setReports] = useState({
    appointments: [],
    users: [],
    monthlyStats: []
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [reportType, setReportType] = useState('overview')
  const [stats, setStats] = useState({})

  useEffect(() => {
    loadReports()
  }, [dateRange])

  const loadReports = async () => {
    try {
      const [monthlyRes, statsRes, appointmentsRes] = await Promise.all([
        dashboardAPI.getMonthlyAppointments(),
        dashboardAPI.getStats(),
        appointmentAPI.getAll()
      ])

      setReports({
        monthlyStats: monthlyRes.data,
        appointments: appointmentsRes.data,
        users: [] // You would fetch users separately if needed
      })
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAppointmentReport = () => {
    const filteredAppointments = reports.appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date).toISOString().split('T')[0]
      return aptDate >= dateRange.start && aptDate <= dateRange.end
    })

    const statusCounts = filteredAppointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1
      return acc
    }, {})

    const doctorCounts = filteredAppointments.reduce((acc, apt) => {
      const doctorName = apt.doctor?.name || 'Unknown'
      acc[doctorName] = (acc[doctorName] || 0) + 1
      return acc
    }, {})

    return {
      total: filteredAppointments.length,
      statusCounts,
      doctorCounts,
      appointments: filteredAppointments
    }
  }

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const exportAppointmentReport = () => {
    const report = generateAppointmentReport()
    const exportData = report.appointments.map(apt => ({
      id: apt.id,
      patient_name: apt.patient?.user?.name,
      doctor_name: apt.doctor?.name,
      appointment_date: new Date(apt.appointment_date).toLocaleString(),
      status: apt.status,
      reason: apt.reason,
      symptoms: apt.symptoms
    }))
    exportToCSV(exportData, 'appointments_report')
  }

  const appointmentReport = generateAppointmentReport()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Reports</h1>
          <p className="text-gray-600">Analytics and insights for your healthcare facility</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportAppointmentReport}
            className="btn-primary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Report Type Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'appointments', 'users', 'financial'].map(tab => (
            <button
              key={tab}
              onClick={() => setReportType(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                reportType === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'overview' ? 'Dashboard Overview' :
               tab === 'appointments' ? 'Appointment Analytics' :
               tab === 'users' ? 'User Statistics' :
               'Financial Reports'}
            </button>
          ))}
        </nav>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Report Period</h3>
            <p className="text-sm text-gray-600">Select date range for analysis</p>
          </div>
          <div className="flex space-x-4">
            <div>
              <label className="form-label">From</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">To</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="form-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Overview Report */}
      {reportType === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Appointments"
              value={appointmentReport.total}
              icon={Calendar}
              color="blue"
              subtitle={`In selected period`}
            />
            <StatsCard
              title="Completed"
              value={appointmentReport.statusCounts.completed || 0}
              icon={Users}
              color="green"
              subtitle={`${((appointmentReport.statusCounts.completed || 0) / appointmentReport.total * 100).toFixed(1)}% completion rate`}
            />
            <StatsCard
              title="Scheduled"
              value={appointmentReport.statusCounts.scheduled || 0}
              icon={TrendingUp}
              color="yellow"
              subtitle="Upcoming appointments"
            />
            <StatsCard
              title="Cancelled"
              value={appointmentReport.statusCounts.cancelled || 0}
              icon={BarChart3}
              color="red"
              subtitle={`${((appointmentReport.statusCounts.cancelled || 0) / appointmentReport.total * 100).toFixed(1)}% cancellation rate`}
            />
          </div>

          {/* Charts and Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointment Status Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Appointment Status Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(appointmentReport.statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-900">{count}</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / appointmentReport.total) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-10">
                        {((count / appointmentReport.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Doctor Appointment Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(appointmentReport.doctorCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([doctor, count]) => (
                    <div key={doctor} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        {doctor}
                      </span>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-900">{count}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(count / appointmentReport.total) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Monthly Appointment Trends
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {reports.monthlyStats.map((stat, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {stat.count}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(stat.year, stat.month - 1).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-xs text-gray-500">{stat.year}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Appointment Analytics */}
      {reportType === 'appointments' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Appointment Analytics</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointmentReport.appointments.slice(0, 10).map(appointment => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {appointment.patient?.user?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.doctor?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(appointment.appointment_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {appointment.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quick Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Appointments</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{appointmentReport.total}</h3>
          <p className="text-sm text-gray-600">Total appointments in selected period</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-green-600" />
            <span className="text-sm font-medium text-green-600">Patients</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{stats.total_patients || 0}</h3>
          <p className="text-sm text-gray-600">Registered patients in system</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">Doctors</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{stats.total_doctors || 0}</h3>
          <p className="text-sm text-gray-600">Active medical practitioners</p>
        </div>
      </div>
    </div>
  )
}

export default SystemReports