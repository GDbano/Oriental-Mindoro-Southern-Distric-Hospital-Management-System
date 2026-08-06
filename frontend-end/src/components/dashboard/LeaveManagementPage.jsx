import React, { useEffect, useState, useMemo } from 'react'
import { Calendar, Plus, Check, X, AlertTriangle } from 'lucide-react'
import { doctorLeaveAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import StatusBadge from '../common/StatusBadge'
import { formatDate } from '../../utils/helpers'

const LeaveManagementPage = () => {
  const { user } = useAuth()
  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff'
  const isDoctor = user?.role === 'doctor'

  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await doctorLeaveAPI.getAll()
      setLeaves(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error('Failed to load leaves', e)
      setError('Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleStatusUpdate = async (leaveId, status) => {
    try {
      const notes = prompt(`Enter optional notes for ${status === 'approved' ? 'approval' : 'rejection'}:`)
      if (notes === null) return // Cancelled
      
      await doctorLeaveAPI.updateStatus(leaveId, status, notes)
      await load()
    } catch (e) {
      console.error('Failed to update leave status', e)
      alert('Failed to update leave status')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      await doctorLeaveAPI.create(formData)
      setShowForm(false)
      setFormData({ start_date: '', end_date: '', reason: '' })
      await load()
    } catch (e) {
      console.error('Failed to submit leave', e)
      setFormError(e.response?.data?.message || 'Failed to submit leave request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && leaves.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-600">
            {isAdminOrStaff ? 'Manage doctor leave requests and availability' : 'Request and view your leaves'}
          </p>
        </div>
        <div className="flex gap-2">
          {isDoctor && (
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {showForm ? 'Cancel Request' : 'Request Leave'}
            </button>
          )}
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {showForm && isDoctor && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Leave Request</h2>
          {formError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  required
                  rows="3"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Reason for leave..."
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isAdminOrStaff && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {isAdminOrStaff && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={isAdminOrStaff ? 5 : 3} className="px-6 py-10 text-center text-gray-500">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    {isAdminOrStaff && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Dr. {leave.doctor?.name}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(leave.start_date)} 
                        {leave.start_date !== leave.end_date && ` - ${formatDate(leave.end_date)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                        leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                      {leave.admin_notes && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={leave.admin_notes}>
                          Note: {leave.admin_notes}
                        </p>
                      )}
                    </td>
                    {isAdminOrStaff && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {leave.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleStatusUpdate(leave.id, 'approved')}
                              className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(leave.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded"
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LeaveManagementPage
