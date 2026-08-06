import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ClipboardList, RefreshCw } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'
import { labRequestsAPI } from '../../services/api'

function formatRequestedAt(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function summarizeTests(tests, specimen) {
  if (!tests || typeof tests !== 'object') return []

  const lines = []
  for (const [category, items] of Object.entries(tests)) {
    const list = Array.isArray(items) ? items.filter(Boolean) : []
    if (list.length === 0) continue

    const extra = category === 'MICROBIOLOGY' && list.includes('Culture & Sensitivity') && specimen
      ? ` (Specimen: ${specimen})`
      : ''

    lines.push(`${category}: ${list.join(', ')}${extra}`)
  }
  return lines
}

function getUrgencyPillClasses(urgency) {
  if (urgency === 'stat') return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
}

export default function MedTechLabQueuePage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      setError('')
      const res = await labRequestsAPI.getPendingQueue(100)
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error('Load pending lab requests failed:', e)
      setError(e.response?.data?.message || 'Failed to load pending lab requests')
      setItems([])
    } finally {
      if (isRefresh) setRefreshing(false)
      else setLoading(false)
    }
  }

  useEffect(() => {
    load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const stat = items.filter((x) => x?.urgency === 'stat').length
    const routine = items.filter((x) => x?.urgency !== 'stat').length
    return { total: items.length, stat, routine }
  }, [items])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            Pending Lab Requests
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Total: <span className="font-semibold">{counts.total}</span> • STAT:{' '}
            <span className="font-semibold text-red-700">{counts.stat}</span> • Routine:{' '}
            <span className="font-semibold">{counts.routine}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-600">
          No pending lab requests.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((req) => {
            const patientName = req?.appointment?.patient?.user?.name || '—'
            const doctorName = req?.appointment?.doctor?.name || '—'
            const requestedAt = formatRequestedAt(req?.requested_at)
            const testsLines = summarizeTests(req?.tests, req?.specimen)

            return (
              <div key={req?.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{patientName}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getUrgencyPillClasses(req?.urgency)}`}>
                        {(req?.urgency || 'routine').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">Requested: {requestedAt}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Doctor: <span className="font-medium">{doctorName}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">#{req?.id || '—'}</div>
                </div>

                {testsLines.length > 0 && (
                  <div className="mt-3 text-sm text-gray-800 space-y-1">
                    {testsLines.map((line, idx) => (
                      <div key={idx} className="text-sm">{line}</div>
                    ))}
                  </div>
                )}

                {(req?.others || req?.clinical_notes) && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-500">Others</div>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">{req?.others || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500">Clinical Notes</div>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">{req?.clinical_notes || '—'}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
