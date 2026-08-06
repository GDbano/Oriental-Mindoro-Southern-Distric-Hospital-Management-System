import React, { useEffect } from 'react'
import { X, Check, AlertTriangle, AlertCircle, Info } from 'lucide-react'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  hideHeader = false
}) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
        onClick={handleOverlayClick}
      >
        {/* Background overlay with smooth transition */}
        <div 
          className={`fixed inset-0 transition-opacity duration-300 bg-gray-900 bg-opacity-50 backdrop-blur-sm ${overlayClassName}`}
          aria-hidden="true"
        ></div>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal panel with smooth animation */}
        <div 
          className={`inline-block w-full ${sizeClasses[size]} my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-xl ${className}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          {/* Header */}
          {!hideHeader && (title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              {title && (
                <h3 
                  id="modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={hideHeader ? 'p-0' : 'px-6 py-5'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// Confirmation Modal
export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  icon: Icon = null,
  destructive = false
}) => {
  const variantConfig = {
    default: {
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      icon: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    danger: {
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      icon: 'text-red-600',
      bg: 'bg-red-50'
    },
    warning: {
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      icon: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    success: {
      button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      icon: 'text-green-600',
      bg: 'bg-green-50'
    }
  }

  const config = variantConfig[destructive ? 'danger' : variant]

  // Default icons for variants
  const getDefaultIcon = () => {
    if (Icon) return Icon
    if (destructive || variant === 'danger') return AlertTriangle
    if (variant === 'warning') return AlertCircle
    if (variant === 'success') return Check
    return Info
  }

  const DefaultIcon = getDefaultIcon()

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!loading}
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
            <DefaultIcon className={`h-5 w-5 ${config.icon}`} />
          </div>
          <div className="flex-1">
            <p className="text-gray-700 leading-relaxed">{message}</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${config.button}`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Success Modal
export const SuccessModal = ({
  isOpen,
  onClose,
  title = "Success!",
  message = "The operation was completed successfully.",
  buttonText = "Continue",
  onButtonClick,
  showIcon = true
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-5">
        {showIcon && (
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        )}
        
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>
        
        <div className="flex justify-center pt-2">
          <button
            onClick={onButtonClick || onClose}
            className="btn-primary bg-green-600 hover:bg-green-700 focus:ring-green-500 px-6 py-2.5"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Error Modal
export const ErrorModal = ({
  isOpen,
  onClose,
  title = "Error",
  message = "An error occurred while processing your request.",
  buttonText = "Try Again",
  onButtonClick,
  showIcon = true
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-5">
        {showIcon && (
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        )}
        
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>
        
        <div className="flex justify-center pt-2">
          <button
            onClick={onButtonClick || onClose}
            className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500 px-6 py-2.5"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Loading Modal
export const LoadingModal = ({
  isOpen,
  onClose,
  title = "Processing",
  message = "Please wait while we process your request...",
  showCloseButton = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={showCloseButton}
      closeOnOverlayClick={false}
    >
      <div className="space-y-5">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  )
}

// Form Modal (for forms with actions)
export const FormModal = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  loading = false,
  size = 'md',
  submitVariant = 'default'
}) => {
  const variantClasses = {
    default: 'bg-blue-600 hover:bg-blue-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title={title}
      size={size}
      closeOnOverlayClick={!loading}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 ${variantClasses[submitVariant]}`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </div>
            ) : (
              submitText
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default Modal