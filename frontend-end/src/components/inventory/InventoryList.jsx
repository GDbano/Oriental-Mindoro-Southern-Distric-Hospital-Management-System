import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Package, AlertTriangle, Calendar } from 'lucide-react'
import { inventoryAPI } from '../../services/api'
import InventoryCard from './InventoryCard'
import InventoryForm from './InventoryForm'
import SearchBar from '../common/SearchBar'
import LoadingSpinner from '../common/LoadingSpinner'
import { INVENTORY_CATEGORIES } from '../../utils/constants'

const InventoryList = ({ showActions = true, compact = false }) => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    stockStatus: '',
    showInactive: false
  })
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (filters.category) params.category = filters.category
      if (filters.stockStatus) params.stock_status = filters.stockStatus
      
      const response = await inventoryAPI.getAll(params)
      setInventory(response.data.data || response.data)
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    // In a real app, you might want to debounce this
    setTimeout(() => loadInventory(), 300)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleAddItem = () => {
    setEditingItem(null)
    setShowForm(true)
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleSaveItem = async (itemData) => {
    try {
      if (editingItem) {
        await inventoryAPI.update(editingItem.id, itemData)
      } else {
        await inventoryAPI.create(itemData)
      }
      setShowForm(false)
      setEditingItem(null)
      loadInventory()
    } catch (error) {
      throw error
    }
  }

  const handleDeleteItem = async (itemId) => {
    try {
      await inventoryAPI.delete(itemId)
      loadInventory()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  // Filter and sort inventory
  const filteredInventory = inventory
    .filter(item => {
      if (!filters.showInactive && !item.is_active) return false
      if (filters.stockStatus === 'low' && item.quantity > item.min_stock) return false
      if (filters.stockStatus === 'out' && item.quantity > 0) return false
      return true
    })
    .sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'name' || sortBy === 'category') {
        aValue = aValue?.toLowerCase() || ''
        bValue = bValue?.toLowerCase() || ''
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const lowStockCount = inventory.filter(item => item.quantity <= item.min_stock && item.quantity > 0).length
  const outOfStockCount = inventory.filter(item => item.quantity === 0).length
  const expiredCount = inventory.filter(item => 
    item.expiry_date && new Date(item.expiry_date) < new Date()
  ).length

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showActions && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600">Manage medical supplies and equipment</p>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={handleAddItem}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {showActions && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-semibold text-gray-900">{inventory.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-semibold text-yellow-600">{lowStockCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-semibold text-red-600">{outOfStockCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-semibold text-orange-600">{expiredCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search inventory items..."
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="form-input w-full sm:w-auto"
            >
              <option value="">All Categories</option>
              {INVENTORY_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={filters.stockStatus}
              onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
              className="form-input w-full sm:w-auto"
            >
              <option value="">All Stock Status</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showInactive}
                onChange={(e) => handleFilterChange('showInactive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">Show Inactive</span>
            </label>
          </div>
        </div>

        {/* Sort Options */}
        <div className="mt-4 flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <div className="flex space-x-2">
            {['name', 'quantity', 'category', 'price'].map(field => (
              <button
                key={field}
                onClick={() => handleSort(field)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  sortBy === field
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
                {sortBy === field && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Grid */}
      {filteredInventory.length > 0 ? (
        <div className={`grid gap-6 ${
          compact 
            ? 'grid-cols-1 sm:grid-cols-2' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {filteredInventory.map(item => (
            <InventoryCard
              key={item.id}
              item={item}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              canEdit={showActions}
              canDelete={showActions}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || Object.values(filters).some(f => f) 
              ? 'No items match your search criteria.' 
              : 'Get started by adding your first inventory item.'}
          </p>
          {showActions && (
            <button
              onClick={handleAddItem}
              className="btn-primary"
            >
              Add Your First Item
            </button>
          )}
        </div>
      )}

      {/* Inventory Form Modal */}
      {showForm && (
        <InventoryForm
          item={editingItem}
          onClose={() => {
            setShowForm(false)
            setEditingItem(null)
          }}
          onSave={handleSaveItem}
        />
      )}
    </div>
  )
}

export default InventoryList