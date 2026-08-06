import React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className = '',
  showInfo = true
}) => {
  if (totalPages <= 1) return null

  // Generate page numbers with ellipsis
  const generatePageNumbers = () => {
    const totalPageNumbers = siblingCount + 5

    if (totalPages <= totalPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount
      return [...Array.from({ length: leftItemCount }, (_, i) => i + 1), '...', totalPages]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount
      return [1, '...', ...Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1)]
    }

    return [
      1,
      '...',
      ...Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i),
      '...',
      totalPages
    ]
  }

  const pageNumbers = generatePageNumbers()

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Page Info */}
      {showInfo && (
        <div className="hidden sm:flex text-sm text-gray-700">
          Showing page {currentPage} of {totalPages}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center space-x-1">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="sr-only">Previous</span>
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Page Numbers */}
        {pageNumbers.map((pageNumber, index) => (
          <React.Fragment key={index}>
            {pageNumber === '...' ? (
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <button
                onClick={() => onPageChange(pageNumber)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  currentPage === pageNumber
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="sr-only">Next</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Page Info */}
      {showInfo && (
        <div className="flex sm:hidden text-sm text-gray-700">
          {currentPage} / {totalPages}
        </div>
      )}
    </div>
  )
}

// Simple Pagination for tables
export const TablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className = ''
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="text-sm text-gray-700">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        showInfo={false}
      />
    </div>
  )
}

// Compact Pagination for small spaces
export const CompactPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      <span className="text-sm text-gray-700 px-2">
        {currentPage} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export default Pagination