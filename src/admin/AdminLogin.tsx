import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAdminAuth } from './AdminAuthProvider';

const AdminLogin: React.FC = () => {
  const { session, isAdmin, loading } = useAdminAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!loading && session && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ type: 'error', text: error.message });
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({
          type: 'success',
          text: 'Account created. Check your email to confirm it, then let the site owner know your email so they can grant admin access.',
        });
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#486e7c]/5 px-6">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-gray-100 p-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-brandPink/10 rounded-2xl mb-4">
            <Lock color="#82246d" size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-brandGreen uppercase tracking-tight">Admin Panel</h1>
          <p className="text-brandSlate text-sm font-medium mt-1">STEM Girls Connect</p>
        </div>

        <div className="flex bg-gray-50 rounded-2xl p-1 mb-8">
          <button
            onClick={() => { setMode('signin'); setMessage(null); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold uppercase tracking-widest transition-all ${
              mode === 'signin' ? 'bg-white shadow-sm text-brandPink' : 'text-brandSlate'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setMessage(null); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold uppercase tracking-widest transition-all ${
              mode === 'signup' ? 'bg-white shadow-sm text-brandPink' : 'text-brandSlate'
            }`}
          >
            Sign Up
          </button>
        </div>

        {!loading && session && !isAdmin && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm font-medium">
            You're signed in as {session.user.email}, but this account doesn't have admin access yet.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brandPink/40"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brandPink/40"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brandPink text-white py-4 rounded-2xl font-extrabold uppercase tracking-widest text-sm shadow-lg shadow-brandPink/20 hover:scale-[1.01] transition-all disabled:opacity-60"
          >
            {submitting ? '...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          {message && (
            <p className={`text-sm font-bold text-center ${message.type === 'error' ? 'text-red-500' : 'text-brandGreen'}`}>
              {message.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
