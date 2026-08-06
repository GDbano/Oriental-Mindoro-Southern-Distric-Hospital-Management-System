import React, { useState, useEffect } from 'react'
import { AlertTriangle, Package, Calendar, Truck, Plus, Bell } from 'lucide-react'
import { inventoryAPI } from '../../services/api'
import InventoryCard from './InventoryCard'
import InventoryForm from './InventoryForm'
import LoadingSpinner from '../common/LoadingSpinner'
import { formatDate } from '../../utils/helpers'

const LowStockAlerts = ({ showActions = true, maxItems = 10 }) => {
  const [lowStockItems, setLowStockItems] = useState([])
  const [expiringItems, setExpiringItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [activeTab, setActiveTab] = useState('low-stock')

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const [lowStockRes, expiringRes] = await Promise.all([
        inventoryAPI.getLowStock(),
        inventoryAPI.getExpiring(30) // Items expiring in next 30 days
      ])
      setLowStockItems(lowStockRes.data.slice(0, maxItems))
      setExpiringItems(expiringRes.data.slice(0, maxItems))
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleSaveItem = async (itemData) => {
    try {
      if (editingItem) {
        await inventoryAPI.update(editingItem.id, itemData)
      }
      setShowForm(false)
      setEditingItem(null)
      loadAlerts()
    } catch (error) {
      throw error
    }
  }

  const handleDeleteItem = async (itemId) => {
    try {
      await inventoryAPI.delete(itemId)
      loadAlerts()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const getUrgencyLevel = (item) => {
    if (item.quantity === 0) return 'critical'
    if (item.quantity <= Math.floor(item.min_stock * 0.5)) return 'high'
    return 'medium'
  }

  const getExpiryUrgency = (expiryDate) => {
    const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry <= 7) return 'critical'
    if (daysUntilExpiry <= 14) return 'high'
    return 'medium'
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const totalAlerts = lowStockItems.length + expiringItems.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Bell className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Alerts</h1>
              <p className="text-gray-600">
                {totalAlerts} urgent item{totalAlerts !== 1 ? 's' : ''} requiring attention
              </p>
            </div>
          </div>
          {showActions && totalAlerts > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Reorder Items
            </button>
          )}
        </div>
      </div>

      {/* Alert Summary */}
      {totalAlerts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-red-800">Critical Stock</p>
                <p className="text-2xl font-semibold text-red-900">
                  {lowStockItems.filter(item => getUrgencyLevel(item) === 'critical').length}
                </p>
                <p className="text-sm text-red-700">Out of stock items</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-800">Low Stock</p>
                <p className="text-2xl font-semibold text-orange-900">
                  {lowStockItems.filter(item => getUrgencyLevel(item) !== 'critical').length}
                </p>
                <p className="text-sm text-orange-700">Items below minimum</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-800">Expiring Soon</p>
                <p className="text-2xl font-semibold text-yellow-900">
                  {expiringItems.length}
                </p>
                <p className="text-sm text-yellow-700">Within 30 days</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'low-stock', label: 'Low Stock', count: lowStockItems.length },
            { key: 'expiring', label: 'Expiring Soon', count: expiringItems.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${
                  activeTab === tab.key
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Low Stock Items */}
      {activeTab === 'low-stock' && (
        <div>
          {lowStockItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lowStockItems.map(item => {
                const urgency = getUrgencyLevel(item)
                return (
                  <div key={item.id} className="relative">
                    {/* Urgency Indicator */}
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      urgency === 'critical' ? 'bg-red-500' :
                      urgency === 'high' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`}>
                      {urgency === 'critical' ? '!' : 'i'}
                    </div>
                    
                    <InventoryCard
                      item={item}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                      canEdit={showActions}
                      canDelete={showActions}
                    />
                    
                    {/* Action Suggestions */}
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-900 mb-1">Recommended Action:</p>
                      <p className="text-xs text-gray-600">
                        {urgency === 'critical' ? 'URGENT: Restock immediately' :
                         urgency === 'high' ? 'Order replacement soon' :
                         'Monitor stock levels'}
                      </p>
                      {showActions && (
                        <button
                          onClick={() => handleEditItem(item)}
                          className="mt-2 w-full text-xs text-blue-600 hover:text-blue-500 font-medium"
                        >
                          Update Stock
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Package className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Low Stock Items</h3>
              <p className="text-gray-600">All inventory items are sufficiently stocked.</p>
            </div>
          )}
        </div>
      )}

      {/* Expiring Items */}
      {activeTab === 'expiring' && (
        <div>
          {expiringItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expiringItems.map(item => {
                const urgency = getExpiryUrgency(item.expiry_date)
                const daysUntilExpiry = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={item.id} className="relative">
                    {/* Urgency Indicator */}
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      urgency === 'critical' ? 'bg-red-500' :
                      urgency === 'high' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`}>
                      {urgency === 'critical' ? '!' : 'i'}
                    </div>
                    
                    <InventoryCard
                      item={item}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                      canEdit={showActions}
                      canDelete={showActions}
                    />
                    
                    {/* Expiry Information */}
                    <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-yellow-800">Expires in:</span>
                        <span className={`font-bold ${
                          urgency === 'critical' ? 'text-red-600' :
                          urgency === 'high' ? 'text-orange-600' :
                          'text-yellow-600'
                        }`}>
                          {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        {urgency === 'critical' ? 'Use immediately or dispose' :
                         urgency === 'high' ? 'Prioritize usage' :
                         'Plan for replacement'}
                      </p>
                      {showActions && (
                        <button
                          onClick={() => handleEditItem(item)}
                          className="mt-2 w-full text-xs text-blue-600 hover:text-blue-500 font-medium"
                        >
                          Update Item
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Calendar className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Expiring Items</h3>
              <p className="text-gray-600">No items are expiring in the next 30 days.</p>
            </div>
          )}
        </div>
      )}

      {/* No Alerts State */}
      {totalAlerts === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-600 mb-4">
            No urgent inventory alerts at this time. All items are properly stocked and within expiry dates.
          </p>
          {showActions && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Add New Item
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

export default LowStockAlerts