import React, { useEffect, useMemo, useState } from 'react'
import { appointmentAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import AppointmentList from './AppointmentList'

const AppointmentManagementPage = ({ title = 'Appointments', userRole = 'admin' }) => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      setError(null)
      const res = await appointmentAPI.getAll({ with_queue: 'true' })
      setAppointments(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error('Failed to load appointments:', e)
      setError('Failed to load appointments. Please try again.')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = useMemo(() => appointments.length, [appointments])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600">Total: {total}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            load()
          }}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <AppointmentList appointments={appointments} onUpdate={load} userRole={userRole} />
    </div>
  )
}

export default AppointmentManagementPage
