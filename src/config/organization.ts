/**
 * Centralized, organization-wide public information.
 *
 * These are public website values (not secrets), reused across multiple
 * components/pages. Page-specific content (bureau members, objectives,
 * perks, activity descriptions, etc.) intentionally stays local to the
 * pages it belongs to.
 */

const REPORTS_ARCHIVE_FOLDER_ID = '1Njv9u95nx5YeROOD1OT-kKRasUe4cODY';

export const organization = {
  name: 'STEM Girls Connect',
  website: 'https://stemgirlsconnect.org',

  contact: {
    email: 'info@stemgirlsconnect.org',
    location: 'Foumban, West Region, Cameroon',
  },

  social: {
    facebook: 'https://www.facebook.com/share/1ARdQejW2F/',
    linkedin: 'https://www.linkedin.com/company/stem-girls-connect/',
    instagram: 'https://www.instagram.com/stem.girls.connect?igsh=MTJxdzZla2F5cjdxaQ==',
    tiktok: 'https://www.tiktok.com/@stem.girls.connect?_r=1&_t=ZS-98zjez2SHqO',
    youtube: 'https://youtube.com/@stemgirlsconnect?si=scg3CTtDd7TrNh4K',
    whatsapp: 'https://chat.whatsapp.com/BlVCmJA4c6Q5qYIbgNkrJC',
  },

  forms: {
    membership: 'https://forms.gle/vw5ruqbunzcHWRXD8',
  },

  resources: {
    reportsArchive: `https://drive.google.com/drive/folders/${REPORTS_ARCHIVE_FOLDER_ID}`,
    reportsArchiveEmbed: `https://drive.google.com/embeddedfolderview?id=${REPORTS_ARCHIVE_FOLDER_ID}#grid`,
  },
} as const;
