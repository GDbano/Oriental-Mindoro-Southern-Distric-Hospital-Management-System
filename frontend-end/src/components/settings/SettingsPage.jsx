import React from 'react'
import ProfileUpdateForm from '../forms/ProfileUpdateForm'

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600">Profile and security</p>
      </div>

      <ProfileUpdateForm />
    </div>
  )
}

export default SettingsPage
