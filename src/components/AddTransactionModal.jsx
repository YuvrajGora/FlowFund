import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AddTransactionModal.css';

const AddTransactionModal = ({ isOpen, onClose, onAdd }) => {
    const incomeCategories = ['Salary', 'Freelancing', 'Business', 'Investment', 'Gift', 'Other'];
    const expenseCategories = ['Food', 'Rent', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Education', 'Health', 'Subscriptions', 'EMI', 'Other'];

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState(expenseCategories[0]);
    const [date, setDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD format
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState('monthly');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setType(newType);
        setCategory(newType === 'income' ? incomeCategories[0] : expenseCategories[0]);
    };

    const triggerHaptic = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !amount || !category || isSaving) return;

        setIsSaving(true);
        triggerHaptic();
        try {
            await onAdd({
                title,
                amount: parseFloat(amount),
                type,
                category,
                date: new Date(date).toISOString(),
                isRecurring,
                frequency
            });

            // Reset and close
            setTitle('');
            setAmount('');
            setType('expense');
            setCategory(expenseCategories[0]);
            setDate(new Date().toLocaleDateString('en-CA'));
            setIsRecurring(false);
            setFrequency('monthly');
            onClose();
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error("Failed to submit transaction:", error);
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
                {/* Visual grab handle for mobile bottom sheet */}
                <div className="sheet-handle"></div>

                <div className="modal-header">
                    <h3>Add Transaction</h3>
                    <button className="close-btn" onClick={onClose} disabled={isSaving}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="transaction-form">
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Grocery Shopping"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isSaving}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Amount</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={isSaving}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Type</label>
                            <select value={type} onChange={handleTypeChange} disabled={isSaving}>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={isSaving}>
                                {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            disabled={isSaving}
                            required
                            className="native-datepicker"
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                                disabled={isSaving}
                            />
                            Recurring Transaction?
                        </label>
                    </div>

                    {
                        isRecurring && (
                            <div className="form-group">
                                <label>Frequency</label>
                                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} disabled={isSaving}>
                                    <option value="monthly">Monthly</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                            </div>
                        )
                    }

                    <div className="sheet-sticky-footer">
                        <button type="submit" className="submit-btn" disabled={isSaving}>
                            {isSaving ? 'Adding...' : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTransactionModal;
