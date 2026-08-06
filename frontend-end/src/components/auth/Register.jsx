import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Eye, EyeOff, UserPlus, ArrowLeft, User, Shield, AlertCircle,
  Mail, Phone, MapPin, Calendar, Activity, Droplets, Lock, X
} from 'lucide-react'
import { GENDERS } from '../../utils/constants'

const Register = ({ isModal = false, onClose, onSwitchToLogin }) => {
  // Only patients can self-register
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'patient',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    blood_type: '',
    allergies: '',
    medical_history: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Basic validation
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match')
      return
    }

    // Patient validation
    if (!formData.date_of_birth || !formData.gender) {
      setError('Date of birth and gender are required')
      return
    }

    setLoading(true)

    try {
      const result = await register(formData)
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.message || 'Registration failed. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const content = (
    <div className={`max-w-4xl w-full relative z-10 ${isModal ? 'my-auto py-8' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-white/60 overflow-hidden relative">
        {isModal && (
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-20 bg-transparent border-none shadow-none"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 mb-6 relative group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <UserPlus className="w-8 h-8 text-white relative z-10" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Create an Account</h1>
            <p className="text-slate-500 text-sm">Join OMSDH to start managing your health records securely</p>
          </div>

          <form className="space-y-10" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3.5 rounded-xl text-sm flex items-start animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 mr-2.5 flex-shrink-0"></div>
                <span>{error}</span>
              </div>
            )}

            {/* Information Alert - Staff Account Creation */}
            <div className="bg-blue-50/80 border border-blue-100 text-blue-800 px-5 py-4 rounded-2xl flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Medical Staff Accounts</p>
                <p className="text-sm mt-1 text-blue-700/80">
                  Are you a medical professional? Please contact the Admin or IT unit to have your account created. Self-registration is strictly for patients.
                </p>
              </div>
            </div>
            
            {/* Form Grid sections */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Column: Basic & Security */}
              <div className="md:col-span-5 space-y-8">
                {/* Basic Information */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center border-b border-slate-100 pb-3">
                    <User className="w-5 h-5 mr-2 text-blue-500" /> Basic Info
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Full Name <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <User className="h-4.5 w-4.5" />
                        </div>
                        <input
                          id="name" name="name" type="text" required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 outline-none text-slate-900 text-sm"
                          placeholder="John Doe" value={formData.name} onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Email Address <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <Mail className="h-4.5 w-4.5" />
                        </div>
                        <input
                          id="email" name="email" type="email" required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 outline-none text-slate-900 text-sm"
                          placeholder="you@example.com" value={formData.email} onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Phone Number</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <Phone className="h-4.5 w-4.5" />
                        </div>
                        <input
                          id="phone" name="phone" type="tel"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 outline-none text-slate-900 text-sm"
                          placeholder="(555) 123-4567" value={formData.phone} onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Address</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <MapPin className="h-4.5 w-4.5" />
                        </div>
                        <input
                          id="address" name="address" type="text"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 outline-none text-slate-900 text-sm"
                          placeholder="Your complete address" value={formData.address} onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="space-y-5 pt-2">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center border-b border-slate-100 pb-3">
                    <Shield className="w-5 h-5 mr-2 text-indigo-500" /> Security
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Password <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                          <Lock className="h-4.5 w-4.5" />
                        </div>
                        <input
                          id="password" name="password" type={showPassword ? 'text' : 'password'} required
                          className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 placeholder-slate-400 outline-none text-slate-900 text-sm"
                          placeholder="Create strong password" value={formData.password} onChange={handleChange}
                        />
                        <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-none shadow-none" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Confirm Password <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                          <Lock className="h-4.5 w-4.5" />
                        </div>
                        <input
                          id="password_confirmation" name="password_confirmation" type="password" required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 placeholder-slate-400 outline-none text-slate-900 text-sm"
                          placeholder="Re-enter password" value={formData.password_confirmation} onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Patient Details */}
              <div className="md:col-span-7 space-y-5 mt-8 md:mt-0 md:pl-8 md:border-l border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center border-b border-slate-100 pb-3">
                  <Activity className="w-5 h-5 mr-2 text-teal-500" /> Patient Details
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Date of Birth <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                        <Calendar className="h-4.5 w-4.5" />
                      </div>
                      <input
                        id="date_of_birth" name="date_of_birth" type="date" required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-200 outline-none text-slate-900 text-sm"
                        value={formData.date_of_birth} onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Gender <span className="text-red-500">*</span></label>
                    <select
                      id="gender" name="gender" required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-200 outline-none text-slate-900 text-sm appearance-none"
                      value={formData.gender} onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      {GENDERS.map(gender => (
                        <option key={gender.value} value={gender.value}>{gender.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="blood_type" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Blood Type</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                        <Droplets className="h-4.5 w-4.5" />
                      </div>
                      <input
                        id="blood_type" name="blood_type" type="text"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-200 placeholder-slate-400 outline-none text-slate-900 text-sm"
                        placeholder="A+, O-, etc." value={formData.blood_type} onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Emergency Contact</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                        <User className="h-4.5 w-4.5" />
                      </div>
                      <input
                        id="emergency_contact_name" name="emergency_contact_name" type="text"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-200 placeholder-slate-400 outline-none text-slate-900 text-sm"
                        placeholder="Full name" value={formData.emergency_contact_name} onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="allergies" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Allergies</label>
                  <textarea
                    id="allergies" name="allergies" rows="2"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-200 placeholder-slate-400 outline-none text-slate-900 text-sm resize-none"
                    placeholder="List any known allergies..." value={formData.allergies} onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="medical_history" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Medical History</label>
                  <textarea
                    id="medical_history" name="medical_history" rows="3"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-200 placeholder-slate-400 outline-none text-slate-900 text-sm resize-none"
                    placeholder="Any relevant past medical conditions..." value={formData.medical_history} onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-8 border-t border-slate-100 gap-4 sm:gap-0">
              <div className="w-full sm:w-auto">
                {!isModal ? (
                  <Link to="/" className="inline-flex items-center justify-center w-full sm:w-auto text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-4 py-2 rounded-lg hover:bg-slate-50">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to home
                  </Link>
                ) : (
                  <button type="button" onClick={onClose} className="inline-flex items-center justify-center w-full sm:w-auto text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-4 py-2 rounded-lg hover:bg-slate-50 bg-transparent border-none shadow-none">
                    Cancel
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto space-y-4 sm:space-y-0 sm:space-x-4">
                {isModal ? (
                  <button type="button" onClick={onSwitchToLogin} className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors bg-transparent border-none shadow-none p-0">
                    Already have an account?
                  </button>
                ) : (
                  <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    Already have an account?
                  </Link>
                )}
                
                <button
                  type="submit" disabled={loading}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-8 rounded-xl font-medium shadow-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
        
        {/* Decorative footer line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-90"></div>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] flex justify-center p-4 sm:p-6 lg:p-8 bg-slate-900/40 backdrop-blur-md overflow-y-auto transition-opacity" onClick={onClose}>
        {content}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-bl from-blue-600/10 via-indigo-600/5 to-transparent rounded-b-[100px] blur-3xl -z-10"></div>
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10"></div>
      {content}
    </div>
  )
}

export default Register