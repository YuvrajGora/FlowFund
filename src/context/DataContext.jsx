import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const DataContext = createContext(null);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    return context;
};

export const DataProvider = ({ children }) => {
    const { token } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isProcessingRecurring, setIsProcessingRecurring] = useState(false);

    const clearData = useCallback(() => {
        setTransactions([]);
        setBudgets({});
        setGoals([]);
        setLoading(false);
    }, []);

    const fetchData = useCallback(async () => {
        if (!token) {
            clearData();
            return;
        }

        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const [txRes, budgetRes, goalRes] = await Promise.all([
                fetch('/api/transactions', { headers }),
                fetch('/api/budgets', { headers }),
                fetch('/api/goals', { headers })
            ]);

            if (!txRes.ok || !budgetRes.ok || !goalRes.ok) {
                throw new Error('Failed to fetch financial data from server');
            }

            const [txData, budgetData, goalData] = await Promise.all([
                txRes.json(),
                budgetRes.json(),
                goalRes.json()
            ]);

            setTransactions(txData);
            
            // Normalize budgets array to object map: category -> limit_amount
            const budgetMap = {};
            if (Array.isArray(budgetData)) {
                budgetData.forEach(b => {
                    budgetMap[b.category] = b.limit_amount;
                });
            }
            setBudgets(budgetMap);

            setGoals(goalData);
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Error fetching data:', err);
            }
            toast.error(err.message || 'Failed to load your financial data');
        } finally {
            setLoading(false);
        }
    }, [token, clearData]);

    // Initial load
    useEffect(() => {
        if (token) {
            fetchData();
        } else {
            clearData();
        }
    }, [token, fetchData, clearData]);

    const checkRecurring = useCallback(async () => {
        if (!token) return;
        setIsProcessingRecurring(true);
        try {
            const res = await fetch('/api/recurring/process', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to process recurring transactions');
            const data = await res.json();
            if (data.processedCount > 0) {
                const txRes = await fetch('/api/transactions', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (txRes.ok) {
                    const txData = await txRes.json();
                    setTransactions(txData);
                }
            }
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Recurring process error:', err);
            }
            toast.error('Could not check recurring transactions');
        } finally {
            setIsProcessingRecurring(false);
        }
    }, [token]);

    const addTransaction = useCallback(async (txData) => {
        if (!token) return null;
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(txData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add transaction');
            setTransactions(prev => [data, ...prev]);

            if (txData.isRecurring) {
                const recRes = await fetch('/api/recurring', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        type: txData.type,
                        title: txData.title,
                        amount: txData.amount,
                        category: txData.category,
                        frequency: txData.frequency || 'monthly'
                    })
                });
                const recData = await recRes.json();
                if (!recRes.ok) throw new Error(recData.error || 'Failed to register recurring schedule');
            }

            toast.success('Transaction added successfully');
            return data;
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Add transaction error:', err);
            }
            toast.error(err.message || 'Failed to add transaction');
            throw err;
        }
    }, [token]);

    const updateBudget = useCallback(async (category, limitAmount) => {
        if (!token) return null;
        try {
            const res = await fetch('/api/budgets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ category, limit_amount: limitAmount })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save budget');

            setBudgets(prev => ({
                ...prev,
                [category]: limitAmount
            }));

            toast.success('Budget saved successfully');
            return data;
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Update budget error:', err);
            }
            toast.error(err.message || 'Failed to save budget');
            throw err;
        }
    }, [token]);

    const addGoal = useCallback(async (goalData) => {
        if (!token) return null;
        try {
            const res = await fetch('/api/goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(goalData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create goal');

            setGoals(prev => [...prev, data]);
            toast.success('Goal created successfully');
            return data;
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Add goal error:', err);
            }
            toast.error(err.message || 'Failed to create goal');
            throw err;
        }
    }, [token]);

    const updateGoalProgress = useCallback(async (goalId, currentAmount) => {
        if (!token) return null;
        try {
            const res = await fetch(`/api/goals/${goalId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ current_amount: currentAmount })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update goal progress');

            setGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: currentAmount } : g));
            toast.success('Goal progress updated');
            return data;
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Update goal error:', err);
            }
            toast.error(err.message || 'Failed to update goal progress');
            throw err;
        }
    }, [token]);

    const value = {
        transactions,
        budgets,
        goals,
        loading,
        isProcessingRecurring,
        fetchData,
        checkRecurring,
        addTransaction,
        updateBudget,
        addGoal,
        updateGoalProgress
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
