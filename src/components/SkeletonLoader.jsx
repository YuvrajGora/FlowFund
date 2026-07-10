import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'dashboard' }) => {
    if (type === 'dashboard') {
        return (
            <div className="skeleton-container dashboard-skeleton">
                <div className="skeleton-header">
                    <div className="skeleton-bar title"></div>
                    <div className="skeleton-bar subtitle"></div>
                </div>
                <div className="skeleton-grid">
                    <div className="skeleton-card"></div>
                    <div className="skeleton-card"></div>
                    <div className="skeleton-card"></div>
                </div>
                <div className="skeleton-summary-card"></div>
                <div className="skeleton-list">
                    <div className="skeleton-item">
                        <div className="skeleton-circle"></div>
                        <div className="skeleton-item-details">
                            <div className="skeleton-bar title-sm"></div>
                            <div className="skeleton-bar subtitle-sm"></div>
                        </div>
                        <div className="skeleton-bar amount-sm"></div>
                    </div>
                    <div className="skeleton-item">
                        <div className="skeleton-circle"></div>
                        <div className="skeleton-item-details">
                            <div className="skeleton-bar title-sm"></div>
                            <div className="skeleton-bar subtitle-sm"></div>
                        </div>
                        <div className="skeleton-bar amount-sm"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="skeleton-container generic-skeleton">
            <div className="skeleton-bar title"></div>
            <div className="skeleton-card large"></div>
            <div className="skeleton-card large"></div>
        </div>
    );
};

export default SkeletonLoader;
