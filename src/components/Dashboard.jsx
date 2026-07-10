import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import StatCard from './StatCard';
import TransactionList from './TransactionList';
import SmartSummary from './SmartSummary';
import { Wallet, TrendingUp, TrendingDown, Plus, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import './Dashboard.css';

const Dashboard = ({ totalBalance, totalIncome, totalExpenses, transactions, onAddClick }) => {
    const navigate = useNavigate();
    const { budgets } = useData();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getTodaySpending = () => {
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        return transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(todayStr))
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const triggerHaptic = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(12);
        }
    };

    return (
        <div className="dashboard">
            {/* Desktop View */}
            <div className="dashboard-desktop-view">
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
                        trend={totalBalance >= 0 ? "+ Active" : "- Low"}
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
                            <button className="btn-link text-sm" onClick={() => navigate('/transactions')}>View All</button>
                        </div>
                        <TransactionList transactions={transactions.slice(0, 5)} />
                    </div>

                    <div className="side-section card flex flex-col justify-center items-center text-center p-6">
                        <h3>Quick Actions</h3>
                        <div className="flex gap-4 mt-4">
                            <button className="btn-secondary text-sm" onClick={() => navigate('/budget')}>Check Budget</button>
                            <button className="btn-secondary text-sm" onClick={() => navigate('/goals')}>View Goals</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View */}
            <div className="dashboard-mobile-view">
                <div className="mobile-greeting-sec">
                    <span className="greeting-sub">Welcome back,</span>
                    <h1 className="greeting-title">{getGreeting()}</h1>
                </div>

                <div className="mobile-balance-card card">
                    <span className="balance-label">Available Balance</span>
                    <h2 className="balance-amount">{formatCurrency(totalBalance)}</h2>
                    <div className="balance-decor"></div>
                </div>

                <div className="mobile-quick-actions-bar">
                    <div className="mobile-spending-card card">
                        <span className="spending-label">Today's Spending</span>
                        <h3 className="spending-amount">{formatCurrency(getTodaySpending())}</h3>
                    </div>
                    
                    <button 
                        className="mobile-quick-add-btn" 
                        onClick={() => {
                            triggerHaptic();
                            onAddClick();
                        }}
                    >
                        <Plus size={20} />
                        <span>Add Transaction</span>
                    </button>
                </div>

                <div className="mobile-smart-summary">
                    <SmartSummary transactions={transactions} budgets={budgets} />
                </div>

                <div className="mobile-recent-tx card">
                    <div className="section-header flex justify-between items-center mb-3">
                        <h3>Recent Transactions</h3>
                        <button 
                            className="btn-link text-sm" 
                            onClick={() => {
                                triggerHaptic();
                                navigate('/transactions');
                            }}
                        >
                            View All
                        </button>
                    </div>
                    <TransactionList transactions={transactions.slice(0, 5)} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
