<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') - OMSDH Hospital Management</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .sidebar {
            min-height: 100vh;
            background: #2c3e50;
            color: white;
        }
        .sidebar .nav-link {
            color: #ecf0f1;
            padding: 12px 20px;
            margin: 5px 0;
        }
        .sidebar .nav-link:hover {
            background: #34495e;
            color: #3498db;
        }
        .sidebar .nav-link.active {
            background: #3498db;
            color: white;
        }
        .navbar-brand {
            font-weight: bold;
            color: #2c3e50;
        }
        .stat-card {
            border-radius: 10px;
            transition: transform 0.3s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .dashboard-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 0;
            margin-bottom: 2rem;
        }
        .appointment-card {
            border-left: 4px solid #3498db;
            margin-bottom: 1rem;
        }
        .status-scheduled { border-left-color: #f39c12; }
        .status-confirmed { border-left-color: #3498db; }
        .status-in_progress { border-left-color: #9b59b6; }
        .status-completed { border-left-color: #27ae60; }
        .status-cancelled { border-left-color: #e74c3c; }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <nav class="col-md-3 col-lg-2 d-md-block sidebar collapse">
                <div class="position-sticky pt-3">
                    <div class="text-center mb-4">
                        <h4><i class="fas fa-hospital me-2"></i>OMSDH</h4>
                        <small>Hospital Management System</small>
                    </div>
                    
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link {{ Request::is('dashboard') ? 'active' : '' }}" href="/dashboard">
                                <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                            </a>
                        </li>
                        
                        @auth
                            @if(auth()->user()->role === 'patient')
                                <li class="nav-item">
                                    <a class="nav-link {{ Request::is('appointments*') ? 'active' : '' }}" href="/appointments">
                                        <i class="fas fa-calendar-check me-2"></i>My Appointments
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link {{ Request::is('medical-records*') ? 'active' : '' }}" href="/medical-records">
                                        <i class="fas fa-file-medical me-2"></i>Medical Records
                                    </a>
                                </li>
                            @endif

                            @if(in_array(auth()->user()->role, ['doctor', 'admin']))
                                <li class="nav-item">
                                    <a class="nav-link {{ Request::is('appointments*') ? 'active' : '' }}" href="/appointments">
                                        <i class="fas fa-calendar-alt me-2"></i>Appointments
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link {{ Request::is('patients*') ? 'active' : '' }}" href="/patients">
                                        <i class="fas fa-users me-2"></i>Patients
                                    </a>
                                </li>
                            @endif

                            @if(auth()->user()->role === 'doctor')
                                <li class="nav-item">
                                    <a class="nav-link {{ Request::is('today-appointments*') ? 'active' : '' }}" href="/today-appointments">
                                        <i class="fas fa-list me-2"></i>Today's Queue
                                    </a>
                                </li>
                            @endif

                            @if(auth()->user()->role === 'admin')
                                <li class="nav-item">
                                    <a class="nav-link {{ Request::is('users*') ? 'active' : '' }}" href="/users">
                                        <i class="fas fa-user-cog me-2"></i>User Management
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link {{ Request::is('reports*') ? 'active' : '' }}" href="/reports">
                                        <i class="fas fa-chart-bar me-2"></i>Reports
                                    </a>
                                </li>
                            @endif

                            <li class="nav-item">
                                <a class="nav-link {{ Request::is('profile*') ? 'active' : '' }}" href="/profile">
                                    <i class="fas fa-user me-2"></i>Profile
                                </a>
                            </li>
                        @endauth
                    </ul>
                </div>
            </nav>

            <!-- Main content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <!-- Top navbar -->
                <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom">
                    <div class="container-fluid">
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="navbarNav">
                            <ul class="navbar-nav ms-auto">
                                @auth
                                    <li class="nav-item dropdown">
                                        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                                            <i class="fas fa-user-circle me-1"></i> 
                                            {{ auth()->user()->name }}
                                            <small class="badge bg-primary ms-1">{{ ucfirst(auth()->user()->role) }}</small>
                                        </a>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="/profile"><i class="fas fa-user me-2"></i>Profile</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li>
                                                <form action="/logout" method="POST">
                                                    @csrf
                                                    <button type="submit" class="dropdown-item">
                                                        <i class="fas fa-sign-out-alt me-2"></i>Logout
                                                    </button>
                                                </form>
                                            </li>
                                        </ul>
                                    </li>
                                @else
                                    <li class="nav-item">
                                        <a class="nav-link" href="/login">Login</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="/register">Register</a>
                                    </li>
                                @endauth
                            </ul>
                        </div>
                    </div>
                </nav>

                <!-- Page content -->
                <div class="container-fluid py-4">
                    @yield('content')
                </div>
            </main>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    @yield('scripts')
</body>
</html>