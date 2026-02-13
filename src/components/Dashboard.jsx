import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import TransactionList from './TransactionList';
import SmartSummary from './SmartSummary';
import { Wallet, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import './Dashboard.css';

const Dashboard = ({ totalBalance, totalIncome, totalExpenses, transactions, onAddClick }) => {
    const [budgets, setBudgets] = useState({});

    useEffect(() => {
        const fetchBudgets = async () => {
            try {
                const res = await fetch('/api/budgets', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const budgetsMap = {};
                    data.forEach(b => budgetsMap[b.category] = b.limit_amount);
                    setBudgets(budgetsMap);
                }
            } catch (error) {
                console.error("Failed to fetch budgets for summary", error);
            }
        };
        fetchBudgets();
    }, []);

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Welcome back! Here's your financial overview.</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={onAddClick}>
                    <Plus size={18} /> Add Transaction
                </button>
            </div>

            <div className="stats-grid">
                <StatCard
                    title="Total Balance"
                    amount={formatCurrency(totalBalance)}
                    trend={totalBalance >= 0 ? "+ Active" : "- Lo"}
                    icon={Wallet}
                    type="balance"
                />
                <StatCard
                    title="Total Income"
                    amount={formatCurrency(totalIncome)}
                    trend="Inflow"
                    icon={TrendingUp}
                    type="income"
                />
                <StatCard
                    title="Total Expenses"
                    amount={formatCurrency(totalExpenses)}
                    trend="Outflow"
                    icon={TrendingDown}
                    type="expense"
                />
            </div>

            <SmartSummary transactions={transactions} budgets={budgets} />

            <div className="dashboard-content-grid">
                <div className="main-section card">
                    <div className="section-header flex justify-between items-center mb-4">
                        <h3>Recent Transactions</h3>
                        <button className="btn-link text-sm" onClick={() => window.location.href = '/transactions'}>View All</button>
                    </div>
                    <TransactionList transactions={transactions.slice(0, 5)} />
                </div>

                {/* Right Column / Sidebar placeholder or specific widgets */}
                <div className="side-section card flex flex-col justify-center items-center text-center p-6">
                    <h3>Quick Actions</h3>
                    <div className="flex gap-4 mt-4">
                        <button className="btn-secondary text-sm" onClick={() => window.location.href = '/budget'}>Check Budget</button>
                        <button className="btn-secondary text-sm" onClick={() => window.location.href = '/goals'}>View Goals</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
