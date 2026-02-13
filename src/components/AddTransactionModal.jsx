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
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState('monthly');

    if (!isOpen) return null;

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setType(newType);
        setCategory(newType === 'income' ? incomeCategories[0] : expenseCategories[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !amount || !category) return;

        onAdd({
            title,
            amount: parseFloat(amount),
            type,
            category,
            date: new Date().toISOString(),
            isRecurring,
            frequency
        });

        // Reset and close
        setTitle('');
        setAmount('');
        setType('expense');
        setCategory(expenseCategories[0]);
        setIsRecurring(false);
        setFrequency('monthly');
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card">
                <div className="modal-header">
                    <h3>Add Transaction</h3>
                    <button className="close-btn" onClick={onClose}>
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
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Type</label>
                            <select value={type} onChange={handleTypeChange}>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>


                    </div>


                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                            />
                            Recurring Transaction?
                        </label>
                    </div>

                    {
                        isRecurring && (
                            <div className="form-group">
                                <label>Frequency</label>
                                <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                                    <option value="monthly">Monthly</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                            </div>
                        )
                    }

                    <button type="submit" className="submit-btn">
                        Add Transaction
                    </button>
                </form>
            </div >
        </div >
    );
};

export default AddTransactionModal;
