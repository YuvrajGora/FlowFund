import React, { createContext, useState, useContext, useCallback } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState(() => {
        return localStorage.getItem('token') || null;
    });
    const loading = false;

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
    }, []);

    const authenticatedFetch = useCallback(async (url, options = {}) => {
        const currentToken = token || localStorage.getItem('token');
        const headers = {
            ...(options.headers || {}),
            ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
        };
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            logout();
            toast.error('Session expired. Please sign in again.');
            throw new Error('Session expired');
        }
        return response;
    }, [token, logout]);

    const login = async (username, password) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.token);
        return data;
    };

    const register = async (username, email, password) => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        return data;
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading, authenticatedFetch }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
