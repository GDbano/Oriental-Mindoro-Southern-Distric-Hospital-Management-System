import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Calendar, CheckCircle2, Clock, Printer, Send, Stethoscope, User2, AlertTriangle } from 'lucide-react'
import PatientSearch from '../patients/PatientSearch'
import { appointmentAPI, userAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const formatMonthKey = (year, monthIndex) => {
  const m = String(monthIndex + 1).padStart(2, '0')
  return `${year}-${m}`
}

const toISODate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const isPastDate = (isoDate) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setHours(0, 0, 0, 0)
  return dt < today
}

const ReceptionistAppointmentBooking = () => {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingSms, setSendingSms] = useState(false)
  const [error, setError] = useState(null)

  const [patient, setPatient] = useState(null)
  const [appointmentTypes, setAppointmentTypes] = useState([])
  const [departments, setDepartments] = useState([])

  const [appointmentTypeId, setAppointmentTypeId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [doctors, setDoctors] = useState([])
  const [doctorId, setDoctorId] = useState('')
  const [doctorSchedule, setDoctorSchedule] = useState([])

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), monthIndex: now.getMonth() }
  })
  const [fullyBookedDates, setFullyBookedDates] = useState([])
  const [unavailableDates, setUnavailableDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('')

  const [availableSlots, setAvailableSlots] = useState([])
  const [allSlots, setAllSlots] = useState([])
  const [bookedSlots, setBookedSlots] = useState([])
  const [selectedTime, setSelectedTime] = useState('')

  const [notes, setNotes] = useState('')
  const [sameDayWarning, setSameDayWarning] = useState(null)

  const [confirmation, setConfirmation] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [smsMessage, setSmsMessage] = useState(null)

  const loadForm = async () => {
    try {
      setLoading(true)
      setError(null)

      const formRes = await appointmentAPI.getBookingForm()

      const types = formRes.data?.appointmentTypes || []
      setAppointmentTypes(types)
      if (types.length > 0) {
        setAppointmentTypeId(String(types[0].id))
      }

      const depts = formRes.data?.departments || []
      setDepartments(depts)
      if (depts.length > 0) {
        setDepartmentId(String(depts[0].id))
      }
    } catch (e) {
      console.error('Failed to load booking form:', e)
      setError('Failed to load booking form data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForm()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const patientId = params.get('patient_id')
    if (!patientId) return
    if (patient) return

    const loadPatient = async () => {
      try {
        const res = await userAPI.getPatients({ patient_id: Number(patientId) })
        const found = res.data?.patients?.[0]
        if (found) setPatient(found)
      } catch (e) {
        console.error('Failed to preselect patient:', e)
      }
    }

    loadPatient()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const loadDoctors = async () => {
    if (!departmentId) {
      setDoctors([])
      setDoctorId('')
      return
    }
    try {
      setError(null)
      setDoctors([])
      setDoctorId('')
      setDoctorSchedule([])
      setSelectedDate('')
      setSelectedTime('')
      setAvailableSlots([])
      setBookedSlots([])
      setFullyBookedDates([])
      setUnavailableDates([])

      const res = await appointmentAPI.getDoctorsByDepartment(departmentId)
      const list = res.data?.doctors || []
      setDoctors(list)
      if (list.length > 0) {
        setDoctorId(String(list[0].id))
      }
    } catch (e) {
      console.error('Failed to load doctors:', e)
      setError('Failed to load doctors for department')
    }
  }

  useEffect(() => {
    if (!loading) {
      loadDoctors()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId])

  const loadDoctorSchedule = async () => {
    if (!doctorId || !departmentId) {
      setDoctorSchedule([])
      return
    }
    try {
      const res = await appointmentAPI.getDoctorSchedule({
        doctor_id: Number(doctorId),
        department_id: Number(departmentId),
      })
      setDoctorSchedule(res.data?.schedules || [])
    } catch (e) {
      console.error('Failed to load doctor schedule:', e)
      setDoctorSchedule([])
    }
  }

  const loadMonthAvailability = async () => {
    if (!doctorId || !departmentId) {
      setFullyBookedDates([])
      setUnavailableDates([])
      return
    }
    try {
      const res = await appointmentAPI.getMonthlyAvailability({
        doctor_id: Number(doctorId),
        department_id: Number(departmentId),
        year: calendarMonth.year,
        month: calendarMonth.monthIndex + 1,
      })
      setFullyBookedDates(res.data?.fully_booked_dates || [])
      setUnavailableDates(res.data?.unavailable_dates || [])
    } catch (e) {
      console.error('Failed to load month availability:', e)
      setFullyBookedDates([])
      setUnavailableDates([])
    }
  }

  useEffect(() => {
    loadDoctorSchedule()
    loadMonthAvailability()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, departmentId, calendarMonth.year, calendarMonth.monthIndex])

  const loadSlotsForDate = async (date) => {
    if (!doctorId || !date) return
    try {
      setError(null)
      setSelectedTime('')
      setSameDayWarning(null)

      const [slotsRes, warnRes] = await Promise.all([
        appointmentAPI.getAvailableSlots(doctorId, date, departmentId),
        patient?.id
          ? appointmentAPI.checkPatientSameDay({ patient_id: patient.id, date })
          : Promise.resolve({ data: { has_appointment: false } }),
      ])

      setAllSlots(slotsRes.data?.all_slots || [])
      setAvailableSlots(slotsRes.data?.available_slots || [])
      setBookedSlots(slotsRes.data?.booked_slots || [])

      if (warnRes.data?.has_appointment) {
        setSameDayWarning('Patient already has an appointment on this day')
      }
    } catch (e) {
      console.error('Failed to load slots:', e)
      setError(e.response?.data?.message || 'Failed to load available slots')
      setAvailableSlots([])
      setAllSlots([])
      setBookedSlots([])
    }
  }

  const selectedDepartment = useMemo(
    () => departments.find((d) => String(d.id) === String(departmentId)),
    [departments, departmentId]
  )
  const selectedDoctor = useMemo(
    () => doctors.find((d) => String(d.id) === String(doctorId)),
    [doctors, doctorId]
  )
  const selectedType = useMemo(
    () => appointmentTypes.find((t) => String(t.id) === String(appointmentTypeId)),
    [appointmentTypes, appointmentTypeId]
  )

  const monthKey = formatMonthKey(calendarMonth.year, calendarMonth.monthIndex)
  const calendarDates = useMemo(() => {
    const first = new Date(calendarMonth.year, calendarMonth.monthIndex, 1)
    const startDay = first.getDay()
    const daysInMonth = new Date(calendarMonth.year, calendarMonth.monthIndex + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(calendarMonth.year, calendarMonth.monthIndex, d)
      cells.push(toISODate(dt))
    }
    return cells
  }, [calendarMonth.year, calendarMonth.monthIndex])

  const isDateDisabled = (isoDate) => {
    if (!isoDate) return true
    if (isPastDate(isoDate)) return true
    if (unavailableDates.includes(isoDate)) return true
    if (fullyBookedDates.includes(isoDate)) return true
    return false
  }

  const pickDate = (isoDate) => {
    if (isDateDisabled(isoDate)) return
    setSelectedDate(isoDate)
    loadSlotsForDate(isoDate)
  }

  const save = async () => {
    if (!patient) {
      setError('Please select a patient')
      return
    }
    if (!appointmentTypeId) {
      setError('Please select an appointment type')
      return
    }
    if (!departmentId) {
      setError('Please select a department')
      return
    }
    if (!doctorId) {
      setError('Please select a doctor')
      return
    }
    if (!selectedDate) {
      setError('Please select a date')
      return
    }
    if (!selectedTime) {
      setError('Please select a time slot')
      return
    }
    if (!notes.trim()) {
      setError('Notes (reason for visit) is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setWarnings([])

      const res = await appointmentAPI.bookByStaff({
        patient_id: patient.id,
        doctor_id: Number(doctorId),
        department_id: Number(departmentId),
        appointment_type_id: Number(appointmentTypeId),
        appointment_date: selectedDate,
        scheduled_time: selectedTime,
        reason: notes,
      })

      setConfirmation(res.data?.appointment)
      setWarnings(res.data?.warnings || [])
    } catch (e) {
      console.error('Failed to book appointment:', e)
      setError(e.response?.data?.message || 'Failed to book appointment')
    } finally {
      setSaving(false)
    }
  }

  const printSlip = () => {
    window.print()
  }

  const sendSms = async () => {
    if (!confirmation?.id) return
    try {
      setSendingSms(true)
      setError(null)
      const res = await appointmentAPI.sendSmsConfirmation(confirmation.id)
      setSmsMessage(res.data?.message || 'SMS confirmation sent')
    } catch (e) {
      console.error('Failed to send SMS:', e)
      setError(e.response?.data?.message || 'Failed to send SMS')
    } finally {
      setSendingSms(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-600 mt-2">Receptionist booking for call-in or walk-in scheduling</p>
        </div>

        {error && (
          <div className="mb-6 bg-white border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {confirmation ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Appointment Confirmed</h2>
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  Appointment ID: <span className="font-semibold">{confirmation.id}</span>
                </p>
                <div className="text-sm text-gray-700 mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4 text-gray-400" />
                    <span>{confirmation.patient?.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-gray-400" />
                    <span>{confirmation.doctor?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      {confirmation.appointment_date?.slice?.(0, 10)} {confirmation.scheduled_time?.slice?.(11, 16) || confirmation.scheduled_time}
                    </span>
                  </div>
                </div>

                {warnings.length > 0 && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-4 w-4" />
                      Warning
                    </div>
                    <div className="mt-1">{warnings[0]}</div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={printSlip}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Slip
                </button>
                <button
                  type="button"
                  onClick={sendSms}
                  disabled={sendingSms}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sendingSms ? 'Sending...' : 'Send SMS'}
                </button>

                {smsMessage && (
                  <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
                    {smsMessage}
                  </div>
                )}
              </div>
            </div>

            <style>{`
              .print-slip { display: none; }
              @media print {
                body * { visibility: hidden; }
                .print-slip, .print-slip * { visibility: visible; }
                .print-slip { position: absolute; left: 0; top: 0; width: 100%; display: block; }
              }
            `}</style>

            <div className="print-slip">
              <div className="p-6">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>OMSDH</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>Appointment Slip</div>
                  <div style={{ fontSize: 14, marginTop: 8 }}>Appointment ID: {confirmation.id}</div>
                </div>

                <div style={{ marginTop: 16, fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Patient</span>
                    <span style={{ fontWeight: 700 }}>{confirmation.patient?.user?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span>Department</span>
                    <span style={{ fontWeight: 700 }}>{confirmation.department?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span>Doctor</span>
                    <span style={{ fontWeight: 700 }}>{confirmation.doctor?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span>Type</span>
                    <span style={{ fontWeight: 700 }}>{confirmation.appointment_type?.name || selectedType?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span>Date</span>
                    <span style={{ fontWeight: 700 }}>{confirmation.appointment_date?.slice?.(0, 10)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span>Time</span>
                    <span style={{ fontWeight: 700 }}>{confirmation.scheduled_time?.slice?.(11, 16) || confirmation.scheduled_time}</span>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 700 }}>Reason</div>
                    <div style={{ marginTop: 4 }}>{confirmation.reason}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">1) Patient Search</h2>
                <PatientSearch onPatientSelect={(p) => setPatient(p)} />
                {patient && (
                  <div className="mt-4 border border-gray-200 rounded-xl p-4">
                    <div className="text-sm font-semibold text-gray-900">Selected Patient</div>
                    <div className="text-sm text-gray-700 mt-1">{patient.user?.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{patient.user?.email}</div>
                    <button
                      type="button"
                      onClick={() => {
                        setPatient(null)
                        setSameDayWarning(null)
                      }}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-500"
                    >
                      Change patient
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">2–4) Type, Department, Doctor</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
                  <select
                    value={appointmentTypeId}
                    onChange={(e) => setAppointmentTypeId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {appointmentTypes.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.code === 'OPD' ? 'OPD' : t.code === 'FOLLOWUP' ? 'Follow-up' : t.code === 'REFERRAL' ? 'Referral' : t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={doctors.length === 0}
                  >
                    {doctors.length === 0 ? (
                      <option value="">No doctors available</option>
                    ) : (
                      doctors.map((d) => (
                        <option key={d.id} value={String(d.id)}>
                          {d.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {doctorSchedule.length > 0 && (
                  <div className="pt-2">
                    <div className="text-sm font-semibold text-gray-900">Doctor Schedule</div>
                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                      {doctorSchedule.map((s) => (
                        <div key={s.day_of_week} className="flex justify-between">
                          <span className="text-gray-500">{s.day_of_week}</span>
                          <span className="font-medium">
                            {String(s.start_time).slice(0, 5)}–{String(s.end_time).slice(0, 5)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">5) Date Picker</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = new Date(calendarMonth.year, calendarMonth.monthIndex - 1, 1)
                        setCalendarMonth({ year: prev.getFullYear(), monthIndex: prev.getMonth() })
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date(calendarMonth.year, calendarMonth.monthIndex + 1, 1)
                        setCalendarMonth({ year: next.getFullYear(), monthIndex: next.getMonth() })
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">{monthKey}</div>

                <div className="mt-4 grid grid-cols-7 gap-2">
                  {DAY_NAMES.map((d) => (
                    <div key={d} className="text-xs font-semibold text-gray-500 text-center">
                      {d}
                    </div>
                  ))}
                  {calendarDates.map((isoDate, idx) => {
                    if (!isoDate) {
                      return <div key={`empty-${idx}`} className="h-10" />
                    }

                    const disabled = isDateDisabled(isoDate) || !doctorId
                    const selected = selectedDate === isoDate
                    const fullyBooked = fullyBookedDates.includes(isoDate)

                    return (
                      <button
                        key={isoDate}
                        type="button"
                        onClick={() => pickDate(isoDate)}
                        disabled={disabled}
                        className={
                          `h-10 rounded-lg text-sm border ` +
                          (selected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : disabled
                              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                              : fullyBooked
                                ? 'bg-gray-100 text-gray-500 border-gray-200'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50')
                        }
                        title={fullyBooked ? 'Fully booked' : undefined}
                      >
                        {Number(isoDate.slice(8, 10))}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900">6) Time Slot Selection</h2>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedDate ? `Selected date: ${selectedDate}` : 'Select a date to load available slots'}
                </div>

                {sameDayWarning && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-4 w-4" />
                      Warning
                    </div>
                    <div className="mt-1">{sameDayWarning}</div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {allSlots.length === 0 && (
                    <div className="text-sm text-gray-500">No slots loaded.</div>
                  )}

                  {allSlots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot)
                    const selected = selectedTime === slot

                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        disabled={isBooked}
                        className={
                          `px-3 py-2 rounded-lg border text-sm flex items-center justify-center gap-2 ` +
                          (selected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : isBooked
                              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
                        }
                      >
                        <Clock className="h-4 w-4" />
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">7–8) Notes and Confirm</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Reason for visit)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reason for visit..."
                  />
                </div>

                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Confirm and Save'}
                </button>

                <div className="text-xs text-gray-500">
                  Selected: {selectedDepartment?.name || '-'} / {selectedDoctor?.name || '-'} / {selectedDate || '-'} {selectedTime || ''}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReceptionistAppointmentBooking
