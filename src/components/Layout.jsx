import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './Layout.css';

import MobileNav from './MobileNav';

const Layout = ({ children }) => {
    // Sidebar state is redundant for mobile now as we use MobileNav
    // But keeping it for desktop toggle if needed
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="app-container">
            {/* Sidebar for Desktop */}
            <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
                <Sidebar />
            </div>

            <div className="main-content">
                {/* Navbar handles user profile & theme toggle */}
                <Navbar toggleSidebar={toggleSidebar} />

                <main className="content-wrapper">
                    {children}
                </main>

                {/* Mobile Bottom Navigation */}
                <MobileNav />
            </div>
        </div>
    );
};

export default Layout;
