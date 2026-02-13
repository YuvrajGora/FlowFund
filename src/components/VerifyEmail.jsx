import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import './Auth.css';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await fetch(`/api/auth/verify?token=${token}`);
                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage('Email verified successfully! You can now login.');
                    setTimeout(() => navigate('/login'), 3000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Something went wrong. Please try again.');
            }
        };

        verifyToken();
    }, [token, navigate]);

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    {status === 'verifying' && <Loader className="spin" size={48} color="var(--primary)" />}
                    {status === 'success' && <CheckCircle size={48} color="#10B981" />}
                    {status === 'error' && <XCircle size={48} color="#EF4444" />}
                </div>

                <h1 className="auth-title">
                    {status === 'verifying' && 'Verifying...'}
                    {status === 'success' && 'Verified!'}
                    {status === 'error' && 'Verification Failed'}
                </h1>

                <p className="auth-subtitle">{message}</p>

                {status !== 'verifying' && (
                    <Link to="/login" className="auth-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
                        Go to Login
                    </Link>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
