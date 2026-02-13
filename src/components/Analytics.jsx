import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line
} from 'recharts';
import './Analytics.css';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/transactions', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setTransactions(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    // Filter by selected month
    const filteredTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

    // 1. Expense by Category (Pie Chart)
    const expenseByCategory = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

    const pieData = Object.keys(expenseByCategory).map(key => ({
        name: key,
        value: expenseByCategory[key]
    }));

    // 2. Monthly Income vs Expense (Bar Chart - Last 6 Months)
    const getLast6MonthsData = () => {
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthStr = d.toLocaleString('default', { month: 'short' });
            const yearStr = d.getFullYear();
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

            const income = transactions
                .filter(t => t.date.startsWith(key) && t.type === 'income')
                .reduce((a, b) => a + b.amount, 0);

            const expense = transactions
                .filter(t => t.date.startsWith(key) && t.type === 'expense')
                .reduce((a, b) => a + b.amount, 0);

            data.push({ name: monthStr, Income: income, Expense: expense });
        }
        return data;
    };
    const barData = getLast6MonthsData();

    // 3. Insights
    const getInsights = () => {
        const currentMonthKey = selectedMonth;
        const previousMonthDate = new Date(selectedMonth + '-01');
        previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
        const previousMonthKey = previousMonthDate.toISOString().slice(0, 7);

        const currentExpense = transactions
            .filter(t => t.date.startsWith(currentMonthKey) && t.type === 'expense')
            .reduce((a, b) => a + b.amount, 0);

        const previousExpense = transactions
            .filter(t => t.date.startsWith(previousMonthKey) && t.type === 'expense')
            .reduce((a, b) => a + b.amount, 0);

        let expenseChange = 0;
        if (previousExpense > 0) {
            expenseChange = ((currentExpense - previousExpense) / previousExpense) * 100;
        }

        return {
            expenseChange: expenseChange.toFixed(1),
            totalExpense: currentExpense
        };
    };
    const insights = getInsights();

    if (loading) return <div className="p-4">Loading analytics...</div>;

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <div>
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">Visualize your financial health.</p>
                </div>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="month-picker"
                />
            </div>

            {/* Insights Cards */}
            <div className="insights-grid">
                <div className="insight-card">
                    <div className="insight-icon"><DollarSign /></div>
                    <div>
                        <h3>Total Spent</h3>
                        <p className="insight-value">₹{insights.totalExpense.toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <div className="insight-card">
                    <div className="insight-icon">
                        {insights.expenseChange > 0 ? <TrendingUp color="#EF4444" /> : <TrendingDown color="#10B981" />}
                    </div>
                    <div>
                        <h3>vs Last Month</h3>
                        <p className={`insight-value ${insights.expenseChange > 0 ? 'text-red' : 'text-green'}`}>
                            {insights.expenseChange > 0 ? '+' : ''}{insights.expenseChange}%
                        </p>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Pie Chart */}
                <div className="chart-card">
                    <h3>Expenses by Category ({selectedMonth})</h3>
                    <div className="chart-wrapper">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-data">No expenses for this month.</div>
                        )}
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="chart-card">
                    <h3>Income vs Expense (Last 6 Months)</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                                <Legend />
                                <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
