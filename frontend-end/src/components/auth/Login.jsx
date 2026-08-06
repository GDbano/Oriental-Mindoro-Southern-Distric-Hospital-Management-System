import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, LogIn, Mail, Lock, X } from 'lucide-react'

const Login = ({ isModal = false, onClose, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(formData)
    setLoading(false)

    if (result.success) {
      navigate(from, { replace: true })
    } else {
      setError(result.message)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const content = (
    <div className={`w-full max-w-lg relative z-10 ${isModal ? 'my-auto' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-white/60 overflow-hidden relative">
        {isModal && (
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-20 bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 mb-6 relative group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <LogIn className="w-8 h-8 text-white relative z-10" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Welcome Back</h1>
            <p className="text-slate-500 text-sm">Sign in to OMSDH to continue managing your health</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3.5 rounded-xl text-sm flex items-start animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 mr-2.5 flex-shrink-0"></div>
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 outline-none text-slate-900"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 outline-none text-slate-900"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none bg-transparent border-none shadow-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center pt-1">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-500/30 border-slate-300 rounded cursor-pointer transition-colors"
              />
              <label htmlFor="remember-me" className="ml-3 block text-sm text-slate-600 cursor-pointer select-none">
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-medium shadow-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <LogIn className="w-5 h-5 ml-1" />
                  </>
                )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              {isModal ? (
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none ml-1 bg-transparent border-none shadow-none p-0"
                >
                  Create one now
                </button>
              ) : (
                <Link
                  to="/register"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors ml-1"
                >
                  Create one now
                </Link>
              )}
            </p>
          </div>
        </div>
        
        {/* Decorative footer line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-90"></div>
      </div>
      
      {!isModal && (
        <div className="mt-8 text-center space-y-4">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-white/50 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-sm hover:bg-white border border-slate-200/50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Home
          </Link>
        </div>
      )}
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md overflow-y-auto transition-opacity" onClick={onClose}>
        {content}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-transparent rounded-b-[100px] blur-3xl -z-10"></div>
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10"></div>
      {content}
    </div>
  )
}

export default Login