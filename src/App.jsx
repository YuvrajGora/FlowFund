import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
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
import Profile from './components/Profile';
import SkeletonLoader from './components/SkeletonLoader';

// Main Application Component (Authenticated)
const MainApp = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { transactions, loading, checkRecurring, addTransaction } = useData();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkRecurring();
    }
  }, [user, checkRecurring]);

  // Derived State
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalBalance = totalIncome - totalExpenses;

  if (loading) {
    return (
      <Layout onAddClick={() => setIsModalOpen(true)}>
        <SkeletonLoader type="dashboard" />
      </Layout>
    );
  }

  return (
    <Layout onAddClick={() => setIsModalOpen(true)}>
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
        <Route path="/profile" element={<Profile />} />
      </Routes>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addTransaction}
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
        <DataProvider>
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
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
