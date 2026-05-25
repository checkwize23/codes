import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase.js';
import toast from 'react-hot-toast';

const AuthContext = createContext();

function useAuth () {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export {useAuth};

function AuthProvider  ({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Dynamic API URL for mobile compatibility
  const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3000/api' 
      : 'https://hire-shield-backend.onrender.com/api');

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // Enhanced error logging for mobile debugging
          if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.error('Network error - check if backend is running and accessible');
            console.error('Current API URL:', API_BASE_URL);
            console.error('Current hostname:', window.location.hostname);
          }
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);




  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // removed this.If 2FA is required, do NOT set token yet
        
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        toast.success('Login successful');
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        // Don't automatically log in the user after registration
        // Just return success without setting user state or token
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  const hydrateFromToken = async (incomingToken) => {
    try {
      localStorage.setItem('token', incomingToken);
      setToken(incomingToken);
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${incomingToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false };
      }
    } catch {
      return { success: false };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('updateProfile error:', error);
      return { success: false, error: 'Profile update failed. Please try again.' };
    }
  };

  const updateSuperAdminProfile = async (profileData) => {
    try {
      
      const response = await fetch(`${API_BASE_URL}/auth/super-admin/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('updateSuperAdminProfile error:', error);
      return { success: false, error: 'Profile update failed. Please try again.' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch {
      return { success: false, error: 'Password change failed. Please try again.' };
    }
  };

  const getAllUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, users: data.users };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch users.' };
    }
  };

  const createAdmin = async (adminData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/create-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminData)
      });

      const data = await response.json();

      if (response.ok) {
        // removed this Automatically set up 2FA for the new admin
        

        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Failed to create admin user.' };
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Failed to update user role.' };
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Failed to update user status.' };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Failed to delete user.' };
    }
  };

  const googleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      const profile = result.user;
      // Ask backend to upsert user and issue JWT
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          googleId: profile.uid,
          firstName: profile.displayName?.split(' ')?.[0] || 'First',
          lastName: profile.displayName?.split(' ')?.slice(1).join(' ') || 'Last',
          // Username fallback: before @, plus random suffix
          username: (profile.email?.split('@')[0] || 'user') + Math.floor(Math.random()*1000)
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) return { success: false, error: data.message };

      // removed this If 2FA is required, do NOT set token yet
      
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      return { success: true, data };
    } catch (error) {
      console.error('Google sign-in error details:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in was cancelled' };
      } else if (error.code === 'auth/popup-blocked') {
        return { success: false, error: 'Pop-up was blocked. Please allow pop-ups and try again.' };
      } else if (error.code === 'auth/unauthorized-domain') {
        return { success: false, error: 'This domain is not authorized for Google sign-in' };
      } else if (error.code === 'auth/invalid-credential') {
        return { success: false, error: 'Invalid credentials. Please try again.' };
      } else {
        return { success: false, error: `Google sign-in failed: ${error.message}` };
      }
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    hydrateFromToken,
    updateProfile,
    updateSuperAdminProfile,
    changePassword,
    getAllUsers,
    createAdmin,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    googleSignIn,
    isAuthenticated: !!token,
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export {AuthProvider};
