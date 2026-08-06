import React from 'react'
import { Outlet } from 'react-router-dom'

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <Outlet />
    </div>
  )
}

export default PublicLayout