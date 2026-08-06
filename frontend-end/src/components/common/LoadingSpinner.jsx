import React from 'react'

const LoadingSpinner = ({ 
  size = 'medium', 
  text = 'Loading...', 
  className = '',
  overlay = false 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
      ></div>
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

// Inline loading spinner for buttons and small spaces
export const InlineSpinner = ({ size = 'small' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6'
  }

  return (
    <div className={`animate-spin rounded-full border-b-2 border-white ${sizeClasses[size]}`}></div>
  )
}

// Page loading spinner for full page loads
export const PageSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="xl" text="Loading application..." />
    </div>
  )
}

// Content loading spinner for sections
export const ContentSpinner = ({ text = 'Loading content...' }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="large" text={text} />
    </div>
  )
}

// Skeleton loading components
export const SkeletonLoader = ({ type = 'text', count = 1, className = '' }) => {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`animate-pulse bg-gray-200 rounded ${className} ${
        type === 'text' ? 'h-4' :
        type === 'title' ? 'h-6' :
        type === 'card' ? 'h-32' :
        type === 'avatar' ? 'h-12 w-12 rounded-full' :
        'h-4'
      }`}
    ></div>
  ))

  return <>{skeletons}</>
}

// Table row skeleton
export const TableRowSkeleton = ({ columns = 4, rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }, (_, colIndex) => (
            <td key={colIndex} className="px-6 py-4">
              <div className="h-4 bg-gray-200 rounded"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default LoadingSpinner