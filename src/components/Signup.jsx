import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            const res = await register(username, email, password);
            setMessage(res.message);
        } catch (err) {
            setError(err.message || 'Failed to create account');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Get started with FlowFund today</p>

                {error && <div className="auth-error">{error}</div>}
                {message && <div className="auth-error" style={{ backgroundColor: '#ECFDF5', color: '#047857' }}>{message}</div>}

                {!message && (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <input
                            type="text"
                            className="auth-input"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <button type="submit" className="auth-button">
                            Sign Up
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    Already have an account?
                    <Link to="/login" className="auth-link">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
