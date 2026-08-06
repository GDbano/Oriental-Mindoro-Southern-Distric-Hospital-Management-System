import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, PlusCircle, Search, UserPlus, Users, XCircle } from 'lucide-react'
import { appointmentAPI, dashboardAPI } from '../../services/api'
import StatsCard from '../common/StatsCard'
import LoadingSpinner from '../common/LoadingSpinner'

const REFRESH_INTERVAL_MS = 30_000

const getTodayISODate = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const formatTime = (appointment) => {
  if (appointment?.scheduled_time) {
    try {
      const parsed = new Date(appointment.scheduled_time)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    } catch {
      // fall through
    }
  }

  if (appointment?.appointment_date) {
    const parsed = new Date(appointment.appointment_date)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }
  return '—'
}

const getStatusPillClasses = (status) => {
  switch (status) {
    case 'scheduled':
    case 'confirmed':
      return 'bg-blue-100 text-blue-700'
    case 'arrived':
      return 'bg-green-100 text-green-700'
    case 'in_consultation':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-gray-100 text-gray-700'
    case 'no_show':
      return 'bg-red-100 text-red-700'
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'scheduled':
      return 'Scheduled'
    case 'confirmed':
      return 'Scheduled'
    case 'arrived':
      return 'Arrived'
    case 'in_consultation':
      return 'In Consultation'
    case 'completed':
      return 'Completed'
    case 'no_show':
      return 'No-show'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status ? String(status).replaceAll('_', ' ') : 'Unknown'
  }
}

const ReceptionistDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [todayAppointments, setTodayAppointments] = useState([])
  const [error, setError] = useState(null)
  const refreshTimerRef = useRef(null)

  const todayISO = useMemo(() => getTodayISODate(), [])

  const computedQueueWaiting = useMemo(() => {
    return todayAppointments.filter((a) => ['scheduled', 'confirmed', 'arrived'].includes(a.status)).length
  }, [todayAppointments])

  const computedNoShow = useMemo(() => {
    return todayAppointments.filter((a) => a.status === 'no_show').length
  }, [todayAppointments])

  const loadData = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      setError(null)

      const [statsRes, apptsRes] = await Promise.all([
        dashboardAPI.getStats(),
        appointmentAPI.getAll({ date: todayISO, with_queue: 'true' }),
      ])

      setStats(statsRes.data || {})
      setTodayAppointments(Array.isArray(apptsRes.data) ? apptsRes.data : [])
    } catch (e) {
      console.error('Error loading receptionist dashboard:', e)
      setError('Failed to load today\'s data. Please try again.')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadData()

    refreshTimerRef.current = setInterval(() => {
      loadData({ silent: true })
    }, REFRESH_INTERVAL_MS)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markArrived = async (appointmentId) => {
    try {
      await appointmentAPI.updateStatus(appointmentId, 'arrived')
      await loadData({ silent: true })
    } catch (e) {
      console.error('Mark arrived failed:', e)
      alert('Failed to mark as arrived.')
    }
  }

  const cancelAppointment = async (appointmentId) => {
    const reason = window.prompt('Cancellation reason:')
    if (!reason) return

    try {
      await appointmentAPI.cancel(appointmentId, reason)
      await loadData({ silent: true })
    } catch (e) {
      console.error('Cancel failed:', e)
      alert('Failed to cancel appointment.')
    }
  }

  const generateWalkInNumber = () => {
    navigate('/dashboard/walk-in-queue')
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const patientsRegisteredToday = stats.patients_registered_today ?? 0
  const totalAppointmentsToday = stats.appointments_today ?? stats.today_appointments ?? todayAppointments.length
  const waitingInQueue = stats.waiting_in_queue ?? computedQueueWaiting
  const noShowToday = stats.no_show_today ?? computedNoShow

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/40 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Receptionist Dashboard</h1>
            <p className="text-slate-500 mt-1">Today's overview and queue management</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Today</p>
              <p className="text-sm font-bold text-slate-900">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-white border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Top summary cards (today only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Patients Registered Today" value={patientsRegisteredToday} icon={Users} color="green" />
          <StatsCard title="Appointments Today" value={totalAppointmentsToday} icon={Calendar} color="blue" />
          <StatsCard title="Waiting In Queue" value={waitingInQueue} icon={Clock} color="yellow" />
          <StatsCard title="No-shows Today" value={noShowToday} icon={XCircle} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main table */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Today\'s Appointment List</h2>
                  <p className="text-sm text-gray-600">Auto-refreshes every 30 seconds</p>
                </div>
                <button
                  onClick={() => loadData()}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  type="button"
                >
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Queue No.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Patient Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Hospital No.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Doctor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {todayAppointments.map((apt) => {
                      const patientName = apt.patient?.user?.name || 'Unknown Patient'
                      const hospitalNo = apt.patient?.id ?? apt.patient_id ?? '—'
                      const doctorName = apt.doctor?.name || '—'
                      const departmentName = apt.department?.name || '—'
                      const status = apt.status
                      const queueNo = apt.queue_number || apt.queue_position || '—'

                      return (
                        <tr key={apt.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{queueNo}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{patientName}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{hospitalNo}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{doctorName}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{departmentName}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatTime(apt)}</td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusPillClasses(status)}`}>
                              {getStatusLabel(status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => markArrived(apt.id)}
                                disabled={['arrived', 'in_consultation', 'completed', 'no_show', 'cancelled'].includes(status)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Mark Arrived
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/dashboard/patients/${apt.patient?.id ?? apt.patient_id}`)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                View Patient
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelAppointment(apt.id)}
                                disabled={['completed', 'no_show', 'cancelled'].includes(status)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {todayAppointments.length === 0 && (
                      <tr>
                        <td className="px-6 py-10 text-sm text-gray-500" colSpan={8}>
                          No appointments scheduled for today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick actions sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Quick Actions</h3>

              <button
                type="button"
                onClick={() => navigate('/dashboard/patients/register')}
                className="w-full flex items-center justify-start gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5"
              >
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <UserPlus className="h-4.5 w-4.5 text-white" />
                </div>
                Register New Patient
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard/appointments/book')}
                className="w-full flex items-center justify-start gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100/50 hover:bg-emerald-100 hover:border-emerald-200 transition-colors"
              >
                <div className="bg-emerald-200/50 p-1.5 rounded-lg">
                  <PlusCircle className="h-4.5 w-4.5 text-emerald-700" />
                </div>
                Schedule Appointment
              </button>

              <button
                type="button"
                onClick={generateWalkInNumber}
                className="w-full flex items-center justify-start gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-100/50 hover:bg-amber-100 hover:border-amber-200 transition-colors"
              >
                <div className="bg-amber-200/50 p-1.5 rounded-lg">
                  <Clock className="h-4.5 w-4.5 text-amber-700" />
                </div>
                Walk-in Queue
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard/patients')}
                className="w-full flex items-center justify-start gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold bg-purple-50 text-purple-700 border border-purple-100/50 hover:bg-purple-100 hover:border-purple-200 transition-colors"
              >
                <div className="bg-purple-200/50 p-1.5 rounded-lg">
                  <Search className="h-4.5 w-4.5 text-purple-700" />
                </div>
                Search Patient
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard/billing')}
                className="w-full flex items-center justify-start gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/50 hover:bg-indigo-100 hover:border-indigo-200 transition-colors"
              >
                <div className="bg-indigo-200/50 p-1.5 rounded-lg">
                  <Clock className="h-4.5 w-4.5 text-indigo-700" />
                </div>
                Cashier / Billing
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceptionistDashboard
