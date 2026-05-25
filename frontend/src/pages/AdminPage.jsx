import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/AdminDashboard';

const AdminPage = () => {
  const { user } = useAuth();
  
  // Force re-render when user data changes by using user data as key
  const userKey = `${user?.firstName}-${user?.lastName}-${user?.email}-${user?.username}`;
  
  return <AdminDashboard key={userKey} />;
};

export default AdminPage;


