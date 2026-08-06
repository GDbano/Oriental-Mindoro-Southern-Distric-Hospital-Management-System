import React from 'react'
import { Clock, User, FileText, Plus, Settings, Calendar, CheckCircle, Bell, Activity } from 'lucide-react'

const PatientSidebar = ({ 
  user, 
  stats, 
  upcomingAppointments, 
  medicalRecords, 
  onBookAppointment, 
  onTabChange 
}) => {
  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{user?.name || 'Patient'}</h3>
            <p className="text-blue-100 text-sm">ID: #{user?.id || 'N/A'}</p>
          </div>
        </div>
        <div className="text-blue-50 text-sm space-y-1">
          <p>{user?.email || 'N/A'}</p>
          <p className="text-green-200">✓ Active</p>
        </div>
      </div>

      {/* Next Appointment */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          Next Appointment
        </h3>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 font-semibold">📅 Date</p>
              <p className="text-gray-900">
                {new Date(upcomingAppointments[0].appointment_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">⏰ Time</p>
              <p className="text-gray-900">{upcomingAppointments[0].scheduled_time || 'TBD'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">👨‍⚕️ Doctor</p>
              <p className="text-gray-900">{upcomingAppointments[0].doctor?.name || 'Assigned'}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No upcoming appointments</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onBookAppointment}
            className="flex items-center justify-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Book</span>
          </button>
          <button
            onClick={() => onTabChange('medical')}
            className="flex items-center justify-center space-x-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-600 font-semibold transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Records</span>
          </button>
          <button
            onClick={() => onTabChange('profile')}
            className="flex items-center justify-center space-x-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-600 font-semibold transition-colors"
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => alert('Settings coming soon')}
            className="flex items-center justify-center space-x-2 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-600 font-semibold transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Health Stats */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 text-green-600 mr-2" />
          Health Stats
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-2 bg-white bg-opacity-50 rounded-lg">
            <span className="text-gray-700">📊 Total Visits</span>
            <span className="font-bold text-gray-900">{stats.total_appointments || 0}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white bg-opacity-50 rounded-lg">
            <span className="text-gray-700">✅ Completed</span>
            <span className="font-bold text-gray-900">{stats.completed_appointments || 0}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white bg-opacity-50 rounded-lg">
            <span className="text-gray-700">⏳ Pending</span>
            <span className="font-bold text-gray-900">{upcomingAppointments.length || 0}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white bg-opacity-50 rounded-lg">
            <span className="text-gray-700">📄 Records</span>
            <span className="font-bold text-gray-900">{medicalRecords.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Health Tips */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">💡 Health Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✔ Drink 8 glasses of water daily</li>
          <li>✔ Exercise 30 minutes daily</li>
          <li>✔ Sleep 7-9 hours each night</li>
          <li>✔ Eat balanced meals</li>
        </ul>
      </div>

      {/* Alert if no appointments */}
      {upcomingAppointments.length === 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Bell className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">No Appointments</p>
              <p className="text-amber-700 text-sm mt-1">Schedule your next appointment to avoid delays</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientSidebar
