import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, PiggyBank, Target, BarChart2 } from 'lucide-react';
import './MobileNav.css';

const MobileNav = () => {
    return (
        <nav className="mobile-nav glass">
            <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={24} />
                <span className="mobile-nav-label">Home</span>
            </NavLink>
            <NavLink to="/transactions" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Receipt size={24} />
                <span className="mobile-nav-label">Txns</span>
            </NavLink>
            <NavLink to="/budget" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <PiggyBank size={24} />
                <span className="mobile-nav-label">Budget</span>
            </NavLink>
            <NavLink to="/goals" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Target size={24} />
                <span className="mobile-nav-label">Goals</span>
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <BarChart2 size={24} />
                <span className="mobile-nav-label">Stats</span>
            </NavLink>
        </nav>
    );
};

export default MobileNav;
