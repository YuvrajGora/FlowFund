import React, { useState, useRef } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useData } from '../context/DataContext';
import './Layout.css';
import { Loader2 } from 'lucide-react';

const Layout = ({ children, onAddClick }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { fetchData } = useData();

    // Pull to Refresh state
    const [pullOffset, setPullOffset] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startY = useRef(0);
    const isPulling = useRef(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            startY.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    };

    const handleTouchMove = (e) => {
        if (!isPulling.current) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0) {
            // Apply rubber-banding effect
            setPullOffset(Math.min(diff * 0.4, 80));
        }
    };

    const handleTouchEnd = async () => {
        if (!isPulling.current) return;
        isPulling.current = false;

        if (pullOffset >= 50) {
            setIsRefreshing(true);
            setPullOffset(50); // Keep at loading position
            if ('vibrate' in navigator) {
                navigator.vibrate(15);
            }
            try {
                await fetchData();
            } catch (err) {
                console.error("Failed to refresh data:", err);
            } finally {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullOffset(0);
                }, 500);
            }
        } else {
            setPullOffset(0);
        }
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

                {/* Pull to Refresh Indicator */}
                <div 
                    className="pull-to-refresh-indicator"
                    style={{
                        height: `${pullOffset}px`,
                        opacity: pullOffset / 50,
                        transition: isPulling.current ? 'none' : 'height 0.3s ease, opacity 0.3s ease'
                    }}
                >
                    <Loader2 className={`refresh-spinner ${isRefreshing ? 'spinning' : ''}`} size={20} />
                    <span>{isRefreshing ? 'Refreshing...' : 'Pull to refresh'}</span>
                </div>

                <main 
                    className="content-wrapper"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        transform: `translateY(${pullOffset}px)`,
                        transition: isPulling.current ? 'none' : 'transform 0.3s ease'
                    }}
                >
                    {children}
                </main>
                <BottomNav onAddClick={onAddClick} />
            </div>
        </div>
    );
};

export default Layout;
