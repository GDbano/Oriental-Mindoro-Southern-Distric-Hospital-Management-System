import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            // For demo purposes, you can add auto-login for demo accounts
            const demoAccounts = {
                'patient@demo.com': { role: 'patient', name: 'John Patient' },
                'doctor@demo.com': { role: 'doctor', name: 'Dr. Sarah Smith' },
                'staff@demo.com': { role: 'staff', name: 'Mike Staff' },
                'admin@demo.com': { role: 'admin', name: 'Admin User' }
            };

            const response = await authAPI.login(credentials);
            const { user, access_token } = response.data;
            
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            
            return { success: true };
        } catch (error) {
            // If API fails, you can use demo mode for presentation
            const demoAccounts = {
                'patient@demo.com': { 
                    id: 1, 
                    name: 'John Patient', 
                    email: 'patient@demo.com', 
                    role: 'patient',
                    patient: { id: 1 }
                },
                'doctor@demo.com': { 
                    id: 2, 
                    name: 'Dr. Sarah Smith', 
                    email: 'doctor@demo.com', 
                    role: 'doctor',
                    specialization: 'Cardiology'
                },
                'staff@demo.com': { 
                    id: 3, 
                    name: 'Mike Staff', 
                    email: 'staff@demo.com', 
                    role: 'staff' 
                },
                'admin@demo.com': { 
                    id: 4, 
                    name: 'Admin User', 
                    email: 'admin@demo.com', 
                    role: 'admin' 
                }
            };

            const demoUser = demoAccounts[credentials.email];
            if (demoUser && credentials.password === 'password123') {
                // Demo login success
                const token = 'demo-token-' + Date.now();
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(demoUser));
                setUser(demoUser);
                return { success: true };
            }
            
            return { 
                success: false, 
                message: error.response?.data?.message || 'Invalid login credentials' 
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            const { user, access_token } = response.data;
            
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Registration failed' 
            };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};