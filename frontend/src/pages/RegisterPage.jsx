import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

/**
 * Registration page – collects username, email, display name, and password.
 */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate      = useNavigate();

  const [form, setForm]     = useState({ username: '', email: '', displayName: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.username.trim() || form.username.length < 3) errs.username = 'Minimum 3 characters';
    if (!form.email.includes('@'))                          errs.email = 'Enter a valid email';
    if (form.password.length < 8)                           errs.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword)             errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        username:    form.username,
        email:       form.email,
        displayName: form.displayName,
        password:    form.password,
      });
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">&#x1F511;</div>
          <h1 className="text-3xl font-extrabold text-gray-900">Get Started</h1>
          <p className="text-gray-500 mt-2">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="username"
                label="Username *"
                placeholder="jsmith"
                value={form.username}
                onChange={set('username')}
                error={errors.username}
              />
              <Input
                id="displayName"
                label="Display Name"
                placeholder="John Smith"
                value={form.displayName}
                onChange={set('displayName')}
              />
            </div>

            <Input
              id="email"
              label="Email *"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
            />

            <Input
              id="password"
              label="Password *"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />

            <Input
              id="confirmPassword"
              label="Confirm Password *"
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              error={errors.confirmPassword}
            />

            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
