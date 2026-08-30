import React, { useEffect, useState } from 'react';
import { Trash2, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { uploadToBucket, describeUploadError } from './uploadFile';
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminTextarea, AdminLabel, AdminBanner, AdminFileName } from './AdminUI';

interface Report {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('reports').select('*').order('display_order');
    if (err) setError(err.message);
    else setReports(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) return;
    setSaving(true);
    setError(null);

    try {
      const fileUrl = await uploadToBucket('site-assets', file, 'reports');
      const nextOrder = reports.length > 0 ? Math.max(...reports.map((r) => r.display_order)) + 1 : 1;
      const { error: err } = await supabase.from('reports').insert({
        title: title.trim(),
        description: description.trim() || null,
        file_url: fileUrl,
        start_date: startDate || null,
        end_date: endDate || null,
        display_order: nextOrder,
      });
      if (err) throw err;

      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setFile(null);
      await load();
    } catch (err) {
      setError(describeUploadError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this report?')) return;
    const { error: err } = await supabase.from('reports').delete().eq('id', id);
    if (err) setError(err.message);
    else setReports((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div>
      <AdminPageHeader title="Reports" description="Published on the Impact & Evidence page." />
      {error && <AdminBanner type="error">{error}</AdminBanner>}

      <AdminCard className="mb-8">
        <h2 className="text-sm font-extrabold text-brandGreen uppercase tracking-widest mb-6">Add a Report</h2>
        <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <AdminLabel>Title</AdminLabel>
            <AdminInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 2026 Annual Impact Report" required />
          </div>
          <div>
            <AdminLabel>Start Date</AdminLabel>
            <AdminInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <AdminLabel>End Date</AdminLabel>
            <AdminInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <AdminLabel>Description (optional)</AdminLabel>
            <AdminTextarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short summary shown on the card" />
          </div>
          <div className="md:col-span-2">
            <AdminLabel>PDF File</AdminLabel>
            <input
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-brandSlate file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:uppercase file:tracking-widest file:bg-brandPink/10 file:text-brandPink hover:file:bg-brandPink/20"
            />
            <AdminFileName file={file} />
          </div>
          <div className="md:col-span-2">
            <AdminButton type="submit" disabled={saving}>{saving ? 'Uploading...' : 'Add Report'}</AdminButton>
          </div>
        </form>
      </AdminCard>

      {loading ? (
        <p className="text-brandSlate font-medium">Loading...</p>
      ) : reports.length === 0 ? (
        <p className="text-brandSlate font-medium">No reports yet.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <AdminCard key={r.id} className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-xl bg-brandPink/10 flex items-center justify-center shrink-0">
                <FileText color="#82246d" size={24} />
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-extrabold text-brandGreen truncate">{r.title}</p>
                {(r.start_date || r.end_date) && (
                  <p className="text-brandSlate text-xs font-bold">
                    {formatDate(r.start_date)} {r.end_date && `– ${formatDate(r.end_date)}`}
                  </p>
                )}
                <a
                  href={r.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-brandPink uppercase tracking-widest hover:underline mt-1"
                >
                  View PDF <ExternalLink size={12} />
                </a>
              </div>
              <AdminButton variant="danger" onClick={() => handleDelete(r.id)}>
                <Trash2 size={14} />
              </AdminButton>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
