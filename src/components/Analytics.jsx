import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import './Analytics.css';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { getLocalYearMonth } from '../utils/format';
import SkeletonLoader from './SkeletonLoader';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics = () => {
    const { transactions, loading } = useData();
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [activeTab, setActiveTab] = useState('category'); // 'category' or 'trend' for mobile

    // Filter by selected month in local timezone
    const [selYear, selMonth] = selectedMonth.split('-').map(Number);
    const filteredTransactions = transactions.filter(t => {
        const { year, month } = getLocalYearMonth(t.date);
        return year === selYear && month === (selMonth - 1);
    });

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
            const yearVal = d.getFullYear();
            const monthVal = d.getMonth(); // 0-indexed

            const income = transactions
                .filter(t => {
                    const { year, month } = getLocalYearMonth(t.date);
                    return year === yearVal && month === monthVal && t.type === 'income';
                })
                .reduce((a, b) => a + b.amount, 0);

            const expense = transactions
                .filter(t => {
                    const { year, month } = getLocalYearMonth(t.date);
                    return year === yearVal && month === monthVal && t.type === 'expense';
                })
                .reduce((a, b) => a + b.amount, 0);

            data.push({ name: monthStr, Income: income, Expense: expense });
        }
        return data;
    };
    const barData = getLast6MonthsData();

    // 3. Insights
    const getInsights = () => {
        const [currYear, currMonth] = selectedMonth.split('-').map(Number);
        
        let prevYear = currYear;
        let prevMonth = currMonth - 1;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear = currYear - 1;
        }

        const currentExpense = transactions
            .filter(t => {
                const { year, month } = getLocalYearMonth(t.date);
                return year === currYear && month === (currMonth - 1) && t.type === 'expense';
            })
            .reduce((a, b) => a + b.amount, 0);

        const previousExpense = transactions
            .filter(t => {
                const { year, month } = getLocalYearMonth(t.date);
                return year === prevYear && month === (prevMonth - 1) && t.type === 'expense';
            })
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

    const triggerHaptic = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(8);
        }
    };

    if (loading) {
        return (
            <div className="analytics-container">
                <SkeletonLoader type="generic" />
            </div>
        );
    }

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
                <div className="insight-card card">
                    <div className="insight-icon"><DollarSign /></div>
                    <div>
                        <h3>Total Spent</h3>
                        <p className="insight-value">₹{insights.totalExpense.toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <div className="insight-card card">
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

            {/* Desktop View Chart Grid */}
            <div className="charts-grid-desktop">
                {/* Pie Chart */}
                <div className="chart-card card">
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
                <div className="chart-card card">
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

            {/* Mobile View Chart Tab Slider */}
            <div className="charts-grid-mobile">
                <div className="segmented-control">
                    <button 
                        className={`segment-btn ${activeTab === 'category' ? 'active' : ''}`}
                        onClick={() => {
                            triggerHaptic();
                            setActiveTab('category');
                        }}
                    >
                        Category Split
                    </button>
                    <button 
                        className={`segment-btn ${activeTab === 'trend' ? 'active' : ''}`}
                        onClick={() => {
                            triggerHaptic();
                            setActiveTab('trend');
                        }}
                    >
                        Monthly Trend
                    </button>
                </div>

                <div className="mobile-chart-card card">
                    {activeTab === 'category' ? (
                        <>
                            <h3>Expenses by Category ({selectedMonth})</h3>
                            <div className="chart-wrapper">
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
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
                        </>
                    ) : (
                        <>
                            <h3>Income vs Expense (6 Months)</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis width={30} />
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                                        <Legend />
                                        <Bar dataKey="Income" fill="#10B981" radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="Expense" fill="#EF4444" radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
