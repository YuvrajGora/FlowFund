import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Moon, Sun, ArrowLeft } from 'lucide-react';
import './Profile.css';

const Profile = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const triggerHaptic = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const handleLogout = () => {
        triggerHaptic();
        logout();
        navigate('/login');
    };

    return (
        <div className="profile-page-container">
            <div className="profile-header-back">
                <button 
                    className="back-btn" 
                    onClick={() => {
                        triggerHaptic();
                        navigate(-1);
                    }}
                    aria-label="Back"
                >
                    <ArrowLeft size={24} />
                </button>
                <h3>Account Settings</h3>
            </div>

            <div className="profile-card card">
                <img
                    src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=4F46E5&color=fff&size=128`}
                    alt="User Avatar"
                    className="profile-avatar-large"
                />
                <h2 className="profile-username">{user?.username || 'Guest'}</h2>
                <span className="profile-badge">Pro Member</span>
            </div>

            <div className="profile-options">
                <div className="option-group card">
                    <div className="option-item">
                        <div className="option-left">
                            <User size={20} />
                            <span>Username</span>
                        </div>
                        <span className="option-value">{user?.username || 'Guest'}</span>
                    </div>

                    <div className="option-item">
                        <div className="option-left">
                            <Mail size={20} />
                            <span>Email</span>
                        </div>
                        <span className="option-value">{user?.email || 'N/A'}</span>
                    </div>
                </div>

                <div className="option-group card">
                    <button 
                        className="option-item-btn" 
                        onClick={() => {
                            triggerHaptic();
                            toggleTheme();
                        }}
                    >
                        <div className="option-left">
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                            <span>App Theme</span>
                        </div>
                        <span className="option-value capitalize">{theme} Mode</span>
                    </button>
                </div>

                <button className="logout-btn-premium" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Log Out Account</span>
                </button>
            </div>
        </div>
    );
};

export default Profile;
