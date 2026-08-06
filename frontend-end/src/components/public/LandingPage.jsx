import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Login from '../auth/Login'
import Register from '../auth/Register'
import { 
  Calendar, 
  Stethoscope, 
  Users, 
  Shield, 
  Clock, 
  FileText, 
  Phone, 
  MapPin,
  ArrowRight,
  CheckCircle,
  Star,
  Heart,
  Activity,
  Pill,
  Baby,
  TestTube,
  Quote
} from 'lucide-react'

const LandingPage = () => {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  const openLogin = () => {
    setShowRegisterModal(false)
    setShowLoginModal(true)
  }

  const openRegister = () => {
    setShowLoginModal(false)
    setShowRegisterModal(true)
  }

  const closeModals = () => {
    setShowLoginModal(false)
    setShowRegisterModal(false)
  }

  const features = [
    {
      icon: Calendar,
      title: 'Easy Appointments',
      description: 'Book appointments online with our simple scheduling system. Choose your preferred doctor and time slot.'
    },
    {
      icon: Users,
      title: 'Patient Portal',
      description: 'Access your medical records, view test results, and manage your health information anytime, anywhere.'
    },
    {
      icon: Stethoscope,
      title: 'Doctor Dashboard',
      description: 'Streamlined interface for medical practitioners to manage appointments and patient care efficiently.'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'HIPAA compliant data protection and security to ensure your medical information stays private.'
    },
    {
      icon: FileText,
      title: 'Digital Records',
      description: 'Paperless medical records system that makes information accessible to authorized healthcare providers.'
    },
    {
      icon: Clock,
      title: '24/7 Access',
      description: 'Access your healthcare information and book appointments anytime through our secure online portal.'
    }
  ]

  const stats = [
    { number: '10,000+', label: 'Patients Served' },
    { number: '50+', label: 'Medical Professionals' },
    { number: '99.9%', label: 'Uptime Reliability' },
    { number: '24/7', label: 'Support Available' }
  ]

  const hospitalServices = [
    {
      icon: Stethoscope,
      title: 'Outpatient Consultations',
      description: 'Comprehensive general check-ups, specialist consultations, and continuous care for non-emergency conditions.'
    },
    {
      icon: Activity,
      title: '24/7 Emergency Care',
      description: 'Immediate, round-the-clock medical response for critical illnesses, trauma, and urgent health situations.'
    },
    {
      icon: TestTube,
      title: 'Laboratory & Diagnostics',
      description: 'Accurate and fast medical testing, including blood work, X-rays, and comprehensive diagnostic imaging.'
    },
    {
      icon: Pill,
      title: 'Pharmacy Services',
      description: 'On-site medication dispensing with professional counseling to ensure safe and effective treatments.'
    },
    {
      icon: Heart,
      title: 'Maternity & Obstetrics',
      description: 'Dedicated care for expectant mothers, ensuring safe deliveries and comprehensive post-natal support.'
    },
    {
      icon: Baby,
      title: 'Pediatric Care',
      description: 'Specialized medical attention tailored for the unique healthcare needs of infants, children, and adolescents.'
    }
  ]

  const testimonials = [
    {
      name: 'Maria Santos',
      role: 'Mother of Two',
      content: 'The Pediatric Care at OMSDH is exceptional. Booking appointments online saved us so much time, and the staff were incredibly attentive to my children.',
      rating: 5,
      initials: 'MS'
    },
    {
      name: 'Juan Dela Cruz',
      role: 'Local Resident',
      content: 'I had to visit the Emergency Room late at night. The response was fast, professional, and the new digital records system made my follow-up checkups seamless.',
      rating: 5,
      initials: 'JD'
    },
    {
      name: 'Elena Reyes',
      role: 'Senior Citizen',
      content: 'Getting my lab results used to take all day. With the OMSDH patient portal, I can view my results from home. Truly a modern and caring hospital.',
      rating: 5,
      initials: 'ER'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 flex items-center justify-center">
                  <img src="/Picture1.png" alt="OMSDH Logo" className="h-full w-full object-contain drop-shadow-md" />
                </div>
                <span className="text-xl font-bold text-gray-900">OMSDH</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">
                Features
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">
                Testimonials
              </a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">
                Contact
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={openLogin}
                className="text-gray-700 hover:text-blue-600 transition-all duration-300 hidden sm:block font-medium hover:scale-105"
              >
                Login
              </button>
              <button
                onClick={openRegister}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 font-medium hover:-translate-y-0.5"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          {/* Background Decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute top-40 left-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Comprehensive
              <span className="text-blue-600 block">OMSDH Management System</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Streamline your medical practice with our integrated solution for patient care, 
              appointments, and medical records management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={openRegister}
                className="group bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center w-full sm:w-auto hover:-translate-y-1"
              >
                Book Your Appointment
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-sm md:text-base text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Our Medical Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Oriental Mindoro Southern District Hospital provides a wide range of essential healthcare services to our community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hospitalServices.map((service, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-slate-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full mix-blend-multiply filter blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <service.icon className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Why Choose Our Digital System?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive healthcare management platform is designed to make hospital visits faster, safer, and more convenient.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-slate-100"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to better healthcare management for everyone involved.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Register & Book',
                description: 'Patients can easily register and book appointments with their preferred healthcare providers.',
                icon: Users
              },
              {
                step: '02',
                title: 'Manage & Coordinate',
                description: 'Doctors and staff manage appointments, access patient records, and coordinate care seamlessly.',
                icon: Stethoscope
              },
              {
                step: '03',
                title: 'Track & Improve',
                description: 'Administrators track performance, manage inventory, and optimize healthcare delivery.',
                icon: Shield
              }
            ].map((item, index) => (
              <div key={index} className="text-center group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 group-hover:bg-indigo-600 group-hover:shadow-lg group-hover:shadow-indigo-500/30 group-hover:rotate-3 transition-all duration-300">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Patient Experiences
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear what our community has to say about the care and convenience provided by OMSDH.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-2xl p-8 relative hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-slate-100"
              >
                <Quote className="absolute top-6 right-8 h-12 w-12 text-blue-100 rotate-180" />
                <div className="flex items-center mb-6 relative z-10">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {testimonial.initials}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-bold text-gray-900 leading-tight">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic relative z-10 leading-relaxed">
                  "{testimonial.content}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 bg-white/10 rounded-xl p-1 flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <img src="/Picture1.png" alt="OMSDH Logo" className="h-full w-full object-contain" />
                </div>
                <span className="text-2xl font-bold tracking-tight">OMSDH</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Comprehensive healthcare management system designed to streamline medical practice, 
                patient care, and administrative tasks for healthcare providers.
              </p>
              <div className="flex items-center space-x-4 text-gray-400">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>(555) 123-HELP</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Odiong, Roxas, Oriental Mindoro</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><button onClick={openLogin} className="text-gray-400 hover:text-white transition-colors">Login</button></li>
                <li><button onClick={openRegister} className="text-gray-400 hover:text-white transition-colors">Register</button></li>
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Testimonials</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 OMSDH Healthcare Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <button
          onClick={openRegister}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
        >
          <Heart className="h-6 w-6" />
        </button>
      </div>

      {showLoginModal && (
        <Login 
          isModal={true} 
          onClose={closeModals} 
          onSwitchToRegister={openRegister} 
        />
      )}

      {showRegisterModal && (
        <Register 
          isModal={true} 
          onClose={closeModals} 
          onSwitchToLogin={openLogin} 
        />
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default LandingPage