import React, { useState, useEffect } from 'react'
import { Search, Filter, Calendar, User, Eye, Download } from 'lucide-react'
import SearchBar from '../common/SearchBar'
import LoadingSpinner from '../common/LoadingSpinner'

// Mock data - in real app, this would come from API
const mockAuditLogs = [
  {
    id: 1,
    user: { name: 'Dr. Sarah Johnson', role: 'doctor' },
    action: 'USER_LOGIN',
    description: 'User logged into the system',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    performed_at: new Date('2024-01-15T08:30:00Z').toISOString()
  },
  {
    id: 2,
    user: { name: 'Admin User', role: 'admin' },
    action: 'USER_CREATE',
    description: 'Created new patient account for John Doe',
    ip_address: '192.168.1.50',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    performed_at: new Date('2024-01-15T09:15:00Z').toISOString()
  },
  {
    id: 3,
    user: { name: 'Dr. Mike Chen', role: 'doctor' },
    action: 'MEDICAL_RECORD_CREATE',
    description: 'Created medical record for appointment #1234',
    ip_address: '192.168.1.75',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    performed_at: new Date('2024-01-15T10:20:00Z').toISOString()
  },
  {
    id: 4,
    user: { name: 'Staff Member', role: 'staff' },
    action: 'APPOINTMENT_UPDATE',
    description: 'Updated appointment status to confirmed for appointment #1235',
    ip_address: '192.168.1.25',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    performed_at: new Date('2024-01-15T11:45:00Z').toISOString()
  },
  {
    id: 5,
    user: { name: 'Patient User', role: 'patient' },
    action: 'APPOINTMENT_CREATE',
    description: 'Booked new appointment with Dr. Sarah Johnson',
    ip_address: '203.0.113.45',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    performed_at: new Date('2024-01-15T14:30:00Z').toISOString()
  }
]

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLogs(mockAuditLogs)
      setLoading(false)
    }, 1000)
  }, [])

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  const getActionColor = (action) => {
    const colors = {
      USER_LOGIN: 'bg-blue-100 text-blue-800',
      USER_LOGOUT: 'bg-gray-100 text-gray-800',
      USER_CREATE: 'bg-green-100 text-green-800',
      USER_UPDATE: 'bg-yellow-100 text-yellow-800',
      USER_DELETE: 'bg-red-100 text-red-800',
      APPOINTMENT_CREATE: 'bg-purple-100 text-purple-800',
      APPOINTMENT_UPDATE: 'bg-indigo-100 text-indigo-800',
      APPOINTMENT_DELETE: 'bg-pink-100 text-pink-800',
      MEDICAL_RECORD_CREATE: 'bg-teal-100 text-teal-800',
      MEDICAL_RECORD_UPDATE: 'bg-cyan-100 text-cyan-800'
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const getActionIcon = (action) => {
    const icons = {
      USER_LOGIN: '🔐',
      USER_LOGOUT: '🚪',
      USER_CREATE: '👤',
      USER_UPDATE: '✏️',
      USER_DELETE: '🗑️',
      APPOINTMENT_CREATE: '📅',
      APPOINTMENT_UPDATE: '🔄',
      APPOINTMENT_DELETE: '❌',
      MEDICAL_RECORD_CREATE: '📋',
      MEDICAL_RECORD_UPDATE: '📝'
    }
    return icons[action] || '📄'
  }

  const formatActionText = (action) => {
    const actionMap = {
      USER_LOGIN: 'User Login',
      USER_LOGOUT: 'User Logout',
      USER_CREATE: 'User Created',
      USER_UPDATE: 'User Updated',
      USER_DELETE: 'User Deleted',
      APPOINTMENT_CREATE: 'Appointment Created',
      APPOINTMENT_UPDATE: 'Appointment Updated',
      APPOINTMENT_DELETE: 'Appointment Deleted',
      MEDICAL_RECORD_CREATE: 'Medical Record Created',
      MEDICAL_RECORD_UPDATE: 'Medical Record Updated'
    }
    return actionMap[action] || action
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    const matchesUser = userFilter === 'all' || log.user.role === userFilter
    
    return matchesSearch && matchesAction && matchesUser
  })

  const uniqueActions = [...new Set(logs.map(log => log.action))]
  const uniqueUsers = [...new Set(logs.map(log => log.user.role))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">System activity and security monitoring</p>
        </div>
        <button
          onClick={() => {/* Export functionality */}}
          className="btn-primary flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Search Logs</label>
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search actions or users..."
            />
          </div>
          <div>
            <label className="form-label">Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {formatActionText(action)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">User Role</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Roles</option>
              {uniqueUsers.map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Time Period</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Activity Log ({filteredLogs.length} entries)
          </h2>
        </div>

        {loading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getActionIcon(log.action)}</span>
                          <div>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                              {formatActionText(log.action)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {log.user.name}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {log.user.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md">
                          {log.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(log.performed_at).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
                <p className="text-gray-600">
                  {searchQuery || actionFilter !== 'all' || userFilter !== 'all'
                    ? 'Try adjusting your search filters'
                    : 'No activity has been logged yet'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">User Actions</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.action.startsWith('USER_')).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <User className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Appointment Actions</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.action.startsWith('APPOINTMENT_')).length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Medical Actions</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.action.startsWith('MEDICAL_')).length}
              </p>
            </div>
            <div className="p-3 bg-teal-100 rounded-lg">
              <Eye className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuditLogs