import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
    const { user } = useAuth();

    return (
        <header className="navbar">
            <div className="navbar-left">
                <button className="menu-btn" onClick={toggleSidebar}>
                    <Menu size={24} />
                </button>
                <h2 className="page-title">Dashboard</h2>
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
        </header>
    );
};

export default Navbar;
