import React from 'react';

export const AdminPageHeader: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="mb-8">
    <h1 className="text-2xl font-extrabold text-brandGreen uppercase tracking-tight">{title}</h1>
    {description && <p className="text-brandSlate text-sm font-medium mt-1">{description}</p>}
  </div>
);

export const AdminCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 md:p-8 ${className}`}>{children}</div>
);

export const AdminButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'ghost' }
> = ({ variant = 'primary', className = '', ...props }) => {
  const styles = {
    primary: 'bg-brandPink text-white hover:scale-[1.02] shadow-md shadow-brandPink/20',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ghost: 'bg-gray-50 text-brandSlate hover:bg-gray-100',
  };
  return (
    <button
      {...props}
      className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all disabled:opacity-50 disabled:hover:scale-100 ${styles[variant]} ${className}`}
    />
  );
};

export const AdminInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brandPink/40 ${className}`}
  />
);

export const AdminTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brandPink/40 resize-none ${className}`}
  />
);

export const AdminLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-xs font-extrabold text-brandSlate uppercase tracking-widest mb-2">{children}</label>
);

export const AdminBanner: React.FC<{ type: 'error' | 'success'; children: React.ReactNode }> = ({ type, children }) => (
  <div
    className={`p-4 rounded-2xl text-sm font-bold mb-6 ${
      type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-brandGreen border border-green-100'
    }`}
  >
    {children}
  </div>
);
