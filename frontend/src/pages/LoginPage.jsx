import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const canSignUp = () =>
  document.cookie.split(';').some((c) => c.trim() === 'wp_signup_enabled=true');

/**
 * Login page – accepts username/email + password, authenticates via the API.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]     = useState({ usernameOrEmail: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.usernameOrEmail.trim()) errs.usernameOrEmail = 'Required';
    if (!form.password)               errs.password = 'Required';
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📚</div>
          <h1 className="text-3xl font-extrabold text-gray-900">Words &amp; Phrases</h1>
          <p className="text-gray-500 mt-2">Your personal language learning companion</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="usernameOrEmail"
              label="Username or Email"
              type="text"
              autoComplete="username"
              placeholder="you@example.com"
              value={form.usernameOrEmail}
              onChange={set('usernameOrEmail')}
              error={errors.usernameOrEmail}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />

            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>

          {canSignUp() && (
            <p className="mt-6 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                Create one
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
