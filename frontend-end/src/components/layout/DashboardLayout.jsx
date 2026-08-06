import React, { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  Menu,
  X,
  User,
  LogOut,
  Stethoscope,
  Calendar,
  Users,
  Settings,
  Bell,
  Home,
  FileText,
  ClipboardList,
  Package,
  BarChart3,
  Heart,
  Receipt
} from 'lucide-react'

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const getNavigationItems = () => {
    const baseItems = [
      { 
        name: 'Dashboard', 
        href: '/dashboard', 
        icon: Home,
        roles: ['patient', 'doctor', 'staff', 'records_officer', 'admin', 'medtech']
      },
    ]

    if (user?.role === 'patient') {
      return [
        ...baseItems,
        { 
          name: 'My Appointments', 
          href: '/dashboard/appointments', 
          icon: Calendar,
          roles: ['patient']
        },
        { 
          name: 'Medical Records', 
          href: '/dashboard/medical-records', 
          icon: FileText,
          roles: ['patient']
        },
        { 
          name: 'My Profile', 
          href: '/dashboard/profile', 
          icon: User,
          roles: ['patient']
        },
      ]
    }

    if (user?.role === 'doctor') {
      return [
        ...baseItems,
        { 
          name: 'Today\'s Schedule', 
          href: '/dashboard/schedule', 
          icon: Calendar,
          roles: ['doctor']
        },
        { 
          name: 'Patients', 
          href: '/dashboard/patients', 
          icon: Users,
          roles: ['doctor']
        },
        { 
          name: 'Medical Records', 
          href: '/dashboard/medical', 
          icon: Heart,
          roles: ['doctor']
        },
        { 
          name: 'Leave Management', 
          href: '/dashboard/leave-management', 
          icon: Calendar,
          roles: ['doctor']
        },
      ]
    }

    if (user?.role === 'staff' || user?.role === 'records_officer') {
      return [
        ...baseItems,
        { 
          name: 'Appointments', 
          href: '/dashboard/appointments', 
          icon: Calendar,
          roles: ['staff', 'records_officer']
        },
        { 
          name: 'Patients', 
          href: '/dashboard/patients', 
          icon: Users,
          roles: ['staff', 'records_officer']
        },
        { 
          name: 'Inventory', 
          href: '/dashboard/inventory', 
          icon: Package,
          roles: ['staff', 'records_officer']
        },
        { 
          name: 'Billing / Cashier', 
          href: '/dashboard/billing', 
          icon: Receipt,
          roles: ['staff']
        },
      ]
    }

    if (user?.role === 'cashier') {
      return [
        ...baseItems,
        { 
          name: 'Billing / Cashier', 
          href: '/dashboard/billing', 
          icon: Receipt,
          roles: ['cashier']
        },
        { 
          name: 'Inventory', 
          href: '/dashboard/inventory', 
          icon: Package,
          roles: ['cashier']
        },
        { 
          name: 'Reports', 
          href: '/dashboard/reports', 
          icon: BarChart3,
          roles: ['cashier']
        },
      ]
    }

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { 
          name: 'User Management', 
          href: '/dashboard/users', 
          icon: Users,
          roles: ['admin']
        },
        { 
          name: 'Appointments', 
          href: '/dashboard/appointments', 
          icon: Calendar,
          roles: ['admin']
        },
        { 
          name: 'Leave Management', 
          href: '/dashboard/leave-management', 
          icon: Calendar,
          roles: ['admin']
        },
        { 
          name: 'Inventory', 
          href: '/dashboard/inventory', 
          icon: Package,
          roles: ['admin']
        },
        { 
          name: 'Billing / Cashier', 
          href: '/dashboard/billing', 
          icon: Receipt,
          roles: ['admin']
        },
        { 
          name: 'Reports', 
          href: '/dashboard/reports', 
          icon: BarChart3,
          roles: ['admin']
        },
        { 
          name: 'System Settings', 
          href: '/dashboard/settings', 
          icon: Settings,
          roles: ['admin']
        },
      ]
    }

    if (user?.role === 'medtech') {
      return [
        ...baseItems,
        {
          name: 'Lab Requests',
          href: '/dashboard/lab-requests',
          icon: ClipboardList,
          roles: ['medtech'],
        },
      ]
    }

    return baseItems
  }

  const navigation = getNavigationItems()

  const isActiveLink = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(href)
  }

  const getUserDisplayInfo = () => {
    const roleDisplay = {
      patient: 'Patient',
      doctor: 'Medical Practitioner',
      staff: 'Staff Member',
      records_officer: 'Records Officer',
      admin: 'Administrator',
      medtech: 'MedTech'
    }

    return {
      name: user?.name || 'User',
      role: roleDisplay[user?.role] || 'User',
      email: user?.email || ''
    }
  }

  const userInfo = getUserDisplayInfo()

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-60"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full" style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #162d4a 100%)' }}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center px-5 pb-4 border-b border-white/10">
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
                <img src="/Picture1.png" alt="OMSDH" className="h-full w-full object-contain" />
              </div>
              <div className="ml-3">
                <span className="text-lg font-bold text-white tracking-wide">OMSDH</span>
                <p className="text-xs text-blue-200 leading-none mt-0.5">Management System</p>
              </div>
            </div>
            <nav className="mt-4 px-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActiveLink(item.href)
                      ? 'text-white border-l-4 border-blue-400 pl-2'
                      : 'text-blue-100 hover:text-white'
                  }`}
                  style={isActiveLink(item.href)
                    ? { backgroundColor: 'rgba(255,255,255,0.15)' }
                    : {}}
                  onMouseEnter={e => { if (!isActiveLink(item.href)) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={e => { if (!isActiveLink(item.href)) e.currentTarget.style.backgroundColor = '' }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActiveLink(item.href) ? 'text-blue-300' : 'text-blue-300/70'
                  }`} />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 border-t border-white/10">
            <div className="flex items-center w-full">
              <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{userInfo.name}</p>
                <p className="text-xs text-blue-200 truncate">{userInfo.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 flex-shrink-0 text-blue-200 hover:text-white transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0" style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #162d4a 100%)' }}>
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-5 pb-5 border-b border-white/10">
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-1">
                <img src="/Picture1.png" alt="OMSDH" className="h-full w-full object-contain" />
              </div>
              <div className="ml-3">
                <span className="text-lg font-bold text-white tracking-wide">OMSDH</span>
                <p className="text-xs text-blue-200 leading-none mt-0.5">Management System</p>
              </div>
            </div>

            <nav className="mt-4 flex-1 px-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActiveLink(item.href)
                      ? 'text-white border-l-4 border-blue-400 pl-2'
                      : 'text-blue-100 hover:text-white'
                  }`}
                  style={isActiveLink(item.href)
                    ? { backgroundColor: 'rgba(255,255,255,0.15)' }
                    : {}}
                  onMouseEnter={e => { if (!isActiveLink(item.href)) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={e => { if (!isActiveLink(item.href)) e.currentTarget.style.backgroundColor = '' }}
                >
                  <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActiveLink(item.href) ? 'text-blue-300' : 'text-blue-300/70'
                  }`} />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* User info at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-white/10">
            <div className="flex items-center w-full">
              <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{userInfo.name}</p>
                <p className="text-xs text-blue-200 truncate">{userInfo.role}</p>
                <p className="text-xs text-blue-300/60 truncate">{userInfo.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 flex-shrink-0 text-blue-200 hover:text-white transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top navbar for mobile */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3" style={{ backgroundColor: '#f1f5f9' }}>
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Main content area */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout