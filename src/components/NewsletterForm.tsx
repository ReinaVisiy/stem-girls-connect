import React, { useState } from 'react';
import { Mail } from 'lucide-react';

type Status = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error';

const NewsletterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('submitting');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();

      if (json.status === 'success') {
        setStatus('success');
        setEmail('');
      } else if (json.status === 'duplicate') {
        setStatus('duplicate');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-gray-100 dark:border-slate-700 shadow-xl p-10 md:p-12 max-w-2xl mx-auto text-center">
      <div className="inline-flex p-4 bg-brandPink/10 rounded-2xl mb-6">
        <Mail color="#82246d" size={28} />
      </div>
      <h3 className="text-2xl font-extrabold text-brandGreen mb-3 uppercase tracking-tight">Stay in the Loop</h3>
      <p className="text-brandSlate text-sm font-medium mb-8 max-w-md mx-auto">
        Get occasional updates on our programs, events, and impact. No spam, and you can unsubscribe anytime.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-grow px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-brandSlate focus:outline-none focus:ring-2 focus:ring-brandPink/40"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="bg-brandPink text-white px-8 py-4 rounded-2xl font-extrabold uppercase tracking-widest text-sm shadow-lg shadow-brandPink/20 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
        >
          {status === 'submitting' ? '...' : 'Subscribe'}
        </button>
      </form>

      {status === 'success' && (
        <p className="mt-4 text-sm font-bold text-brandGreen">You're subscribed: thank you!</p>
      )}
      {status === 'duplicate' && (
        <p className="mt-4 text-sm font-bold text-brandSlate">You're already on the list.</p>
      )}
      {status === 'error' && (
        <p className="mt-4 text-sm font-bold text-red-500">Something went wrong: please try again.</p>
      )}
    </div>
  );
};

export default NewsletterForm;
