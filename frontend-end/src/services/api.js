import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://oriental-mindoro-southern-distric.onrender.com/api',
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials) => API.post('/login', credentials),
  register: (userData) => API.post('/register', userData),
  logout: () => API.post('/logout'),
  getMe: () => API.get('/me'),
}

export const appointmentAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return API.get(`/appointments?${queryString}`);
  },
  get: (id) => API.get(`/appointments/${id}`),
  create: (data) => API.post('/appointments', data),
  update: (id, data) => API.put(`/appointments/${id}`, data),
  delete: (id) => API.delete(`/appointments/${id}`),
  getDoctors: () => API.get('/doctors'),
  getDoctorsByDepartment: (departmentId) => API.get(`/appointments/doctors/by-department?department_id=${departmentId}`),
  // New methods for queue system
  getFormData: () => API.get('/appointments/create'),
  getAvailableSlots: (doctorId, date, departmentId = null) => {
    const dept = departmentId ? `&department_id=${departmentId}` : ''
    return API.get(`/appointments/slots/available?doctor_id=${doctorId}&date=${date}${dept}`)
  },
  updateStatus: (id, status, notes = null) => API.patch(`/appointments/${id}/status`, { status, notes }),
  cancel: (id, reason) => API.post(`/appointments/${id}/cancel`, { cancellation_reason: reason }),
  reschedule: (id, data) => API.post(`/appointments/${id}/reschedule`, data),
  reassign: (id, data) => API.post(`/appointments/${id}/reassign`, data),
  getDailyQueue: (departmentId) => API.get(`/appointments/queue/daily/${departmentId}`),
  // Calendar methods
  getWeeklyCalendar: (doctorId, weekStart) => API.get(`/appointments/calendar/weekly?doctor_id=${doctorId}&week_start=${weekStart}`),

  // Receptionist booking flow
  getBookingForm: () => API.get('/appointments/booking/form'),
  getDoctorSchedule: (params) => API.get('/appointments/doctors/schedule', { params }),
  getMonthlyAvailability: (params) => API.get('/appointments/slots/monthly-availability', { params }),
  checkPatientSameDay: (params) => API.get('/appointments/patient/same-day-check', { params }),
  bookByStaff: (data) => API.post('/appointments/book', data),
  sendSmsConfirmation: (appointmentId) => API.post(`/appointments/${appointmentId}/sms`),
}

export const medicalRecordAPI = {
  create: (appointmentId, data) => API.post(`/appointments/${appointmentId}/medical-record`, data),
  getByAppointment: (appointmentId) => API.get(`/appointments/${appointmentId}/medical-record`),
  saveDraft: (appointmentId, data) => API.put(`/appointments/${appointmentId}/medical-record/draft`, data),
  finalize: (appointmentId, data) => API.post(`/appointments/${appointmentId}/medical-record/finalize`, data),
  getPatientRecords: (patientId) => API.get(`/patients/${patientId}/medical-records`),
  update: (id, data) => API.put(`/medical-records/${id}`, data),
}

export const icd10API = {
  search: (q) => API.get(`/icd10/search?q=${encodeURIComponent(q)}`),
}

export const medicinesAPI = {
  search: (q, limit = 15) => API.get(`/medicines/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  get: (id) => API.get(`/medicines/${id}`),
}

export const dashboardAPI = {
  getStats: () => API.get('/dashboard/stats'),
  getRecentActivity: () => API.get('/dashboard/recent-activity'),
  getDoctorTodayAppointments: () => API.get('/dashboard/doctor-today-appointments'),
  getMonthlyAppointments: () => API.get('/dashboard/monthly-appointments'),
}

export const userAPI = {
  getAll: (params = {}) => API.get('/users', { params }),
  getPatients: (params = {}) => API.get('/patients', { params }),
  get: (id) => API.get(`/users/${id}`),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
  changePassword: (id, data) => API.post(`/users/${id}/change-password`, data),
}

export const inventoryAPI = {
  getAll: (params = {}) => API.get('/inventory', { params }),
  create: (data) => API.post('/inventory', data),
  get: (id) => API.get(`/inventory/${id}`),
  update: (id, data) => API.put(`/inventory/${id}`, data),
  delete: (id) => API.delete(`/inventory/${id}`),
  getLowStock: () => API.get('/inventory/alerts/low-stock'),
  getExpiring: (days = 30) => API.get(`/inventory/alerts/expiring?days=${days}`),
}

export const departmentAPI = {
  getAll: () => API.get('/departments'),
}

export const queueAPI = {
  generate: (data) => API.post('/queue/generate', data),
}

export const patientAPI = {
  getNextHospitalNumber: () => API.get('/patients/next-hospital-number'),
  findDuplicates: (params) => API.get('/patients/duplicates', { params }),
  staffRegister: (data) => API.post('/patients/staff-register', data),
  searchBarangays: (params) => API.get('/barangays/search', { params }),
  updateDemographics: (patientId, data) => API.put(`/patients/${patientId}/demographics`, data),
  getDemographicsAuditLogs: (patientId, params = {}) => API.get(`/patients/${patientId}/demographics/audit-logs`, { params }),
}

export const labRequestsAPI = {
  saveForAppointment: (appointmentId, data) => API.post(`/appointments/${appointmentId}/lab-requests`, data),
  getLatestForAppointment: (appointmentId) => API.get(`/appointments/${appointmentId}/lab-requests/latest`),
  getPendingQueue: (limit = 50) => API.get(`/lab-requests/pending?limit=${limit}`),
  getPendingForPatient: (patientId) => API.get(`/patients/${patientId}/lab-requests/pending`),
}

export const notificationAPI = {
  getAll: () => API.get('/notifications'),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllAsRead: () => API.post('/notifications/mark-all-read'),
}

export const billingAPI = {
  getAll: (params) => API.get('/billing', { params }),
  getPatientBills: (patientId) => API.get(`/patients/${patientId}/billing`),
  generateForAppointment: (appointmentId) => API.post(`/appointments/${appointmentId}/generate-bill`),
  markAsPaid: (id, paymentMethod) => API.patch(`/billing/${id}/pay`, { payment_method: paymentMethod }),
}

export const doctorLeaveAPI = {
  getAll: (params) => API.get('/doctor-leaves', { params }),
  create: (data) => API.post('/doctor-leaves', data),
  updateStatus: (id, status, admin_notes = null) => API.patch(`/doctor-leaves/${id}/status`, { status, admin_notes }),
}

export default API