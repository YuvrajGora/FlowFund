import React from 'react';
import { ShoppingBag, Coffee, Home, ArrowUpRight, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import './TransactionList.css';

const TransactionList = ({ transactions }) => {
    const getIcon = (category) => {
        switch (category.toLowerCase()) {
            case 'shopping': return ShoppingBag;
            case 'food': return Coffee;
            case 'housing': return Home;
            case 'freelance': return ArrowUpRight;
            default: return DollarSign;
        }
    };

    const formatTxAmount = (amount, type) => {
        const formatted = formatCurrency(amount);
        return type === 'income' ? `+${formatted}` : `-${formatted}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        // Check if it's already formatted (mock data legacy)
        if (dateString.includes(',')) return dateString;

        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="transaction-list card">
            {transactions.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No transactions yet.
                </div>
            ) : (
                transactions.map((tx) => {
                    const Icon = getIcon(tx.category);
                    return (
                        <div key={tx.id} className="transaction-item">
                            <div className="tx-left">
                                <div className={`tx-icon-wrapper ${tx.type}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="tx-info">
                                    <h4 className="tx-title">{tx.title}</h4>
                                    <span className="tx-date">{formatDate(tx.date)}</span>
                                </div>
                            </div>
                            <div className="tx-right">
                                <span className={`tx-amount ${tx.type}`}>
                                    {formatTxAmount(tx.amount, tx.type)}
                                </span>
                                <span className="tx-category">{tx.category}</span>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default TransactionList;
