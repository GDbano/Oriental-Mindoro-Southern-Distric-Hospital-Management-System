import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { debounce } from '../../utils/helpers'

const SearchBar = ({ 
  onSearch, 
  placeholder = "Search...", 
  delay = 300,
  className = '',
  showFilters = false,
  filters = [],
  onFilterChange,
  initialValue = '',
  autoFocus = false
}) => {
  const [query, setQuery] = useState(initialValue)
  const [selectedFilters, setSelectedFilters] = useState({})
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const inputRef = useRef(null)

  const debouncedSearch = debounce((value, filters) => {
    onSearch(value, filters)
  }, delay)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    debouncedSearch(query, selectedFilters)
  }, [query, selectedFilters])

  const handleChange = (e) => {
    const value = e.target.value
    setQuery(value)
  }

  const handleClear = () => {
    setQuery('')
    setSelectedFilters({})
    onSearch('', {})
  }

  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...selectedFilters,
      [filterKey]: value
    }
    
    // Remove filter if value is empty
    if (!value) {
      delete newFilters[filterKey]
    }
    
    setSelectedFilters(newFilters)
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const hasActiveFilters = Object.keys(selectedFilters).length > 0
  const hasQuery = query.length > 0

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          className="block w-full pl-10 pr-20 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />

        <div className="absolute inset-y-0 right-0 flex items-center">
          {/* Clear button */}
          {(hasQuery || hasActiveFilters) && (
            <button
              onClick={handleClear}
              className="p-1 mr-1 text-gray-400 hover:text-gray-600 focus:outline-none"
              title="Clear search and filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Filter button */}
          {showFilters && filters.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`p-1 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded ${
                  hasActiveFilters 
                    ? 'text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Search filters"
              >
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 rounded-full"></span>
                )}
              </button>

              {/* Filter dropdown */}
              {showFilterDropdown && (
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="p-4 space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Search Filters</h3>
                    {filters.map((filter) => (
                      <div key={filter.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {filter.label}
                        </label>
                        {filter.type === 'select' ? (
                          <select
                            value={selectedFilters[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            className="w-full form-input text-sm"
                          >
                            <option value="">All</option>
                            {filter.options.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : filter.type === 'date' ? (
                          <input
                            type="date"
                            value={selectedFilters[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            className="w-full form-input text-sm"
                          />
                        ) : (
                          <input
                            type="text"
                            value={selectedFilters[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            className="w-full form-input text-sm"
                            placeholder={filter.placeholder}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(selectedFilters).map(([key, value]) => {
            const filter = filters.find(f => f.key === key)
            if (!filter || !value) return null

            const displayValue = filter.type === 'select' 
              ? filter.options.find(opt => opt.value === value)?.label 
              : value

            return (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {filter.label}: {displayValue}
                <button
                  onClick={() => handleFilterChange(key, '')}
                  className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Advanced search with multiple fields
export const AdvancedSearch = ({
  fields = [],
  onSearch,
  className = ''
}) => {
  const [searchCriteria, setSearchCriteria] = useState({})
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFieldChange = (fieldName, value) => {
    const newCriteria = {
      ...searchCriteria,
      [fieldName]: value
    }
    
    if (!value) {
      delete newCriteria[fieldName]
    }
    
    setSearchCriteria(newCriteria)
    onSearch(newCriteria)
  }

  const handleClear = () => {
    setSearchCriteria({})
    onSearch({})
  }

  const hasActiveCriteria = Object.keys(searchCriteria).length > 0

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Advanced Search</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {isExpanded ? 'Hide' : 'Show'} Fields
          </button>
        </div>
      </div>

      {/* Search Fields */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="form-label">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={searchCriteria[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="form-input"
                  >
                    <option value="">All</option>
                    {field.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'date' ? (
                  <input
                    type="date"
                    value={searchCriteria[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <input
                    type="text"
                    value={searchCriteria[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="form-input"
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Active criteria and clear button */}
          <div className="flex items-center justify-between">
            {hasActiveCriteria && (
              <div className="text-sm text-gray-600">
                {Object.keys(searchCriteria).length} active filter(s)
              </div>
            )}
            <button
              onClick={handleClear}
              className="text-sm text-red-600 hover:text-red-500"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar