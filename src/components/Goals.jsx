import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, Plus, Trophy } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import './Goals.css';

const Goals = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // New Goal State
    const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', deadline: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [goalsRes, transactionsRes] = await Promise.all([
                fetch('/api/goals', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
                fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
            ]);

            const goalsData = await goalsRes.json();
            const txData = await transactionsRes.json();

            setGoals(goalsData);
            setTransactions(txData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: newGoal.name,
                    target_amount: parseFloat(newGoal.target_amount),
                    deadline: newGoal.deadline,
                    current_amount: 0
                })
            });



            if (res.ok) {
                const savedGoal = await res.json();
                setGoals([...goals, savedGoal]);
                setShowForm(false);
                setNewGoal({ name: '', target_amount: '', deadline: '' });
                toast.success('Goal created successfully!');
            }
        } catch (error) {
            console.error("Error adding goal:", error);
            toast.error('Failed to create goal');
        }
    };

    // Calculate Health Score
    const calculateHealthScore = () => {
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

        if (income === 0) return 0;

        const savingsRate = ((income - expense) / income) * 100;
        let score = 0;

        // Simple scoring logic based on savings rate
        if (savingsRate < 0) score = 20; // Needs Improvement
        else if (savingsRate < 10) score = 40; // Fair
        else if (savingsRate < 30) score = 60; // Good
        else if (savingsRate < 50) score = 80; // Very Good
        else score = 95; // Excellent

        // Cap at 100
        return Math.min(score, 100);
    };

    const healthScore = calculateHealthScore();
    const scoreData = [
        { name: 'Score', value: healthScore },
        { name: 'Remaining', value: 100 - healthScore }
    ];
    const SCORE_COLORS = ['#10B981', '#E5E7EB'];

    const getHealthLabel = (score) => {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Average";
        return "Needs Improvement";
    };

    if (loading) return <div className="p-4">Loading goals...</div>;

    return (
        <div className="goals-container">
            <h1 className="page-title">Financial Goals & Health</h1>

            <div className="goals-dashboard">
                {/* Health Score Card */}
                <div className="health-card">
                    <h3>Financial Health Score</h3>
                    <div className="score-chart-wrapper">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={scoreData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    startAngle={180}
                                    endAngle={0}
                                    dataKey="value"
                                >
                                    <Cell fill={SCORE_COLORS[0]} />
                                    <Cell fill={SCORE_COLORS[1]} />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="score-label">
                            <span className="score-number">{healthScore}</span>
                            <span className="score-text">{getHealthLabel(healthScore)}</span>
                        </div>
                    </div>
                </div>

                {/* Goals List */}
                <div className="goals-list-section">
                    <div className="section-header">
                        <h3>Your Goals</h3>
                        <button className="btn-primary-small" onClick={() => setShowForm(!showForm)}>
                            <Plus size={16} /> New Goal
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={handleAddGoal} className="add-goal-form">
                            <input
                                type="text"
                                placeholder="Goal Name"
                                value={newGoal.name}
                                onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Target Amount"
                                value={newGoal.target_amount}
                                onChange={e => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                                required
                            />
                            <input
                                type="date"
                                value={newGoal.deadline}
                                onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
                            />
                            <button type="submit" className="btn-primary">Save Goal</button>
                        </form>
                    )}

                    <div className="goals-grid">
                        {goals.length === 0 ? (
                            <div className="empty-state">No goals yet. Start saving today!</div>
                        ) : (
                            goals.map(goal => {
                                const progress = (goal.current_amount / goal.target_amount) * 100;
                                return (
                                    <div key={goal.id} className="goal-card">
                                        <div className="goal-icon">
                                            <Trophy size={24} color="#F59E0B" />
                                        </div>
                                        <div className="goal-details">
                                            <h4>{goal.name}</h4>
                                            <div className="goal-amounts">
                                                <span>₹{goal.current_amount.toLocaleString('en-IN')}</span>
                                                <span className="text-secondary"> / ₹{goal.target_amount.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="goal-progress-bar">
                                                <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                            </div>
                                            {goal.deadline && (
                                                <span className="goal-deadline">Target: {new Date(goal.deadline).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Goals;
