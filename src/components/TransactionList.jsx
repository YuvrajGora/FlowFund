import React from 'react';
import { 
    Briefcase, ArrowUpRight, Coffee, Home, Receipt, 
    Car, ShoppingBag, Film, BookOpen, Heart, 
    CreditCard, Calendar, TrendingUp, Gift, DollarSign 
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import './TransactionList.css';

const TransactionList = ({ transactions }) => {
    const getIcon = (category) => {
        if (!category) return DollarSign;
        switch (category.toLowerCase()) {
            case 'salary': return Briefcase;
            case 'freelancing':
            case 'freelance': 
                return ArrowUpRight;
            case 'business': return Briefcase;
            case 'investment': return TrendingUp;
            case 'gift': return Gift;
            case 'food': return Coffee;
            case 'rent':
            case 'housing': 
                return Home;
            case 'bills': return Receipt;
            case 'travel': return Car;
            case 'shopping': return ShoppingBag;
            case 'entertainment': return Film;
            case 'education': return BookOpen;
            case 'health': return Heart;
            case 'subscriptions': return CreditCard;
            case 'emi': return Calendar;
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
        } catch {
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
