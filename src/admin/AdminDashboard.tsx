import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Image as ImageIcon, FileText, Newspaper, UsersRound, BarChart3, Mail } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';
import { AdminPageHeader, AdminCard } from './AdminUI';

const AdminDashboard: React.FC = () => {
  const { data: partners } = useApiData<unknown[]>('/api/partners');
  const { data: reports } = useApiData<unknown[]>('/api/reports');
  const { data: posts } = useApiData<unknown[]>('/api/posts');
  const { data: bureau } = useApiData<unknown[]>('/api/bureau');
  const { data: stats } = useApiData<unknown[]>('/api/stats');

  const cards = [
    { to: '/admin/partners', label: 'Partners', icon: Users, count: partners?.length },
    { to: '/admin/photos', label: 'Photos', icon: ImageIcon, count: undefined },
    { to: '/admin/reports', label: 'Reports', icon: FileText, count: reports?.length },
    { to: '/admin/posts', label: 'Posts', icon: Newspaper, count: posts?.length },
    { to: '/admin/bureau', label: 'Bureau', icon: UsersRound, count: bureau?.length },
    { to: '/admin/stats', label: 'Stats', icon: BarChart3, count: stats?.length },
    { to: '/admin/subscribers', label: 'Subscribers', icon: Mail, count: undefined },
  ];

  return (
    <div>
      <AdminPageHeader title="Dashboard" description="Manage the content that appears on the public site." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ to, label, icon: Icon, count }) => (
          <Link key={to} to={to}>
            <AdminCard className="hover:shadow-lg transition-shadow">
              <Icon color="#82246d" size={28} className="mb-4" />
              <p className="text-2xl font-extrabold text-brandGreen">{count ?? '—'}</p>
              <p className="text-brandSlate text-sm font-bold">{label}</p>
            </AdminCard>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
