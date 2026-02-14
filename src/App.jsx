import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Signup from './components/Signup';

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AddTransactionModal from './components/AddTransactionModal';
import TransactionList from './components/TransactionList';
import Budget from './components/Budget';
import Analytics from './components/Analytics';
import Goals from './components/Goals';

// Main Application Component (Authenticated)
const MainApp = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const location = useLocation(); // To trigger re-renders if needed or track path

  useEffect(() => {
    fetchTransactions();
  }, [user]); // Fetch when user changes (log in)

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }

      // Check for recurring transactions
      await checkRecurring(token);

    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  const checkRecurring = async (token) => {
    try {
      const res = await fetch('/api/recurring/process', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message.includes('Processed')) {
          // If new transactions were created, re-fetch
          const txRes = await fetch('/api/transactions', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (txRes.ok) {
            const txData = await txRes.json();
            setTransactions(txData);
          }
        }
      }
    } catch (err) {
      console.error("Error processing recurring:", err);
    }
  };

  const handleAddTransaction = async (newTx) => {
    try {
      const token = localStorage.getItem('token');

      // 1. Always create the immediate transaction
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTx)
      });

      if (res.ok) {
        const savedTx = await res.json();
        setTransactions([savedTx, ...transactions]);

        // 2. If recurring, create the rule for future
        if (newTx.isRecurring) {
          await fetch('/api/recurring', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newTx)
          });
        }
      }
    } catch (err) {
      console.error("Failed to add transaction", err);
    }
  };

  // Derived State
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalBalance = totalIncome - totalExpenses;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={
          <Dashboard
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            transactions={transactions}
            onAddClick={() => setIsModalOpen(true)}
          />
        } />
        <Route path="/transactions" element={
          <div className="transactions-page">
            <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: '700' }}>All Transactions</h2>
            <TransactionList transactions={transactions} />
          </div>
        } />
        <Route path="/budget" element={<Budget />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/goals" element={<Goals />} />
      </Routes>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddTransaction}
      />
    </Layout>
  );
};

import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/*" element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
