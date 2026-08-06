import React, { useEffect, useMemo, useState } from 'react'
import { Building2, Printer, RefreshCw } from 'lucide-react'
import { departmentAPI, queueAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'

const PATIENT_TYPES = [
  'Regular',
  'Senior Citizen',
  'PWD',
  'Pregnant',
]

const WalkInQueueGenerator = () => {
  const [departments, setDepartments] = useState([])
  const [departmentId, setDepartmentId] = useState('')
  const [patientType, setPatientType] = useState('Regular')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [slip, setSlip] = useState(null)

  const selectedDepartment = useMemo(() => {
    return departments.find((d) => String(d.id) === String(departmentId))
  }, [departments, departmentId])

  const loadDepartments = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await departmentAPI.getAll()
      const list = Array.isArray(res.data) ? res.data : []
      setDepartments(list)
      if (!departmentId && list.length > 0) {
        setDepartmentId(String(list[0].id))
      }
    } catch (e) {
      console.error('Failed to load departments:', e)
      setError('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDepartments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generate = async () => {
    if (!departmentId) {
      setError('Please select a department')
      return
    }

    try {
      setGenerating(true)
      setError(null)
      const res = await queueAPI.generate({
        department_id: Number(departmentId),
        patient_type: patientType,
      })
      setSlip(res.data)
    } catch (e) {
      console.error('Failed to generate queue number:', e)
      setError(e.response?.data?.message || 'Failed to generate queue number')
    } finally {
      setGenerating(false)
    }
  }

  const printSlip = () => {
    window.print()
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Walk-in Queue Generator</h1>
            <p className="text-gray-600 mt-2">Generate a queue number and print the slip</p>
          </div>
          <button
            type="button"
            onClick={loadDepartments}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-white border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Queue Number</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <div className="relative">
                    <Building2 className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={String(d.id)}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Type</label>
                  <select
                    value={patientType}
                    onChange={(e) => setPatientType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PATIENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={generate}
                  disabled={generating}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating...' : 'Generate Queue Number'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Queue Slip</h2>
                <button
                  type="button"
                  onClick={printSlip}
                  disabled={!slip}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
              </div>

              {!slip ? (
                <p className="text-sm text-gray-600 mt-4">Generate a queue number to see the slip.</p>
              ) : (
                <div className="mt-4 border border-gray-200 rounded-xl p-5">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-600">OMSDH</div>
                    <div className="text-4xl font-extrabold text-gray-900 mt-2">{slip.queue_number}</div>
                    <div className="text-sm font-semibold text-gray-800 mt-2">
                      {slip.department?.name} ({slip.department?.code})
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium">{slip.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time</span>
                      <span className="font-medium">{slip.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estimated wait</span>
                      <span className="font-medium">{slip.estimated_wait_minutes} mins</span>
                    </div>
                  </div>

                  <div className="mt-4 text-center text-xs text-gray-600">
                    Please wait for your number to be called
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print-only slip */}
        <style>{`
          .print-slip { display: none; }
          @media print {
            body * { visibility: hidden; }
            .print-slip, .print-slip * { visibility: visible; }
            .print-slip { position: absolute; left: 0; top: 0; width: 100%; }
            .print-slip { display: block; }
          }
        `}</style>
        {slip && (
          <div className="print-slip">
            <div className="p-6">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>OMSDH</div>
                <div style={{ fontSize: 56, fontWeight: 800, marginTop: 8 }}>{slip.queue_number}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>
                  {slip.department?.name} ({slip.department?.code})
                </div>
              </div>
              <div style={{ marginTop: 18, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Date</span>
                  <span style={{ fontWeight: 700 }}>{slip.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span>Time</span>
                  <span style={{ fontWeight: 700 }}>{slip.time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span>Estimated wait</span>
                  <span style={{ fontWeight: 700 }}>{slip.estimated_wait_minutes} mins</span>
                </div>
              </div>
              <div style={{ marginTop: 18, textAlign: 'center', fontSize: 12 }}>
                Please wait for your number to be called
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalkInQueueGenerator
