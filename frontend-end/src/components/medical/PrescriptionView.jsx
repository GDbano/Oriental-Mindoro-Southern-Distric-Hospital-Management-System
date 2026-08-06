import React from 'react'
import { Printer, Download, Calendar, User, Pill, Clock, Calendar as CalendarIcon } from 'lucide-react'
import { formatDateTime } from '../../utils/helpers'

const PrescriptionView = ({ prescription, appointment, medicalRecord, onPrint, onDownload }) => {
  if (!prescription) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescription</h3>
        <p className="text-gray-600">No prescription has been provided for this appointment.</p>
      </div>
    )
  }

  const parsePrescriptionLines = (prescriptionText) => {
    return prescriptionText.split('\n').filter(line => line.trim())
  }

  const prescriptionLines = parsePrescriptionLines(prescription)

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    } else {
      // Default download behavior
      const element = document.createElement('a')
      const file = new Blob([prescription], { type: 'text/plain' })
      element.href = URL.createObjectURL(file)
      element.download = `prescription-${appointment.id}.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow print:shadow-none">
      {/* Header - Hidden when printing */}
      <div className="px-6 py-4 border-b border-gray-200 print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Prescription</h2>
            <p className="text-sm text-gray-600">
              Issued on {formatDateTime(medicalRecord?.created_at)}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Prescription Content */}
      <div className="p-6 print:p-0">
        {/* Printable Header */}
        <div className="hidden print:block mb-6">
          <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">MEDICAL PRESCRIPTION</h1>
            <p className="text-gray-600">Official Healthcare Document</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Clinic Information */}
          <div className="text-center mb-8 print:mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">OMSDH Healthcare</h2>
            <p className="text-gray-600">123 Medical Center Drive, Healthcare City</p>
            <p className="text-gray-600">Phone: (555) 123-4567 | License: MH-123456</p>
          </div>

          {/* Patient and Doctor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:mb-6">
            <div className="bg-gray-50 p-4 rounded-lg print:bg-transparent print:border print:border-gray-300">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Patient Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <p className="text-gray-900">{appointment.patient?.user?.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Date of Birth:</span>
                  <p className="text-gray-900">January 15, 1985</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Patient ID:</span>
                  <p className="text-gray-900">PID-{appointment.patient_id}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg print:bg-transparent print:border print:border-gray-300">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Prescribing Physician
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <p className="text-gray-900">Dr. {appointment.doctor?.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">License:</span>
                  <p className="text-gray-900">{appointment.doctor?.license_number}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Specialization:</span>
                  <p className="text-gray-900">{appointment.doctor?.specialization}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Date Issued:</span>
                  <p className="text-gray-900">{formatDateTime(medicalRecord?.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prescription Content */}
          <div className="border-2 border-gray-300 rounded-lg p-6 mb-6 print:mb-4">
            <div className="text-center mb-6">
              <Pill className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-gray-900">PRESCRIPTION</h3>
              <div className="w-20 h-1 bg-blue-600 mx-auto mt-2"></div>
            </div>

            <div className="space-y-4">
              {prescriptionLines.map((line, index) => {
                // Simple parsing for common prescription formats
                if (line.trim().startsWith('-')) {
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <p className="text-gray-900 flex-1">{line.replace(/^-/, '').trim()}</p>
                    </div>
                  )
                }
                return (
                  <p key={index} className="text-gray-900">
                    {line}
                  </p>
                )
              })}
            </div>

            {/* Doctor Signature Area */}
            <div className="mt-8 pt-6 border-t border-gray-300">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Electronic Signature</p>
                  <div className="h-0.5 bg-gray-400 w-48 mb-1"></div>
                  <p className="text-sm font-medium text-gray-900">Dr. {appointment.doctor?.name}</p>
                  <p className="text-xs text-gray-600">{appointment.doctor?.specialization}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">License Number</p>
                  <p className="text-sm font-medium text-gray-900">{appointment.doctor?.license_number}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 print:bg-transparent print:border print:border-yellow-300">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Important Instructions
            </h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Take medications exactly as prescribed</li>
              <li>• Do not stop taking medication without consulting your doctor</li>
              <li>• Report any side effects immediately</li>
              <li>• Keep all medications out of reach of children</li>
              <li>• Store medications as directed on the label</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 print:mt-6">
            <p>This is an official medical document. Unauthorized reproduction is prohibited.</p>
            <p>For questions or concerns, contact OMSDH Healthcare at (555) 123-4567</p>
            <p className="mt-2">Document ID: RX-{medicalRecord?.id}-{appointment.id}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            font-size: 12pt;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          .print\\:bg-transparent {
            background: transparent !important;
          }
          .print\\:border {
            border: 1px solid #d1d5db !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          .print\\:border-yellow-300 {
            border-color: #fcd34d !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default PrescriptionView