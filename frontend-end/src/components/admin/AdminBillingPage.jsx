import React, { useState, useEffect } from 'react'
import { Receipt, CheckCircle, Search, DollarSign, Loader2, AlertCircle } from 'lucide-react'
import { billingAPI } from '../../services/api'
import Modal from '../common/Modal'

const AdminBillingPage = () => {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, pending, paid
  const [search, setSearch] = useState('')

  // Payment Modal
  const [selectedBill, setSelectedBill] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadBills()
  }, [filter])

  const loadBills = async () => {
    try {
      setLoading(true)
      const res = await billingAPI.getAll({ status: filter })
      setBills(res.data || [])
    } catch (err) {
      console.error('Error fetching bills:', err)
      setError('Failed to load billing records.')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayment = async () => {
    if (!selectedBill) return

    try {
      setProcessing(true)
      await billingAPI.markAsPaid(selectedBill.id, paymentMethod)
      setSelectedBill(null)
      loadBills() // refresh list
    } catch (err) {
      console.error('Error processing payment:', err)
      alert(err.response?.data?.message || 'Failed to process payment.')
    } finally {
      setProcessing(false)
    }
  }

  const filteredBills = bills.filter(bill => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      bill.patient?.user?.name?.toLowerCase().includes(searchLower) ||
      bill.id.toString().includes(searchLower)
    )
  })

  const totalPending = bills.filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + parseFloat(b.net_amount), 0)

  const totalCollected = bills.filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + parseFloat(b.net_amount), 0)

  if (loading && bills.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Receipt className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Invoices</p>
            <h3 className="text-2xl font-bold text-gray-900">{bills.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Unpaid Balance</p>
            <h3 className="text-2xl font-bold text-amber-600">₱{totalPending.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Collected Revenue</p>
            <h3 className="text-2xl font-bold text-green-600">₱{totalCollected.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'paid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Paid
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.length > 0 ? (
                filteredBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      INV-{bill.id.toString().padStart(5, '0')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{bill.patient?.user?.name}</div>
                      <div className="text-xs text-gray-500">Date: {new Date(bill.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">₱{parseFloat(bill.net_amount).toFixed(2)}</div>
                      {parseFloat(bill.philhealth_discount) > 0 && (
                        <div className="text-xs text-green-600 font-medium">PHIC Applied</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {bill.status === 'paid' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                        {bill.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {bill.status === 'pending' ? (
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
                        >
                          Receive Payment
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Paid on {new Date(bill.paid_at).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <Receipt className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-900">No billing records found</p>
                    <p className="text-sm text-gray-500">Adjust your filters or search term.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedBill && (
        <Modal
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
          title="Process Payment"
          size="md"
        >
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm text-gray-500">Patient</p>
                  <p className="font-semibold text-gray-900">{selectedBill.patient?.user?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Invoice</p>
                  <p className="font-mono font-medium text-gray-900">INV-{selectedBill.id.toString().padStart(5, '0')}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total Amount Due</span>
                  <span className="text-2xl font-bold text-gray-900">₱{parseFloat(selectedBill.net_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {['cash', 'card', 'gcash'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3 border rounded-xl flex items-center justify-center font-medium capitalize transition-colors ${
                      paymentMethod === method
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={processing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirm Payment
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminBillingPage
