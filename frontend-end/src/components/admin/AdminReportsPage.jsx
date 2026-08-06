import React from 'react'
import AuditLogs from './AuditLogs'

const AdminReportsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-600">System monitoring and operational reports</p>
      </div>

      <AuditLogs />
    </div>
  )
}

export default AdminReportsPage
