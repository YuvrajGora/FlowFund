import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const getTitle = (pathname) => {
        switch (pathname) {
            case '/':
                return 'Dashboard';
            case '/transactions':
                return 'Transactions';
            case '/budget':
                return 'Budget';
            case '/analytics':
                return 'Analytics';
            case '/goals':
                return 'Goals';
            case '/profile':
                return 'Profile';
            default:
                return 'FlowFund';
        }
    };

    const triggerHaptic = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    return (
        <header className="navbar">
            {/* Desktop-only navbar */}
            <div className="navbar-desktop-only">
                <div className="navbar-left">
                    <button className="menu-btn" onClick={toggleSidebar}>
                        <Menu size={24} />
                    </button>
                    <h2 className="page-title">{getTitle(location.pathname)}</h2>
                </div>

                <div className="navbar-right">
                    <div className="user-profile">
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=4F46E5&color=fff`}
                            alt="User"
                            className="avatar"
                        />
                        <div className="user-info">
                            <span className="user-name">{user?.username || 'Guest'}</span>
                            <span className="user-role">Member</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile-only navbar */}
            <div className="navbar-mobile-only">
                <div className="navbar-mobile-left">
                    <div className="logo-icon-small">
                        <div className="logo-sq-small"></div>
                    </div>
                    <span className="mobile-logo-text">FlowFund</span>
                </div>
                
                <h2 className="mobile-page-title">{getTitle(location.pathname)}</h2>

                <div className="navbar-mobile-right">
                    <button 
                        className="mobile-avatar-btn" 
                        onClick={() => {
                            triggerHaptic();
                            navigate('/profile');
                        }}
                        aria-label="Profile"
                    >
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=4F46E5&color=fff`}
                            alt="User Avatar"
                            className="avatar"
                        />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
