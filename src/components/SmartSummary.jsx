import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import './SmartSummary.css';

const SmartSummary = ({ transactions, budgets }) => {
    const summary = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const savings = income - expense;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;

        // Top Expense Category
        const expensesByCategory = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });
        const sortedCategories = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);
        const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;

        // Budget Adherence
        let budgetAdherence = { within: 0, exceeded: 0, total: 0 };
        if (budgets && Object.keys(budgets).length > 0) {
            Object.entries(budgets).forEach(([cat, limit]) => {
                const spent = expensesByCategory[cat] || 0;
                if (limit > 0) {
                    budgetAdherence.total++;
                    if (spent > limit) budgetAdherence.exceeded++;
                    else budgetAdherence.within++;
                }
            });
        }

        return {
            income,
            expense,
            savings,
            savingsRate,
            topCategory,
            budgetAdherence
        };
    }, [transactions, budgets]);

    if (!transactions.length) return null;

    return (
        <div className="smart-summary-container">
            <h3 className="section-title">Monthly Smart Insights</h3>

            <div className="summary-grid">
                {/* Savings Logic */}
                <div className={`summary-card ${summary.savings >= 0 ? 'positive' : 'negative'}`}>
                    <div className="icon-wrapper">
                        {summary.savings >= 0 ? <PiggyBank size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div className="summary-info">
                        <span className="label">Net Savings</span>
                        <div className="value-group">
                            <span className="value">₹{Math.abs(summary.savings).toLocaleString('en-IN')}</span>
                            <span className="percentage">
                                ({summary.savingsRate.toFixed(1)}%)
                            </span>
                        </div>
                        <p className="subtext">
                            {summary.savings >= 0 ? "You're saving well!" : "Expenses exceeded income."}
                        </p>
                    </div>
                </div>

                {/* Top Expense */}
                <div className="summary-card neutral">
                    <div className="icon-wrapper">
                        <TrendingDown size={24} />
                    </div>
                    <div className="summary-info">
                        <span className="label">Top Expense</span>
                        {summary.topCategory ? (
                            <>
                                <span className="value">{summary.topCategory[0]}</span>
                                <span className="subtext">
                                    ₹{summary.topCategory[1].toLocaleString('en-IN')} spent
                                </span>
                            </>
                        ) : (
                            <span className="value">No expenses</span>
                        )}
                    </div>
                </div>

                {/* Budget Adherence */}
                <div className="summary-card info">
                    <div className="icon-wrapper">
                        <Activity size={24} />
                    </div>
                    <div className="summary-info">
                        <span className="label">Budget Health</span>
                        {summary.budgetAdherence.total > 0 ? (
                            <>
                                <span className="value">
                                    {summary.budgetAdherence.within} / {summary.budgetAdherence.total}
                                </span>
                                <span className="subtext">Categories within budget</span>
                            </>
                        ) : (
                            <span className="subtext">No budgets set</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartSummary;
