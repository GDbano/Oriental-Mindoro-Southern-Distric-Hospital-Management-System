import React from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, HelpCircle } from 'lucide-react'

const StatusBadge = ({ 
  status, 
  type = 'appointment',
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  // Status configurations for different types
  const statusConfigs = {
    appointment: {
      scheduled: {
        label: 'Scheduled',
        color: 'bg-blue-100 text-blue-800',
        icon: Clock
      },
      confirmed: {
        label: 'Confirmed',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      in_progress: {
        label: 'In Progress',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      },
      completed: {
        label: 'Completed',
        color: 'bg-gray-100 text-gray-800',
        icon: CheckCircle
      },
      cancelled: {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
      }
    },
    user: {
      active: {
        label: 'Active',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      inactive: {
        label: 'Inactive',
        color: 'bg-gray-100 text-gray-800',
        icon: XCircle
      },
      suspended: {
        label: 'Suspended',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
      },
      pending: {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      }
    },
    inventory: {
      in_stock: {
        label: 'In Stock',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      low_stock: {
        label: 'Low Stock',
        color: 'bg-yellow-100 text-yellow-800',
        icon: AlertCircle
      },
      out_of_stock: {
        label: 'Out of Stock',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
      },
      expired: {
        label: 'Expired',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
      }
    },
    medical: {
      normal: {
        label: 'Normal',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      abnormal: {
        label: 'Abnormal',
        color: 'bg-yellow-100 text-yellow-800',
        icon: AlertCircle
      },
      critical: {
        label: 'Critical',
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle
      },
      pending: {
        label: 'Pending',
        color: 'bg-blue-100 text-blue-800',
        icon: Clock
      }
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  }

  // Get status configuration
  const config = statusConfigs[type]?.[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800',
    icon: HelpCircle
  }

  const IconComponent = config.icon

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${config.color} ${className}`}
    >
      {showIcon && (
        <IconComponent className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
      )}
      {config.label}
    </span>
  )
}

// Status Dot for minimal display
export const StatusDot = ({ status, type = 'appointment', size = 'md' }) => {
  const statusConfigs = {
    appointment: {
      scheduled: 'bg-blue-500',
      confirmed: 'bg-green-500',
      in_progress: 'bg-yellow-500',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500'
    },
    user: {
      active: 'bg-green-500',
      inactive: 'bg-gray-500',
      suspended: 'bg-red-500',
      pending: 'bg-yellow-500'
    },
    inventory: {
      in_stock: 'bg-green-500',
      low_stock: 'bg-yellow-500',
      out_of_stock: 'bg-red-500',
      expired: 'bg-red-500'
    }
  }

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  const color = statusConfigs[type]?.[status] || 'bg-gray-500'

  return (
    <span 
      className={`inline-block rounded-full ${sizeClasses[size]} ${color}`}
      title={status}
    />
  )
}

// Status with tooltip
export const StatusWithTooltip = ({ status, type = 'appointment', children }) => {
  const config = StatusBadge.defaultProps?.statusConfigs?.[type]?.[status] || { label: status }

  return (
    <div className="group relative inline-flex">
      {children || <StatusBadge status={status} type={type} />}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
        {config.label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  )
}

// Status filter component
export const StatusFilter = ({ 
  type = 'appointment',
  selectedStatus,
  onStatusChange,
  includeAll = true,
  className = ''
}) => {
  const statusConfigs = {
    appointment: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    user: ['active', 'inactive', 'pending'],
    inventory: ['in_stock', 'low_stock', 'out_of_stock']
  }

  const statuses = statusConfigs[type] || []

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {includeAll && (
        <button
          onClick={() => onStatusChange('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium border ${
            selectedStatus === 'all'
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          All
        </button>
      )}
      {statuses.map(status => (
        <button
          key={status}
          onClick={() => onStatusChange(status)}
          className={`px-3 py-1 rounded-full text-sm font-medium border ${
            selectedStatus === status
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <StatusBadge status={status} type={type} showIcon={false} />
        </button>
      ))}
    </div>
  )
}

export default StatusBadge