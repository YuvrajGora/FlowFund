import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './Layout.css';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="app-container">
            {/* Overlay for mobile when sidebar is open */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
                <Sidebar />
            </div>

            <div className="main-content">
                <Navbar toggleSidebar={toggleSidebar} />
                <main className="content-wrapper">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
