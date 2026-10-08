import React from 'react';
import { ExternalLink, Download } from 'lucide-react';

interface ReportActionsProps {
  viewUrl: string;
  downloadUrl: string;
  /** Used to make the link text unambiguous for screen readers. */
  title: string;
}

/**
 * The two public report actions. Shared by /impact and program pages so
 * report handling is never reimplemented per component. Raw storage
 * URLs are used as hrefs only, never rendered as visible text.
 */
const ReportActions: React.FC<ReportActionsProps> = ({ viewUrl, downloadUrl, title }) => (
  <div className="flex flex-wrap gap-3">
    <a
      href={viewUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View report: ${title} (opens in a new tab)`}
      className="inline-flex items-center justify-center gap-2 bg-brandPink text-white px-6 py-3 min-h-11 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandPink"
    >
      View Report <ExternalLink size={16} aria-hidden="true" />
    </a>
    <a
      href={downloadUrl}
      download
      aria-label={`Download PDF: ${title}`}
      className="inline-flex items-center justify-center gap-2 border-2 border-brandPink text-brandPink px-6 py-3 min-h-11 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-brandPink/10 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandPink"
    >
      Download PDF <Download size={16} aria-hidden="true" />
    </a>
  </div>
);

export default ReportActions;
