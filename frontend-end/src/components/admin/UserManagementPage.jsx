import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Save, Trash2 } from 'lucide-react'
import { userAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import SearchBar from '../common/SearchBar'

const ROLE_OPTIONS = ['patient', 'doctor', 'staff', 'cashier', 'records_officer', 'medtech', 'admin']

const getUserName = (u) => u?.name || u?.patient?.user?.name || u?.user?.name || '—'
const getUserEmail = (u) => u?.email || u?.user?.email || '—'

const UserManagementPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const [editingId, setEditingId] = useState(null)
  const [editingRole, setEditingRole] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    try {
      setError(null)
      const res = await userAPI.getAll()
      const data = res.data?.data || res.data
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load users:', e)
      setError(e.response?.data?.message || 'Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredUsers = useMemo(() => {
    const q = String(search || '').trim().toLowerCase()
    return users.filter((u) => {
      const name = String(getUserName(u)).toLowerCase()
      const email = String(getUserEmail(u)).toLowerCase()
      const role = String(u?.role || '').toLowerCase()

      const matchesQuery = !q || name.includes(q) || email.includes(q)
      const matchesRole = roleFilter === 'all' || role === roleFilter
      return matchesQuery && matchesRole
    })
  }, [users, search, roleFilter])

  const startEdit = (u) => {
    setEditingId(u.id)
    setEditingRole(u.role || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingRole('')
  }

  const saveRole = async (u) => {
    if (!editingRole) return

    try {
      setSavingId(u.id)
      await userAPI.update(u.id, { role: editingRole })
      await load()
      cancelEdit()
    } catch (e) {
      console.error('Failed to update user:', e)
      setError(e.response?.data?.message || 'Failed to update user')
    } finally {
      setSavingId(null)
    }
  }

  const deleteUser = async (u) => {
    const ok = window.confirm(`Delete user "${getUserName(u)}"? This cannot be undone.`)
    if (!ok) return

    try {
      setDeletingId(u.id)
      await userAPI.delete(u.id)
      await load()
    } catch (e) {
      console.error('Failed to delete user:', e)
      setError(e.response?.data?.message || 'Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600">Manage system users and roles</p>
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="form-label">Search</label>
            <SearchBar onSearch={(q) => setSearch(q)} placeholder="Search by name or email..." />
          </div>
          <div>
            <label className="form-label">Role</label>
            <select className="form-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Users ({filteredUsers.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Role</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredUsers.map((u) => {
                const isEditing = editingId === u.id
                const busy = savingId === u.id || deletingId === u.id

                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {getUserName(u)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">{getUserEmail(u)}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {isEditing ? (
                        <select
                          className="form-input"
                          value={editingRole}
                          onChange={(e) => setEditingRole(e.target.value)}
                          disabled={busy}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize">{u.role || '—'}</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => saveRole(u)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Save className="h-4 w-4" />
                            {savingId === u.id ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={busy}
                            className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            disabled={busy}
                            className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Edit Role
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteUser(u)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingId === u.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-600">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UserManagementPage
