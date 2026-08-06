import React, { useState, useEffect } from 'react'
import { Save, X, Package, DollarSign, Calendar, Truck } from 'lucide-react'
import { INVENTORY_CATEGORIES } from '../../utils/constants'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'

const InventoryForm = ({ item, onClose, onSave, isOpen = true }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: '',
    min_stock: '',
    price: '',
    expiry_date: '',
    supplier: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        category: item.category || '',
        quantity: item.quantity?.toString() || '',
        min_stock: item.min_stock?.toString() || '',
        price: item.price?.toString() || '',
        expiry_date: item.expiry_date || '',
        supplier: item.supplier || '',
        is_active: item.is_active !== undefined ? item.is_active : true
      })
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        quantity: '',
        min_stock: '',
        price: '',
        expiry_date: '',
        supplier: '',
        is_active: true
      })
    }
    setErrors({})
  }, [item])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (!formData.quantity || isNaN(formData.quantity) || parseInt(formData.quantity) < 0) {
      newErrors.quantity = 'Valid quantity is required'
    }

    if (!formData.min_stock || isNaN(formData.min_stock) || parseInt(formData.min_stock) < 0) {
      newErrors.min_stock = 'Valid minimum stock is required'
    }

    if (formData.price && (isNaN(formData.price) || parseFloat(formData.price) < 0)) {
      newErrors.price = 'Valid price is required'
    }

    if (formData.expiry_date && new Date(formData.expiry_date) < new Date()) {
      newErrors.expiry_date = 'Expiry date cannot be in the past'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const submitData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        min_stock: parseInt(formData.min_stock),
        price: formData.price ? parseFloat(formData.price) : null,
        expiry_date: formData.expiry_date || null,
        supplier: formData.supplier || null,
        description: formData.description || null
      }

      await onSave(submitData)
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Failed to save inventory item' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={item ? 'Edit Inventory Item' : 'Add New Inventory Item'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {errors.submit}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Basic Information
            </h3>

            <div>
              <label htmlFor="name" className="form-label">
                Item Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`form-input ${errors.name ? 'border-red-300' : ''}`}
                placeholder="Enter item name"
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="category" className="form-label">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`form-input ${errors.category ? 'border-red-300' : ''}`}
              >
                <option value="">Select Category</option>
                {INVENTORY_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <p className="form-error">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="form-input"
                placeholder="Enter item description (optional)"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Active Item
              </label>
            </div>
          </div>

          {/* Stock & Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Stock & Pricing
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="form-label">
                  Quantity *
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0"
                  className={`form-input ${errors.quantity ? 'border-red-300' : ''}`}
                  placeholder="0"
                />
                {errors.quantity && <p className="form-error">{errors.quantity}</p>}
              </div>

              <div>
                <label htmlFor="min_stock" className="form-label">
                  Minimum Stock *
                </label>
                <input
                  type="number"
                  id="min_stock"
                  name="min_stock"
                  value={formData.min_stock}
                  onChange={handleChange}
                  min="0"
                  className={`form-input ${errors.min_stock ? 'border-red-300' : ''}`}
                  placeholder="0"
                />
                {errors.min_stock && <p className="form-error">{errors.min_stock}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="price" className="form-label">
                Price (per unit)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`form-input pl-7 ${errors.price ? 'border-red-300' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && <p className="form-error">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="expiry_date" className="form-label flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Expiry Date
              </label>
              <input
                type="date"
                id="expiry_date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                className={`form-input ${errors.expiry_date ? 'border-red-300' : ''}`}
              />
              {errors.expiry_date && <p className="form-error">{errors.expiry_date}</p>}
            </div>

            <div>
              <label htmlFor="supplier" className="form-label flex items-center">
                <Truck className="h-4 w-4 mr-1" />
                Supplier
              </label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter supplier name (optional)"
              />
            </div>
          </div>
        </div>

        {/* Stock Status Preview */}
        {(formData.quantity !== '' && formData.min_stock !== '') && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Stock Status Preview</h4>
            <div className="flex items-center space-x-4 text-sm">
              <span className="font-medium text-gray-600">Current Quantity:</span>
              <span className="font-semibold">{formData.quantity}</span>
              <span className="font-medium text-gray-600">Minimum Stock:</span>
              <span className="font-semibold">{formData.min_stock}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                parseInt(formData.quantity) === 0 ? 'bg-red-100 text-red-800' :
                parseInt(formData.quantity) <= parseInt(formData.min_stock) ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {parseInt(formData.quantity) === 0 ? 'Out of Stock' :
                 parseInt(formData.quantity) <= parseInt(formData.min_stock) ? 'Low Stock' :
                 'In Stock'}
              </span>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Fields marked with * are required
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <LoadingSpinner size="small" text="" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {item ? 'Update Item' : 'Add Item'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default InventoryForm