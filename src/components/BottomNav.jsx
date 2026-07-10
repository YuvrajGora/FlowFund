import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Receipt, BarChart3, Target, PieChart, Plus } from 'lucide-react';
import './BottomNav.css';

const BottomNav = ({ onAddClick }) => {
    const triggerHaptic = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(15);
        }
    };

    return (
        <div className="bottom-nav-container">
            {/* Circular FAB centered above bottom nav */}
            <button 
                className="fab-btn" 
                onClick={() => {
                    triggerHaptic();
                    onAddClick();
                }}
                aria-label="Add Transaction"
            >
                <Plus size={28} />
            </button>

            <nav className="bottom-nav">
                <NavLink 
                    to="/" 
                    className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                    onClick={triggerHaptic}
                    end
                >
                    <Home size={20} />
                    <span>Home</span>
                </NavLink>

                <NavLink 
                    to="/transactions" 
                    className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                    onClick={triggerHaptic}
                >
                    <Receipt size={20} />
                    <span>History</span>
                </NavLink>

                {/* Empty spacer for the FAB button visually */}
                <div className="bottom-nav-spacer"></div>

                <NavLink 
                    to="/analytics" 
                    className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                    onClick={triggerHaptic}
                >
                    <BarChart3 size={20} />
                    <span>Analytics</span>
                </NavLink>

                <NavLink 
                    to="/goals" 
                    className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                    onClick={triggerHaptic}
                >
                    <Target size={20} />
                    <span>Goals</span>
                </NavLink>

                <NavLink 
                    to="/budget" 
                    className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                    onClick={triggerHaptic}
                >
                    <PieChart size={20} />
                    <span>Budget</span>
                </NavLink>
            </nav>
        </div>
    );
};

export default BottomNav;
