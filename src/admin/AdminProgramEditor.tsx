import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Eye, FileJson, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { uploadToBucket, describeUploadError } from './uploadFile';
import {
  AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminTextarea, AdminLabel, AdminSelect, AdminBanner, AdminFileName,
} from './AdminUI';
import { parseProgramJson, readProgramJsonFile, downloadExampleProgramJson } from '../lib/programImport';
import StandardProgramPage from '../pages/programs/StandardProgramPage';
import { buildReportUrls, type PublicReport } from '../lib/reportUrls';
import { syncProgramReportLinks, describeLinkError } from './programReportLinks';
import {
  CATEGORY_LABELS, STATUS_LABELS, safeUrl,
  type ProgramCategory, type ProgramContent, type ProgramDetail, type ProgramStatus,
} from '../lib/programs';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '') as string;

// Page templates the admin can choose. A program already using another
// template keeps it (see templateOptions below); only "standard" is
// authored here.
const SELECTABLE_TEMPLATES = ['standard'];

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function move<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

interface ReportRow {
  id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
  file_path: string | null;
  download_name: string | null;
  file_url: string | null;
}

interface LinkedReport {
  reportId: number;
  editionLabel: string;
}

interface FormState {
  title: string;
  slug: string;
  shortDescription: string;
  coverImageUrl: string;
  category: ProgramCategory;
  status: ProgramStatus;
  pageTemplate: string;
  startDate: string;
  endDate: string;
  applicationOpenDate: string;
  applicationCloseDate: string;
  applicationUrl: string;
  applicationButtonText: string;
  location: string;
  format: string;
  cost: string;
  published: boolean;
  featured: boolean;
  tagline: string;
  overview: string;
  quickFacts: { label: string; value: string }[];
  phases: { title: string; description: string }[];
  eligibility: string[];
  benefits: string[];
  faq: { question: string; answer: string }[];
  contactNote: string;
}

const emptyForm: FormState = {
  title: '', slug: '', shortDescription: '', coverImageUrl: '',
  category: 'other', status: 'upcoming', pageTemplate: 'standard',
  startDate: '', endDate: '', applicationOpenDate: '', applicationCloseDate: '',
  applicationUrl: '', applicationButtonText: '', location: '', format: '', cost: '',
  published: false, featured: false,
  tagline: '', overview: '', quickFacts: [], phases: [], eligibility: [], benefits: [], faq: [], contactNote: '',
};

/** Label + control with a real for/id association. */
const Field: React.FC<{
  label: string;
  hint?: string;
  className?: string;
  children: (id: string) => React.ReactNode;
}> = ({ label, hint, className = '', children }) => {
  const id = useId();
  return (
    <div className={className}>
      <AdminLabel htmlFor={id}>{label}</AdminLabel>
      {children(id)}
      {hint && <p className="text-xs font-medium text-brandSlate mt-1">{hint}</p>}
    </div>
  );
};

const Checkbox: React.FC<{ label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label, hint, checked, onChange,
}) => (
  <label className="flex items-start gap-3 cursor-pointer min-h-11">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 h-5 w-5 accent-[#82246d]"
    />
    <span>
      <span className="block text-sm font-extrabold text-brandSlate">{label}</span>
      {hint && <span className="block text-xs font-medium text-brandSlate">{hint}</span>}
    </span>
  </label>
);

const RowControls: React.FC<{
  label: string;
  index: number;
  count: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}> = ({ label, index, count, onMove, onRemove }) => (
  <div className="flex md:flex-col gap-1 shrink-0">
    <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${label} up`} className="min-w-9 min-h-9 text-gray-400 disabled:opacity-20">▲</button>
    <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${label} down`} className="min-w-9 min-h-9 text-gray-400 disabled:opacity-20">▼</button>
    <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="min-w-9 min-h-9 text-red-500 flex items-center justify-center">
      <Trash2 size={16} aria-hidden="true" />
    </button>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-sm font-extrabold text-brandGreen uppercase tracking-widest mb-6">{children}</h2>
);

const AddButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <AdminButton type="button" variant="ghost" onClick={onClick}>
    <span className="inline-flex items-center gap-2">
      <Plus size={14} aria-hidden="true" /> {children}
    </span>
  </AdminButton>
);

const StringListEditor: React.FC<{
  title: string;
  itemLabel: string;
  addLabel: string;
  items: string[];
  onChange: (items: string[]) => void;
}> = ({ title, itemLabel, addLabel, items, onChange }) => (
  <div>
    <SectionTitle>{title}</SectionTitle>
    <div className="space-y-3 mb-4">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <AdminInput
            aria-label={`${itemLabel} ${i + 1}`}
            value={item}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <RowControls
            label={`${itemLabel} ${i + 1}`}
            index={i}
            count={items.length}
            onMove={(dir) => onChange(move(items, i, dir))}
            onRemove={() => onChange(items.filter((_, j) => j !== i))}
          />
        </div>
      ))}
    </div>
    <AddButton onClick={() => onChange([...items, ''])}>{addLabel}</AddButton>
  </div>
);

function linkWarning(message: string): string {
  return `The program details were saved, but its linked reports could not be updated: ${message}. Your report changes are NOT saved — fix the problem and press Save again.`;
}

const AdminProgramEditor: React.FC = () => {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [originalContent, setOriginalContent] = useState<ProgramContent>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [links, setLinks] = useState<LinkedReport[]>([]);
  const [originalLinkIds, setOriginalLinkIds] = useState<number[]>([]);
  const [allReports, setAllReports] = useState<ReportRow[]>([]);
  const [reportToAdd, setReportToAdd] = useState('');

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState(searchParams.get('preview') === '1');
  const [importResult, setImportResult] = useState<{
    fileName: string;
    applied: number;
    errors: string[];
    warnings: string[];
    fatal: boolean;
  } | null>(null);
  const importPanelRef = useRef<HTMLDivElement>(null);
  const handledNavImport = useRef(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  // Load reports (for linking) and, when editing, the program itself.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const reportsRes = await supabase
        .from('reports')
        .select('id, title, description, start_date, end_date, display_order, file_path, download_name, file_url')
        .order('display_order');
      if (!cancelled && reportsRes.data) setAllReports(reportsRes.data as ReportRow[]);

      if (isNew) return;

      const { data, error: err } = await supabase.from('programs').select('*').eq('id', id).maybeSingle();
      if (cancelled) return;
      if (err || !data) {
        setError(err?.message ?? 'Program not found.');
        setLoading(false);
        return;
      }

      const c = (data.content ?? {}) as ProgramContent;
      setOriginalContent(c);
      setSlugTouched(true); // never silently change a live URL
      setForm({
        title: data.title,
        slug: data.slug,
        shortDescription: data.short_description ?? '',
        coverImageUrl: data.cover_image_url ?? '',
        category: data.category,
        status: data.status,
        pageTemplate: data.page_template,
        startDate: data.start_date ?? '',
        endDate: data.end_date ?? '',
        applicationOpenDate: data.application_open_date ?? '',
        applicationCloseDate: data.application_close_date ?? '',
        applicationUrl: data.application_url ?? '',
        applicationButtonText: data.application_button_text ?? '',
        location: data.location ?? '',
        format: data.format ?? '',
        cost: data.cost ?? '',
        published: data.published,
        featured: data.featured,
        tagline: c.tagline ?? '',
        overview: c.overview ?? '',
        quickFacts: c.quickFacts ?? [],
        phases: c.phases ?? [],
        eligibility: c.eligibility ?? [],
        benefits: c.benefits ?? [],
        faq: c.faq ?? [],
        contactNote: c.contactNote ?? '',
      });

      const linkRes = await supabase
        .from('program_reports')
        .select('report_id, edition_label, display_order')
        .eq('program_id', id)
        .order('display_order');
      if (cancelled) return;
      const linkRows = (linkRes.data ?? []) as { report_id: number; edition_label: string | null }[];
      setLinks(linkRows.map((l) => ({ reportId: l.report_id, editionLabel: l.edition_label ?? '' })));
      setOriginalLinkIds(linkRows.map((l) => l.report_id));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  // Local preview URL for a newly chosen cover image.
  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const onTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
  };

  const isStandard = form.pageTemplate === 'standard';

  /**
   * Prefills the form from program JSON. Never sets published/featured,
   * never saves anything: the admin reviews, edits and presses Save.
   */
  const applyImport = (text: string, fileName: string) => {
    const result = parseProgramJson(text);
    const applied = Object.keys(result.values).length;

    if (!result.fatal && applied > 0) {
      setForm((f) => {
        const next = { ...f, ...result.values };
        if (!result.values.slug && result.values.title && !slugTouched) next.slug = slugify(result.values.title);
        return next;
      });
      if (result.values.slug) setSlugTouched(true);
      setSuccess(null);
      setError(null);
    }

    setImportResult({ fileName, applied, errors: result.errors, warnings: result.warnings, fatal: result.fatal });
    setTimeout(() => importPanelRef.current?.focus(), 0);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!isNew && !window.confirm('Replace the matching fields in this form with the values from the file? Nothing is saved until you press Save Changes.')) return;
    try {
      applyImport(await readProgramJsonFile(file), file.name);
    } catch (err) {
      setImportResult({ fileName: file.name, applied: 0, errors: [err instanceof Error ? err.message : 'The file could not be read.'], warnings: [], fatal: true });
      setTimeout(() => importPanelRef.current?.focus(), 0);
    }
  };

  // A file chosen on the programs list arrives via router state.
  useEffect(() => {
    const state = location.state as { importText?: string; importFileName?: string } | null;
    if (!isNew || loading || handledNavImport.current || !state?.importText) return;
    handledNavImport.current = true;
    applyImport(state.importText, state.importFileName ?? 'program.json');
    navigate('.', { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, loading, location.state]);

  // A report-link failure from creating a new program arrives via router state
  // (the program row was saved, so we are now on its edit page).
  useEffect(() => {
    const state = location.state as { linkError?: string } | null;
    if (!state?.linkError) return;
    setError(linkWarning(state.linkError));
    setSuccess(null);
    navigate('.', { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const templateOptions = useMemo(
    () => (SELECTABLE_TEMPLATES.includes(form.pageTemplate) ? SELECTABLE_TEMPLATES : [...SELECTABLE_TEMPLATES, form.pageTemplate]),
    [form.pageTemplate]
  );

  const reportsById = useMemo(() => new Map(allReports.map((r) => [r.id, r])), [allReports]);
  const linkableReports = allReports.filter((r) => !links.some((l) => l.reportId === r.id));

  const buildContent = (): ProgramContent => ({
    ...originalContent,
    tagline: form.tagline.trim(),
    overview: form.overview.trim(),
    quickFacts: form.quickFacts.filter((f) => f.label.trim() && f.value.trim()).map((f) => ({ label: f.label.trim(), value: f.value.trim() })),
    phases: form.phases.filter((p) => p.title.trim()).map((p) => ({ title: p.title.trim(), description: p.description.trim() })),
    eligibility: form.eligibility.map((t) => t.trim()).filter(Boolean),
    benefits: form.benefits.map((t) => t.trim()).filter(Boolean),
    faq: form.faq.filter((f) => f.question.trim() && f.answer.trim()).map((f) => ({ question: f.question.trim(), answer: f.answer.trim() })),
    contactNote: form.contactNote.trim(),
  });

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Program name is required.';
    if (!form.slug.trim()) return 'A slug is required.';
    if (!SLUG_RE.test(form.slug)) return 'The slug can only contain lowercase letters, numbers and single hyphens (e.g. hvi-stem-2026).';
    if (form.startDate && form.endDate && form.endDate < form.startDate) return 'The end date cannot be before the start date.';
    if (form.applicationOpenDate && form.applicationCloseDate && form.applicationCloseDate < form.applicationOpenDate)
      return 'The application close date cannot be before the open date.';
    if (form.applicationUrl.trim() && !safeUrl(form.applicationUrl)) return 'The application link must start with https:// (or http:// or mailto:).';
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    try {
      const slug = form.slug.trim();

      // Friendly pre-check; the UNIQUE constraint below is the real guarantee.
      let dupQuery = supabase.from('programs').select('id').eq('slug', slug);
      if (!isNew) dupQuery = dupQuery.neq('id', id);
      const { data: dup } = await dupQuery.limit(1);
      if (dup && dup.length > 0) throw new Error('Another program already uses this slug. Please choose a different one.');

      let coverUrl = form.coverImageUrl || null;
      if (coverFile) coverUrl = await uploadToBucket('site-assets', coverFile, 'programs');

      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        slug,
        short_description: form.shortDescription.trim() || null,
        cover_image_url: coverUrl,
        status: form.status,
        category: form.category,
        page_template: form.pageTemplate,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        application_open_date: form.applicationOpenDate || null,
        application_close_date: form.applicationCloseDate || null,
        application_url: form.applicationUrl.trim() || null,
        application_button_text: form.applicationButtonText.trim() || null,
        location: form.location.trim() || null,
        format: form.format.trim() || null,
        cost: form.cost.trim() || null,
        published: form.published,
        featured: form.featured,
      };
      // Only the standard template's content is edited here; other
      // templates' content is left exactly as stored.
      if (isStandard) payload.content = buildContent();

      let programId: number;
      if (isNew) {
        const { data: orderRows } = await supabase.from('programs').select('display_order').order('display_order', { ascending: false }).limit(1);
        payload.display_order = (orderRows?.[0]?.display_order ?? 0) + 1;
        const { data, error: err } = await supabase.from('programs').insert(payload).select('id').single();
        if (err) throw err;
        programId = data.id;
      } else {
        const { error: err } = await supabase.from('programs').update(payload).eq('id', id);
        if (err) throw err;
        programId = Number(id);
      }

      // The program row is now safely stored. Reflect that in local state
      // straight away so a later failure (report links) can never make it look
      // unsaved, and so a retry does not upload the cover image a second time.
      setForm((f) => ({ ...f, coverImageUrl: coverUrl ?? '' }));
      setCoverFile(null);
      setOriginalContent(isStandard ? buildContent() : originalContent);

      // Sync report links. A failure here must NOT look like a successful
      // save, and must not be reported as if the whole save had failed.
      let linkFailure: string | null = null;
      if (isStandard || originalLinkIds.length > 0 || links.length > 0) {
        try {
          await syncProgramReportLinks(supabase, programId, links, originalLinkIds);
          setOriginalLinkIds(links.map((l) => l.reportId));
        } catch (linkErr) {
          linkFailure = describeLinkError(linkErr);
        }
      }

      if (isNew) {
        // Hand any link failure to the edit page: the program now exists, so
        // saving again from /new would create a duplicate.
        navigate(`/admin/programs/${programId}`, { replace: true, state: linkFailure ? { linkError: linkFailure } : null });
      } else if (linkFailure) {
        setError(linkWarning(linkFailure));
      } else {
        setSuccess('Program saved.');
      }
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      setError(code === '23505' ? 'Another program already uses this slug. Please choose a different one.' : describeUploadError(err));
    } finally {
      setSaving(false);
    }
  };

  // Build a ProgramDetail from the unsaved form so the preview is exactly what visitors would see.
  const previewProgram: ProgramDetail = useMemo(() => {
    const reports = links
      .map((l) => {
        const r = reportsById.get(l.reportId);
        if (!r) return null;
        const urls = buildReportUrls(supabaseUrl, r);
        if (!urls) return null;
        const pub: PublicReport & { edition_label: string | null } = {
          id: r.id, title: r.title, description: r.description, start_date: r.start_date, end_date: r.end_date,
          display_order: r.display_order, edition_label: l.editionLabel.trim() || null, ...urls,
        };
        return pub;
      })
      .filter((r): r is PublicReport & { edition_label: string | null } => r !== null);

    return {
      id: Number(id) || 0,
      title: form.title || 'Untitled program',
      slug: form.slug || 'untitled',
      short_description: form.shortDescription || null,
      cover_image_url: coverPreview ?? (form.coverImageUrl || null),
      status: form.status,
      category: form.category,
      page_template: form.pageTemplate,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      application_open_date: form.applicationOpenDate || null,
      application_close_date: form.applicationCloseDate || null,
      location: form.location || null,
      format: form.format || null,
      cost: form.cost || null,
      featured: form.featured,
      display_order: 0,
      application_url: form.applicationUrl || null,
      application_button_text: form.applicationButtonText || null,
      content: buildContent(),
      reports,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, links, reportsById, coverPreview, id]);

  if (loading) return <p className="text-brandSlate font-medium">Loading...</p>;

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
      <Link to="/admin/programs" className="inline-flex items-center gap-2 text-xs font-extrabold text-brandSlate uppercase tracking-widest hover:text-brandPink">
        <ArrowLeft size={14} aria-hidden="true" /> All programs
      </Link>
      <AdminButton type="button" variant="ghost" onClick={() => setPreview((p) => !p)}>
        <span className="inline-flex items-center gap-2">
          {preview ? <Pencil size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
          {preview ? 'Back to editing' : 'Preview'}
        </span>
      </AdminButton>
    </div>
  );

  if (preview) {
    return (
      <div>
        {header}
        <AdminPageHeader title={`Preview: ${form.title || 'Untitled program'}`} description="This is how the page will look to visitors once published. Unsaved changes are included." />
        {!form.published && <AdminBanner type="success">This program is a draft, so visitors cannot see it yet.</AdminBanner>}
        {isStandard ? (
          <div className="rounded-[32px] overflow-hidden border border-gray-100 bg-white">
            <StandardProgramPage program={previewProgram} preview />
          </div>
        ) : (
          <AdminCard>
            <p className="text-sm font-medium text-brandSlate">
              This program uses the custom page template “{form.pageTemplate}”, which can't be previewed here.
            </p>
          </AdminCard>
        )}
      </div>
    );
  }

  return (
    <div>
      {header}
      <AdminPageHeader
        title={isNew ? 'Add Program' : 'Edit Program'}
        description="Fill in the details, preview the page, then publish when you're ready."
      />
      {error && <AdminBanner type="error">{error}</AdminBanner>}
      {success && <AdminBanner type="success">{success}</AdminBanner>}

      <form onSubmit={handleSave} className="space-y-8">
        {/* ---- JSON import (optional) ---- */}
        {(isNew || isStandard) && (
          <AdminCard>
            <SectionTitle>Import from JSON (optional)</SectionTitle>
            <p className="text-sm font-medium text-brandSlate mb-4">
              Prefill this form from a <code>.json</code> file. You can review and change everything before saving, and nothing is published automatically. Images and reports are added below, not through the file.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 min-h-11 rounded-xl text-xs font-extrabold uppercase tracking-widest bg-brandPink text-white shadow-md shadow-brandPink/20 hover:scale-[1.02] transition-all cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brandPink">
                <FileJson size={14} aria-hidden="true" /> Import Program JSON
                <input type="file" accept=".json,application/json" onChange={handleImportFile} className="sr-only" />
              </label>
              <AdminButton type="button" variant="ghost" onClick={downloadExampleProgramJson}>
                <span className="inline-flex items-center gap-2">
                  <Download size={14} aria-hidden="true" /> Download example file
                </span>
              </AdminButton>
            </div>

            {importResult && (
              <div
                ref={importPanelRef}
                tabIndex={-1}
                role={importResult.errors.length > 0 || importResult.fatal ? 'alert' : 'status'}
                className="mt-6 space-y-3 outline-none"
              >
                {!importResult.fatal && importResult.applied > 0 && (
                  <AdminBanner type="success">
                    Imported {importResult.applied} field{importResult.applied === 1 ? '' : 's'} from “{importResult.fileName}”. Review everything below, then press {isNew ? 'Create Program' : 'Save Changes'}. Nothing has been saved or published yet.
                  </AdminBanner>
                )}
                {!importResult.fatal && importResult.applied === 0 && importResult.errors.length === 0 && (
                  <AdminBanner type="error">“{importResult.fileName}” did not contain any fields this form can use.</AdminBanner>
                )}
                {importResult.errors.length > 0 && (
                  <div className="p-4 rounded-2xl text-sm font-bold bg-red-50 text-red-600 border border-red-100">
                    <p className="mb-2">
                      {importResult.fatal ? `“${importResult.fileName}” could not be imported:` : 'These parts of the file were skipped. Please fix them in the form or the file:'}
                    </p>
                    <ul className="list-disc pl-5 space-y-1 font-medium">
                      {importResult.errors.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
                {importResult.warnings.length > 0 && (
                  <div className="p-4 rounded-2xl text-sm font-bold bg-amber-50 text-amber-800 border border-amber-100">
                    <p className="mb-2">Notes:</p>
                    <ul className="list-disc pl-5 space-y-1 font-medium">
                      {importResult.warnings.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </AdminCard>
        )}

        {/* ---- Basics ---- */}
        <AdminCard>
          <SectionTitle>Program details</SectionTitle>
          <div className="grid md:grid-cols-2 gap-6">
            <Field label="Program name" className="md:col-span-2">
              {(fid) => <AdminInput id={fid} required value={form.title} onChange={(e) => onTitleChange(e.target.value)} placeholder="e.g. HVI-STEM Mentorship Program" />}
            </Field>
            <Field
              label="Slug"
              className="md:col-span-2"
              hint={`Web address: /programs/${form.slug || 'your-slug'}`}
            >
              {(fid) => (
                <AdminInput
                  id={fid}
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', e.target.value.toLowerCase());
                  }}
                  onBlur={() => set('slug', slugify(form.slug))}
                />
              )}
            </Field>
            <Field label="Short description" className="md:col-span-2" hint="Shown on the program card and in search results.">
              {(fid) => <AdminTextarea id={fid} rows={3} value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />}
            </Field>

            <div className="md:col-span-2">
              <AdminLabel htmlFor="program-cover">Cover image</AdminLabel>
              {(coverPreview || form.coverImageUrl) && (
                <div className="mb-3 flex items-center gap-4">
                  <img src={coverPreview ?? form.coverImageUrl} alt="Current cover" className="h-24 w-40 rounded-xl object-cover border border-gray-100" />
                  {!coverFile && (
                    <AdminButton type="button" variant="danger" onClick={() => set('coverImageUrl', '')}>
                      Remove
                    </AdminButton>
                  )}
                </div>
              )}
              <input
                id="program-cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-brandSlate file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:uppercase file:tracking-widest file:bg-brandPink/10 file:text-brandPink hover:file:bg-brandPink/20"
              />
              <AdminFileName file={coverFile} />
            </div>

            <Field label="Category">
              {(fid) => (
                <AdminSelect id={fid} value={form.category} onChange={(e) => set('category', e.target.value as ProgramCategory)}>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </AdminSelect>
              )}
            </Field>
            <Field label="Status">
              {(fid) => (
                <AdminSelect id={fid} value={form.status} onChange={(e) => set('status', e.target.value as ProgramStatus)}>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </AdminSelect>
              )}
            </Field>
            <Field label="Page template" className="md:col-span-2" hint="Standard programs get an information page built from the fields below.">
              {(fid) => (
                <AdminSelect id={fid} value={form.pageTemplate} onChange={(e) => set('pageTemplate', e.target.value)}>
                  {templateOptions.map((t) => (
                    <option key={t} value={t}>{t === 'standard' ? 'Standard information page' : `${t} (custom)`}</option>
                  ))}
                </AdminSelect>
              )}
            </Field>
            {!isStandard && (
              <p className="md:col-span-2 text-sm font-bold text-brandSlate bg-brandSlate/10 rounded-xl p-4">
                This program uses a custom page template. Only its general details are edited here; its page content is managed separately.
              </p>
            )}
          </div>
        </AdminCard>

        {/* ---- Dates, application, logistics ---- */}
        <AdminCard>
          <SectionTitle>Dates, application and logistics</SectionTitle>
          <div className="grid md:grid-cols-2 gap-6">
            <Field label="Start date">{(fid) => <AdminInput id={fid} type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />}</Field>
            <Field label="End date">{(fid) => <AdminInput id={fid} type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />}</Field>
            <Field label="Application open date">{(fid) => <AdminInput id={fid} type="date" value={form.applicationOpenDate} onChange={(e) => set('applicationOpenDate', e.target.value)} />}</Field>
            <Field label="Application close date">{(fid) => <AdminInput id={fid} type="date" value={form.applicationCloseDate} onChange={(e) => set('applicationCloseDate', e.target.value)} />}</Field>
            <Field label="Application link" hint="The Apply button only appears when the status is Applications Open and a link is set.">
              {(fid) => <AdminInput id={fid} type="url" value={form.applicationUrl} onChange={(e) => set('applicationUrl', e.target.value)} placeholder="https://..." />}
            </Field>
            <Field label="Application button text" hint="Optional. Defaults to “Apply Now”.">
              {(fid) => <AdminInput id={fid} value={form.applicationButtonText} onChange={(e) => set('applicationButtonText', e.target.value)} />}
            </Field>
            <Field label="Location">{(fid) => <AdminInput id={fid} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Online" />}</Field>
            <Field label="Format">{(fid) => <AdminInput id={fid} value={form.format} onChange={(e) => set('format', e.target.value)} placeholder="e.g. 4-week virtual cohort" />}</Field>
            <Field label="Cost" className="md:col-span-2">{(fid) => <AdminInput id={fid} value={form.cost} onChange={(e) => set('cost', e.target.value)} placeholder="e.g. Free" />}</Field>
          </div>
        </AdminCard>

        {/* ---- Standard page content ---- */}
        {isStandard && (
          <>
            <AdminCard>
              <SectionTitle>Page introduction</SectionTitle>
              <div className="space-y-6">
                <Field label="Tagline">{(fid) => <AdminInput id={fid} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />}</Field>
                <Field label="Overview" hint="Separate paragraphs with a blank line.">
                  {(fid) => <AdminTextarea id={fid} rows={6} value={form.overview} onChange={(e) => set('overview', e.target.value)} />}
                </Field>
                <Field label="Contact note" hint="Optional line shown at the bottom of the page, with a link to the contact page.">
                  {(fid) => <AdminInput id={fid} value={form.contactNote} onChange={(e) => set('contactNote', e.target.value)} />}
                </Field>
              </div>
            </AdminCard>

            <AdminCard>
              <SectionTitle>Quick facts</SectionTitle>
              <p className="text-xs font-medium text-brandSlate mb-4">Dates, location, format and cost are added automatically. Add anything else here, such as the number of participants.</p>
              <div className="space-y-3 mb-4">
                {form.quickFacts.map((fact, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="grid sm:grid-cols-2 gap-2 flex-grow">
                      <AdminInput aria-label={`Fact ${i + 1} label`} placeholder="Label (e.g. Participants)" value={fact.label}
                        onChange={(e) => set('quickFacts', form.quickFacts.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                      <AdminInput aria-label={`Fact ${i + 1} value`} placeholder="Value (e.g. 30 girls)" value={fact.value}
                        onChange={(e) => set('quickFacts', form.quickFacts.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                    </div>
                    <RowControls label={`fact ${i + 1}`} index={i} count={form.quickFacts.length}
                      onMove={(d) => set('quickFacts', move(form.quickFacts, i, d))}
                      onRemove={() => set('quickFacts', form.quickFacts.filter((_, j) => j !== i))} />
                  </div>
                ))}
              </div>
              <AddButton onClick={() => set('quickFacts', [...form.quickFacts, { label: '', value: '' }])}>Add Fact</AddButton>
            </AdminCard>

            <AdminCard>
              <SectionTitle>Program phases</SectionTitle>
              <div className="space-y-4 mb-4">
                {form.phases.map((phase, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="space-y-2 flex-grow">
                      <AdminInput aria-label={`Phase ${i + 1} title`} placeholder="Phase title" value={phase.title}
                        onChange={(e) => set('phases', form.phases.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                      <AdminTextarea aria-label={`Phase ${i + 1} description`} rows={2} placeholder="What happens in this phase" value={phase.description}
                        onChange={(e) => set('phases', form.phases.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                    </div>
                    <RowControls label={`phase ${i + 1}`} index={i} count={form.phases.length}
                      onMove={(d) => set('phases', move(form.phases, i, d))}
                      onRemove={() => set('phases', form.phases.filter((_, j) => j !== i))} />
                  </div>
                ))}
              </div>
              <AddButton onClick={() => set('phases', [...form.phases, { title: '', description: '' }])}>Add Phase</AddButton>
            </AdminCard>

            <AdminCard>
              <StringListEditor title="Eligibility (who can apply)" itemLabel="Eligibility item" addLabel="Add Item" items={form.eligibility} onChange={(v) => set('eligibility', v)} />
            </AdminCard>

            <AdminCard>
              <StringListEditor title="Participant benefits" itemLabel="Benefit" addLabel="Add Item" items={form.benefits} onChange={(v) => set('benefits', v)} />
            </AdminCard>

            <AdminCard>
              <SectionTitle>FAQ</SectionTitle>
              <div className="space-y-4 mb-4">
                {form.faq.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="space-y-2 flex-grow">
                      <AdminInput aria-label={`Question ${i + 1}`} placeholder="Question" value={item.question}
                        onChange={(e) => set('faq', form.faq.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} />
                      <AdminTextarea aria-label={`Answer ${i + 1}`} rows={2} placeholder="Answer" value={item.answer}
                        onChange={(e) => set('faq', form.faq.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
                    </div>
                    <RowControls label={`question ${i + 1}`} index={i} count={form.faq.length}
                      onMove={(d) => set('faq', move(form.faq, i, d))}
                      onRemove={() => set('faq', form.faq.filter((_, j) => j !== i))} />
                  </div>
                ))}
              </div>
              <AddButton onClick={() => set('faq', [...form.faq, { question: '', answer: '' }])}>Add Question</AddButton>
            </AdminCard>
          </>
        )}

        {/* ---- Previous reports ---- */}
        <AdminCard>
          <SectionTitle>Previous editions (linked reports)</SectionTitle>
          <div className="space-y-4 mb-4">
            {links.map((l, i) => {
              const r = reportsById.get(l.reportId);
              return (
                <div key={l.reportId} className="flex gap-2 items-start">
                  <div className="space-y-2 flex-grow min-w-0">
                    <p className="text-sm font-extrabold text-brandGreen break-words">{r?.title ?? `Report #${l.reportId}`}</p>
                    <AdminInput aria-label={`Edition label for ${r?.title ?? 'report'}`} placeholder="Edition label (e.g. 2026 Edition)" value={l.editionLabel}
                      onChange={(e) => setLinks((list) => list.map((x, j) => (j === i ? { ...x, editionLabel: e.target.value } : x)))} />
                  </div>
                  <RowControls label={r?.title ?? 'report'} index={i} count={links.length}
                    onMove={(d) => setLinks((list) => move(list, i, d))}
                    onRemove={() => setLinks((list) => list.filter((_, j) => j !== i))} />
                </div>
              );
            })}
          </div>
          {linkableReports.length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <Field label="Link an existing report" className="flex-grow">
                {(fid) => (
                  <AdminSelect id={fid} value={reportToAdd} onChange={(e) => setReportToAdd(e.target.value)}>
                    <option value="">Choose a report...</option>
                    {linkableReports.map((r) => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </AdminSelect>
                )}
              </Field>
              <AdminButton
                type="button"
                variant="ghost"
                disabled={!reportToAdd}
                onClick={() => {
                  setLinks((list) => [...list, { reportId: Number(reportToAdd), editionLabel: '' }]);
                  setReportToAdd('');
                }}
              >
                Link Report
              </AdminButton>
            </div>
          ) : (
            <p className="text-xs font-medium text-brandSlate">{allReports.length === 0 ? 'No reports exist yet. Add them under Reports.' : 'All reports are already linked.'}</p>
          )}
        </AdminCard>

        {/* ---- Publishing ---- */}
        <AdminCard>
          <SectionTitle>Visibility</SectionTitle>
          <div className="space-y-3">
            <Checkbox label="Published" hint="Visible on the public Programs page." checked={form.published} onChange={(v) => set('published', v)} />
            <Checkbox label="Featured" checked={form.featured} onChange={(v) => set('featured', v)} />
          </div>
        </AdminCard>

        <div className="flex flex-wrap gap-3 sticky bottom-0 bg-[#f6f8f9] py-4 -mx-2 px-2">
          <AdminButton type="submit" disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Create Program' : 'Save Changes'}
          </AdminButton>
          <AdminButton type="button" variant="ghost" onClick={() => setPreview(true)}>
            Preview
          </AdminButton>
        </div>
      </form>
    </div>
  );
};

export default AdminProgramEditor;
