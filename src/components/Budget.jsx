import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import './Budget.css';
import { Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLocalYearMonth } from '../utils/format';

const Budget = () => {
    const { transactions, budgets, updateBudget, loading } = useData();
    const [editMode, setEditMode] = useState(null); // Category being edited
    const [newLimit, setNewLimit] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

    const handleUpdateBudget = async (category) => {
        const limitVal = parseFloat(newLimit);
        if (isNaN(limitVal) || limitVal <= 0) {
            toast.error("Please enter a valid positive number for the budget limit");
            return;
        }

        setIsSaving(true);
        try {
            await updateBudget(category, limitVal);
            setEditMode(null);
            setNewLimit('');
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error("Error updating budget:", error);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const calculateProgress = (category) => {
        const limit = budgets[category] || 0;
        if (limit === 0) return { spent: 0, progress: 0, color: 'var(--text-secondary)' };

        // Filter transactions for this category AND current month in local time
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const spent = transactions
            .filter(t => {
                if (t.type !== 'expense' || t.category !== category) return false;
                const { year, month } = getLocalYearMonth(t.date);
                return year === currentYear && month === currentMonth;
            })
            .reduce((acc, t) => acc + t.amount, 0);

        const progress = (spent / limit) * 100;
        let color = '#10B981'; // Green
        if (progress >= 80) color = '#F59E0B'; // Yellow
        if (progress > 100) color = '#EF4444'; // Red

        return { spent, progress, color };
    };

    if (loading) {
        return (
            <div className="budget-container flex flex-col items-center justify-center p-12">
                <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
                <p className="mt-4 text-muted">Loading budgets...</p>
            </div>
        );
    }

    return (
        <div className="budget-container">
            <h1 className="page-title">Monthly Budget</h1>
            <p className="page-subtitle">Set limits and track your spending per category.</p>

            <div className="budget-grid">
                {categories.map(category => {
                    const { spent, progress, color } = calculateProgress(category);
                    const limit = budgets[category] || 0;
                    const isExceeded = progress > 100;

                    return (
                        <div key={category} className="budget-card">
                            <div className="budget-header">
                                <span className="budget-category">{category}</span>
                                <div className="budget-actions">
                                    {editMode === category ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={newLimit}
                                                onChange={(e) => setNewLimit(e.target.value)}
                                                className="budget-input-small"
                                                placeholder="Limit"
                                                disabled={isSaving}
                                                autoFocus
                                            />
                                            <button 
                                                onClick={() => handleUpdateBudget(category)} 
                                                className="btn-icon"
                                                disabled={isSaving}
                                            >
                                                <Save size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => { setEditMode(category); setNewLimit(limit || ''); }} 
                                            className="btn-link"
                                        >
                                            {limit > 0 ? `Limit: ₹${limit.toLocaleString('en-IN')}` : 'Set Limit'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="budget-progress-container">
                                <div
                                    className="budget-progress-bar"
                                    style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
                                ></div>
                            </div>

                            <div className="budget-stats">
                                <span>Spent: <span style={{ fontWeight: '600' }}>₹{spent.toLocaleString('en-IN')}</span></span>
                                <span>
                                    {isExceeded ? (
                                        <span className="text-red flex items-center gap-1">
                                            <AlertTriangle size={12} /> Exceeded by ₹{(spent - limit).toLocaleString('en-IN')}
                                        </span>
                                    ) : (
                                        <span>Left: ₹{(limit - spent).toLocaleString('en-IN')}</span>
                                    )}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Budget;
