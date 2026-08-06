export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePhone = (phone) => {
  const re = /^[\+]?[1-9][\d]{0,15}$/
  return re.test(phone.replace(/[\s\-\(\)]/g, ''))
}

export const validatePassword = (password) => {
  return password.length >= 8
}

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0
}

export const validateAppointmentDate = (date) => {
  const selectedDate = new Date(date)
  const now = new Date()
  return selectedDate > now
}

export const validateFutureDate = (date) => {
  const selectedDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return selectedDate >= today
}