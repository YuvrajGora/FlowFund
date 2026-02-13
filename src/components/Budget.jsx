import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Budget.css';
import { Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Budget = () => {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState({});
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(null); // Category being edited
    const [newLimit, setNewLimit] = useState('');

    const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [budgetsRes, transactionsRes] = await Promise.all([
                fetch('/api/budgets', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
                fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
            ]);

            const budgetsData = await budgetsRes.json();
            const transactionsData = await transactionsRes.json();

            // Transform budgets to object for easier access
            const budgetsMap = {};
            budgetsData.forEach(b => budgetsMap[b.category] = b.limit_amount);
            setBudgets(budgetsMap);

            setTransactions(transactionsData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const handleUpdateBudget = async (category) => {
        try {
            const res = await fetch('/api/budgets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ category, limit_amount: parseFloat(newLimit) })
            });



            if (res.ok) {
                setBudgets(prev => ({ ...prev, [category]: parseFloat(newLimit) }));
                setEditMode(null);
                setNewLimit('');
                toast.success(`Budget for ${category} updated!`);
            }
        } catch (error) {
            console.error("Error updating budget:", error);
            toast.error("Failed to update budget");
        }
    };

    const calculateProgress = (category) => {
        const limit = budgets[category] || 0;
        if (limit === 0) return { spent: 0, progress: 0, color: 'var(--text-secondary)' };

        // Filter transactions for this category AND current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const spent = transactions
            .filter(t =>
                t.type === 'expense' &&
                t.category === category &&
                new Date(t.date).getMonth() === currentMonth &&
                new Date(t.date).getFullYear() === currentYear
            )
            .reduce((acc, t) => acc + t.amount, 0);

        const progress = (spent / limit) * 100;
        let color = '#10B981'; // Green
        if (progress >= 80) color = '#F59E0B'; // Yellow
        if (progress > 100) color = '#EF4444'; // Red

        return { spent, progress, color };
    };

    if (loading) return <div className="p-4">Loading budgets...</div>;

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
                                                autoFocus
                                            />
                                            <button onClick={() => handleUpdateBudget(category)} className="btn-icon">
                                                <Save size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setEditMode(category); setNewLimit(limit); }} className="btn-link">
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
        </div >
    );
};

export default Budget;
