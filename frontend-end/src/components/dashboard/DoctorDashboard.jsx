import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, UserCheck, Users } from 'lucide-react'
import { appointmentAPI, dashboardAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

const WAITING_STATUSES = new Set(['scheduled', 'confirmed', 'arrived'])

function getQueueSortValue(appointment) {
  const qp = appointment?.queue_position
  const qn = appointment?.queue_number
  if (typeof qp === 'number') return qp
  if (typeof qn === 'number') return qn
  if (typeof qn === 'string') {
    const digits = qn.replace(/\D/g, '')
    const parsed = digits ? Number.parseInt(digits, 10) : Number.NaN
    if (Number.isFinite(parsed)) return parsed
  }
  return 999999
}

function getPatientName(appointment) {
  return appointment?.patient?.user?.name || 'Unknown'
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1
  return age
}

function formatMinutes(minutes) {
  if (!Number.isFinite(minutes)) return '—'
  const rounded = Math.round(minutes)
  return `${rounded} min`
}

function getDisplayStatus(status) {
  if (WAITING_STATUSES.has(status)) return 'Waiting'
  if (status === 'in_consultation') return 'In Consultation'
  if (status === 'completed') return 'Done'
  return status ? status.replace(/_/g, ' ') : '—'
}

function getStatusPillClasses(status) {
  if (WAITING_STATUSES.has(status)) return 'bg-blue-100 text-blue-700'
  if (status === 'in_consultation') return 'bg-yellow-100 text-yellow-800'
  if (status === 'completed') return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-700'
}

const DoctorDashboard = () => {
  const { user } = useAuth()

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30 * 1000)
    return () => clearInterval(id)
  }, [])

  const loadTodayAppointments = async () => {
    try {
      const res = await dashboardAPI.getDoctorTodayAppointments()
      setAppointments(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error("Error loading doctor's today appointments:", error)
      setAppointments([])
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await loadTodayAppointments()
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const diff = getQueueSortValue(a) - getQueueSortValue(b)
      if (diff !== 0) return diff
      return (a?.id || 0) - (b?.id || 0)
    })
  }, [appointments])

  const currentInConsultation = useMemo(() => {
    return sortedAppointments.find((a) => a.status === 'in_consultation') || null
  }, [sortedAppointments])

  const nextWaiting = useMemo(() => {
    return sortedAppointments.find((a) => WAITING_STATUSES.has(a.status)) || null
  }, [sortedAppointments])

  const departmentLabel = useMemo(() => {
    const names = Array.from(
      new Set(
        sortedAppointments
          .map((a) => a?.department?.name)
          .filter(Boolean)
      )
    )

    if (names.length === 1) return names[0]
    if (names.length > 1) return 'Multiple'
    return user?.specialization || '—'
  }, [sortedAppointments, user?.specialization])

  const stats = useMemo(() => {
    const total = sortedAppointments.length
    const completed = sortedAppointments.filter((a) => a.status === 'completed').length
    const pending = sortedAppointments.filter((a) => a.status !== 'completed').length

    const completedWithTimes = sortedAppointments.filter(
      (a) => a.consultation_start_time && a.consultation_end_time
    )

    const avgMinutes =
      completedWithTimes.length > 0
        ? completedWithTimes.reduce((sum, a) => {
            const start = new Date(a.consultation_start_time)
            const end = new Date(a.consultation_end_time)
            const diffMs = end.getTime() - start.getTime()
            if (!Number.isFinite(diffMs) || diffMs <= 0) return sum
            return sum + diffMs / 60000
          }, 0) / completedWithTimes.length
        : null

    return { total, completed, pending, avgMinutes }
  }, [sortedAppointments])

  const timeIndicatorQueueValue = useMemo(() => {
    // Minimal “current time indicator”: highlight the next scheduled appointment if we can parse times.
    const toDateTime = (a) => {
      const appointmentDateRaw = a?.appointment_date
      const scheduledTimeRaw = a?.scheduled_time

      // If scheduled_time is already a full datetime string, just parse it.
      if (typeof scheduledTimeRaw === 'string' && /\d{4}-\d{2}-\d{2}/.test(scheduledTimeRaw)) {
        const dt = new Date(scheduledTimeRaw)
        return Number.isNaN(dt.getTime()) ? null : dt
      }

      // Common case: appointment_date is datetime and scheduled_time is TIME (HH:MM[:SS]).
      if (appointmentDateRaw && typeof scheduledTimeRaw === 'string') {
        const day = String(appointmentDateRaw).slice(0, 10)
        const time = scheduledTimeRaw.length >= 5 ? scheduledTimeRaw.slice(0, 8) : scheduledTimeRaw
        const dt = new Date(`${day}T${time}`)
        return Number.isNaN(dt.getTime()) ? null : dt
      }

      // Fallback: parse appointment_date.
      if (appointmentDateRaw) {
        const dt = new Date(appointmentDateRaw)
        return Number.isNaN(dt.getTime()) ? null : dt
      }

      return null
    }

    const candidates = sortedAppointments
      .map((a) => ({ appointment: a, dateTime: toDateTime(a) }))
      .filter((x) => x.dateTime)

    if (candidates.length === 0) return null

    const futureOrNow = candidates
      .map((x) => ({
        ...x,
        diff: x.dateTime.getTime() - now.getTime(),
      }))
      .filter((x) => x.diff >= 0)
      .sort((a, b) => a.diff - b.diff)

    const chosen = (futureOrNow[0] || candidates.sort((a, b) => a.dateTime - b.dateTime)[0])
      ?.appointment

    return chosen ? getQueueSortValue(chosen) : null
  }, [sortedAppointments, now])

  const callNextPatient = async () => {
    if (!nextWaiting || currentInConsultation) return

    try {
      setActionLoading(true)
      await appointmentAPI.updateStatus(nextWaiting.id, 'in_consultation')
      await loadTodayAppointments()
    } catch (error) {
      console.error('Error calling next patient:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const markDone = async () => {
    if (!currentInConsultation) return

    try {
      setActionLoading(true)
      await appointmentAPI.updateStatus(currentInConsultation.id, 'completed')
      await loadTodayAppointments()
    } catch (error) {
      console.error('Error marking appointment done:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Home</h1>
          <p className="text-gray-600">
            {user?.name || 'Doctor'} • {departmentLabel}
          </p>
        </div>
        <div className="text-sm text-gray-600">
          {now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's patients queue */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Today’s Patients</h2>
                <p className="text-sm text-gray-600">
                  Sorted by queue number • Current time: {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={callNextPatient}
                  disabled={actionLoading || !nextWaiting || !!currentInConsultation}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  Call Next Patient
                </button>
                <button
                  onClick={markDone}
                  disabled={actionLoading || !currentInConsultation}
                  className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  Mark Done
                </button>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-700">
              <span className="font-medium">Currently In Consultation:</span>{' '}
              {currentInConsultation ? (
                <span>
                  #{currentInConsultation.queue_number || '—'} {getPatientName(currentInConsultation)}
                </span>
              ) : (
                <span className="text-gray-600">None</span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Queue No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chief Complaint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-600">
                      No patients in today’s queue.
                    </td>
                  </tr>
                ) : (
                  sortedAppointments.map((a) => {
                    const age = calculateAge(a?.patient?.date_of_birth)
                    const complaint = a?.reason || a?.notes || '—'
                    const queueValue = getQueueSortValue(a)
                    const isTimeIndicator =
                      timeIndicatorQueueValue !== null && queueValue === timeIndicatorQueueValue

                    return (
                      <tr key={a.id} className={isTimeIndicator ? 'bg-yellow-50' : undefined}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {a.queue_number ?? '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            to={`/dashboard/patients/${a.patient_id}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {getPatientName(a)}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {age === null ? '—' : age}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                          <div className="truncate" title={complaint}>
                            {complaint}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusPillClasses(
                              a.status
                            )}`}
                          >
                            {getDisplayStatus(a.status)}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick stats */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
            <p className="text-sm text-gray-600">Today</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="h-5 w-5 text-gray-400" />
                <span>Total</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.total}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <UserCheck className="h-5 w-5 text-gray-400" />
                <span>Completed</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.completed}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="h-5 w-5 text-gray-400" />
                <span>Pending</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.pending}</span>
            </div>

            <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
              <span className="text-gray-700">Avg Consultation Time</span>
              <span className="font-semibold text-gray-900">{formatMinutes(stats.avgMinutes)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard