import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  subtitle,
  trend,
  trendLabel,
  onClick,
  loading = false,
  className = ''
}) => {
  const colorConfig = {
    blue:   { border: '#3b82f6', iconBg: '#eff6ff', icon: '#2563eb' },
    green:  { border: '#22c55e', iconBg: '#f0fdf4', icon: '#16a34a' },
    purple: { border: '#a855f7', iconBg: '#faf5ff', icon: '#9333ea' },
    red:    { border: '#ef4444', iconBg: '#fef2f2', icon: '#dc2626' },
    yellow: { border: '#f59e0b', iconBg: '#fffbeb', icon: '#d97706' },
    indigo: { border: '#6366f1', iconBg: '#eef2ff', icon: '#4f46e5' },
    gray:   { border: '#6b7280', iconBg: '#f9fafb', icon: '#4b5563' }
  }

  const cfg = colorConfig[color] || colorConfig.blue
  const trendUp = '#16a34a'
  const trendDown = '#dc2626'

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="h-3.5 w-3.5" />
    if (trend < 0) return <TrendingDown className="h-3.5 w-3.5" />
    return <Minus className="h-3.5 w-3.5" />
  }

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`
      return val.toString()
    }
    return val
  }

  return (
    <div
      className={`bg-white rounded-xl transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        borderLeft: `4px solid ${cfg.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)',
      }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {loading ? (
              <>
                <div className="h-3 bg-gray-200 rounded w-24 mb-3 animate-pulse"></div>
                <div className="h-7 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>
                  {title}
                </p>
                <p className="text-3xl font-bold mb-1" style={{ color: '#1e293b' }}>
                  {formatValue(value)}
                </p>
                {(subtitle || trend !== undefined) && (
                  <div className="flex items-center gap-2 mt-1">
                    {subtitle && <p className="text-xs" style={{ color: '#64748b' }}>{subtitle}</p>}
                    {trend !== undefined && (
                      <div
                        className="flex items-center gap-0.5 text-xs font-medium"
                        style={{ color: trend > 0 ? trendUp : trend < 0 ? trendDown : '#6b7280' }}
                      >
                        {getTrendIcon()}
                        <span>{Math.abs(trend)}%{trendLabel && ` ${trendLabel}`}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <div
            className="flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center ml-4"
            style={{ backgroundColor: cfg.iconBg }}
          >
            {loading
              ? <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              : <Icon className="h-5 w-5" style={{ color: cfg.icon }} />
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// Stats Card Grid
export const StatsGrid = ({ children, cols = 4, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6'
  }
  return (
    <div className={`grid gap-5 ${gridCols[cols]} ${className}`}>
      {children}
    </div>
  )
}

// Mini Stats Card
export const MiniStatsCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colorMap = {
    blue:   { bg: '#eff6ff', text: '#2563eb' },
    green:  { bg: '#f0fdf4', text: '#16a34a' },
    purple: { bg: '#faf5ff', text: '#9333ea' },
    red:    { bg: '#fef2f2', text: '#dc2626' },
    yellow: { bg: '#fffbeb', text: '#d97706' }
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className="bg-white rounded-xl p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>{title}</p>
          <p className="text-xl font-bold" style={{ color: '#1e293b' }}>{value}</p>
        </div>
        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.bg }}>
          <Icon className="h-4 w-4" style={{ color: c.text }} />
        </div>
      </div>
    </div>
  )
}

export default StatsCard