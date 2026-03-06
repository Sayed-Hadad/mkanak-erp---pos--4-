import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { MainLayout } from '../layouts/MainLayout';
import { Dashboard } from '../modules/dashboard/Dashboard';
import { Login } from '../modules/auth/Login';

import { POS } from '../modules/sales/POS';

import { Products } from '../modules/products/Products';
import { CRM } from '../modules/crm/CRM';
import { Inventory } from '../modules/inventory/Inventory';
import { Reports } from '../modules/reports/Reports';
import { Branches } from '../modules/branches/Branches';
import { Transfers } from '../modules/inventory/Transfers';
import { Returns } from '../modules/returns/Returns';
import { Messages } from '../modules/messages/Messages';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore(state => state.user);
  if (!user) return <Navigate to="/login" />;
  return <MainLayout>{children}</MainLayout>;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/transfers" element={<ProtectedRoute><Transfers /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
        <Route path="/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/branches" element={<ProtectedRoute><Branches /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};
