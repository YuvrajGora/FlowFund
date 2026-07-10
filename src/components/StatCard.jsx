import React from 'react';
import './StatCard.css';

const StatCard = ({ title, amount, trend, icon: Icon, type }) => {
    const isPositive = trend.startsWith('+');

    return (
        <div className="stat-card card">
            <div className="stat-header">
                <div className={`icon-wrapper ${type}`}>
                    <Icon size={24} />
                </div>
                <div className={`trend-badge ${isPositive ? 'positive' : 'negative'}`}>
                    {trend}
                </div>
            </div>
            <div className="stat-content">
                <span className="stat-title">{title}</span>
                <h2 className="stat-amount">{amount}</h2>
            </div>
        </div>
    );
};

export default StatCard;
