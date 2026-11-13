'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth.service';

export function useAuth() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authService.login({ email, password });
    if (result.ok) {
      router.push('/');
    } else {
      setError(result.error.message || 'An error occurred during login.');
    }
    setLoading(false);
  }, [email, password, router]);

  const handleLogout = useCallback(() => {
    authService.logout();
    router.push('/login');
  }, [router]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    setError,
    loading,
    showPassword,
    setShowPassword,
    handleLogin,
    handleLogout,
    isAuthenticated: authService.isAuthenticated(),
  };
}
