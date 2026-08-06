import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Search, Filter, Users, UserPlus, UserCheck, UserX } from 'lucide-react'
import { userAPI } from '../../services/api'
import StatsCard from '../common/StatsCard'
import SearchBar from '../common/SearchBar'
import Modal from '../common/Modal'
import UserForm from './UserForm'
import LoadingSpinner from '../common/LoadingSpinner'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserForm, setShowUserForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [stats, setStats] = useState({})

  useEffect(() => {
    loadUsers()
    loadStats()
  }, [])

  const loadUsers = async () => {
    try {
      const params = {}
      if (searchQuery) params.search = searchQuery
      if (roleFilter !== 'all') params.role = roleFilter
      
      const response = await userAPI.getAll(params)
      setUsers(response.data.data || response.data)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await userAPI.getAll()
      const allUsers = response.data.data || response.data
      
      const stats = {
        total: allUsers.length,
        patients: allUsers.filter(u => u.role === 'patient').length,
        doctors: allUsers.filter(u => u.role === 'doctor').length,
        staff: allUsers.filter(u => u.role === 'staff').length,
        admins: allUsers.filter(u => u.role === 'admin').length,
        active: allUsers.filter(u => u.is_active).length,
        inactive: allUsers.filter(u => !u.is_active).length
      }
      setStats(stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    // Debounced search would be implemented here
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setShowUserForm(true)
  }

  const handleView = (user) => {
    setSelectedUser(user)
    // In a real app, this would navigate to user details page
    console.log('View user:', user)
  }

  const handleDelete = (user) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      await userAPI.delete(userToDelete.id)
      setShowDeleteModal(false)
      setUserToDelete(null)
      loadUsers()
      loadStats()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const handleUserFormSuccess = () => {
    setShowUserForm(false)
    setSelectedUser(null)
    loadUsers()
    loadStats()
  }

  const filteredUsers = users.filter(user => {
    if (statusFilter === 'active' && !user.is_active) return false
    if (statusFilter === 'inactive' && user.is_active) return false
    return true
  })

  const getRoleColor = (role) => {
    const colors = {
      patient: 'bg-blue-100 text-blue-800',
      doctor: 'bg-green-100 text-green-800',
      staff: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        <button
          onClick={() => setShowUserForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.total || 0}
          icon={Users}
          color="blue"
          size="small"
        />
        <StatsCard
          title="Patients"
          value={stats.patients || 0}
          icon={UserCheck}
          color="green"
          size="small"
        />
        <StatsCard
          title="Doctors"
          value={stats.doctors || 0}
          icon={UserCheck}
          color="purple"
          size="small"
        />
        <StatsCard
          title="Staff"
          value={stats.staff || 0}
          icon={UserCheck}
          color="indigo"
          size="small"
        />
        <StatsCard
          title="Admins"
          value={stats.admins || 0}
          icon={UserCheck}
          color="red"
          size="small"
        />
        <StatsCard
          title="Active"
          value={stats.active || 0}
          icon={UserCheck}
          color="green"
          size="small"
        />
        <StatsCard
          title="Inactive"
          value={stats.inactive || 0}
          icon={UserX}
          color="red"
          size="small"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Search Users</label>
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search by name or email..."
            />
          </div>
          <div>
            <label className="form-label">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Roles</option>
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="staff">Staff</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div>
            <label className="form-label">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Users ({filteredUsers.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                      {user.specialization && (
                        <div className="text-xs text-gray-500 mt-1">
                          {user.specialization}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.is_active)}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone || 'Not provided'}
                      <div className="text-xs text-gray-400">
                        {user.address ? `${user.address.substring(0, 30)}...` : 'No address'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login_at 
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleView(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                          disabled={user.role === 'admin'} // Prevent deleting admin accounts
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">
                  {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your search filters'
                    : 'No users have been created yet'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          user={selectedUser}
          onClose={() => {
            setShowUserForm(false)
            setSelectedUser(null)
          }}
          onSuccess={handleUserFormSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Confirm User Deletion"
          size="sm"
        >
          <div className="text-center">
            <Trash2 className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete {userToDelete.name}?
            </h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. All user data and associated records will be permanently removed from the system.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn-danger"
              >
                Delete User
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default UserManagement