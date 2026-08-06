import React, { useState } from 'react'
import { Edit, Trash2, AlertTriangle, Calendar, Package, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/helpers'
import Modal from '../common/Modal'

const InventoryCard = ({ item, onEdit, onDelete, canEdit = false, canDelete = false }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const getStockStatus = () => {
    if (item.quantity === 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    } else if (item.quantity <= item.min_stock) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800', icon: Package }
    }
  }

  const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date()
  const isExpiringSoon = item.expiry_date && 
    new Date(item.expiry_date) > new Date() && 
    new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  const stockStatus = getStockStatus()
  const StatusIcon = stockStatus.icon

  const handleDelete = () => {
    onDelete(item.id)
    setShowDeleteModal(false)
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 border border-gray-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                {stockStatus.status}
              </span>
              {canEdit && (
                <button
                  onClick={() => onEdit(item)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {item.category && (
            <p className="text-sm text-gray-600 mt-1">{item.category}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
          )}

          {/* Stock Information */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Current Stock</p>
              <p className="text-lg font-semibold text-gray-900">{item.quantity}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Minimum Stock</p>
              <p className="text-lg font-semibold text-gray-900">{item.min_stock}</p>
            </div>
          </div>

          {/* Price */}
          {item.price && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 mb-1">Price</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(item.price)}
              </p>
            </div>
          )}

          {/* Expiry Date */}
          {item.expiry_date && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Expiry Date
              </p>
              <p className={`text-sm font-medium ${
                isExpired ? 'text-red-600' : 
                isExpiringSoon ? 'text-yellow-600' : 
                'text-gray-900'
              }`}>
                {formatDate(item.expiry_date)}
                {isExpired && ' (Expired)'}
                {isExpiringSoon && ' (Expiring Soon)'}
              </p>
            </div>
          )}

          {/* Supplier */}
          {item.supplier && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Supplier</p>
              <p className="text-sm text-gray-900 truncate">{item.supplier}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>ID: {item.id}</span>
            <span>Updated: {formatDate(item.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Inventory Item"
        size="sm"
      >
        <div className="text-center">
          <Trash2 className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Delete {item.name}?
          </h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this inventory item? This action cannot be undone.
          </p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn-danger"
            >
              Delete Item
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default InventoryCard