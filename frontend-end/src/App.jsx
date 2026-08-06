import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import PublicLayout from './components/layout/PublicLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import LandingPage from './components/public/LandingPage'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import PatientDashboard from './components/dashboard/PatientDashboard'
import DoctorDashboard from './components/dashboard/DoctorDashboard'
import ReceptionistDashboard from './components/dashboard/ReceptionistDashboard'
import AdminDashboard from './components/dashboard/AdminDashboard'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoadingSpinner from './components/common/LoadingSpinner'
import PatientDetailsPage from './components/patients/PatientDetailsPage'
import PatientList from './components/patients/PatientList'
import EditPatientInformation from './components/patients/EditPatientInformation'
import DoctorCalendarView from './components/appointments/DoctorCalendarView'
import DoctorEncounterPage from './components/medical/DoctorEncounterPage'
import MedicalRecordsPage from './components/medical/MedicalRecordsPage'
import WalkInQueueGenerator from './components/queue/WalkInQueueGenerator'
import ReceptionistAppointmentBooking from './components/appointments/ReceptionistAppointmentBooking'
import ReceptionistPatientRegistration from './components/patients/ReceptionistPatientRegistration'
import MedTechLabQueuePage from './components/labs/MedTechLabQueuePage'
import InventoryList from './components/inventory/InventoryList'
import UserManagementPage from './components/admin/UserManagementPage'
import AdminReportsPage from './components/admin/AdminReportsPage'
import SettingsPage from './components/settings/SettingsPage'
import AppointmentManagementPage from './components/appointments/AppointmentManagementPage'
import AdminBillingPage from './components/admin/AdminBillingPage'
import LeaveManagementPage from './components/dashboard/LeaveManagementPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    )
  }

  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'patient':
        return <PatientDashboard />
      case 'doctor':
        return <DoctorDashboard />
      case 'staff':
        return <ReceptionistDashboard />
      case 'records_officer':
        return <ReceptionistDashboard />
      case 'medtech':
        return <MedTechLabQueuePage />
      case 'cashier':
      case 'admin':
        return <AdminDashboard />
      default:
        return <Navigate to="/login" replace />
    }
  }

  const getAppointmentsComponent = () => {
    switch (user?.role) {
      case 'patient':
        return <PatientDashboard />
      case 'staff':
      case 'records_officer':
        return <ReceptionistDashboard />
      case 'admin':
        return <AppointmentManagementPage title="Appointments" userRole="admin" />
      default:
        return getDashboardComponent()
    }
  }

  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="about" element={<div>About Page</div>} />
        <Route path="contact" element={<div>Contact Page</div>} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={getDashboardComponent()} />
        {/* Patient routes */}
        <Route path="appointments" element={getAppointmentsComponent()} />
        <Route path="medical-records" element={<MedicalRecordsPage />} />
        <Route path="profile" element={getDashboardComponent()} />
        {/* Other routes */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="walk-in-queue" element={<WalkInQueueGenerator />} />
        <Route path="appointments/book" element={<ReceptionistAppointmentBooking />} />
        <Route path="patients/register" element={<ReceptionistPatientRegistration />} />
        <Route path="patients" element={<PatientList />} />
        <Route path="patients/:patientId" element={<PatientDetailsPage />} />
        <Route path="patients/:patientId/edit" element={<EditPatientInformation />} />
        <Route path="appointments/calendar" element={<DoctorCalendarView />} />
        <Route path="schedule" element={<DoctorCalendarView />} />
        <Route path="appointments/:appointmentId/encounter" element={<DoctorEncounterPage />} />
        <Route path="lab-requests" element={<MedTechLabQueuePage />} />
        <Route path="medical" element={<MedicalRecordsPage />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="billing" element={<AdminBillingPage />} />
        <Route path="leave-management" element={<LeaveManagementPage />} />
      </Route>

      {/* Error/404 page */}
      <Route path="/404" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-gray-600 mb-4">Page not found</p>
            <Navigate to="/" replace />
          </div>
        </div>
      } />

      {/* Redirect handling */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App