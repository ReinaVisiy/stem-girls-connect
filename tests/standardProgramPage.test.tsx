import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import StandardProgramPage from '../src/pages/programs/StandardProgramPage';
import type { ProgramDetail } from '../src/lib/programs';
import { parseProgramJson, EXAMPLE_PROGRAM_JSON } from '../src/lib/programImport';

const base: ProgramDetail = {
  id: 1, title: 'Test Program', slug: 'test-program', short_description: null, cover_image_url: null,
  status: 'upcoming', category: 'training', page_template: 'standard',
  start_date: null, end_date: null, application_open_date: null, application_close_date: null,
  location: null, format: null, cost: null, featured: false, display_order: 0,
  application_url: null, application_button_text: null, content: {}, reports: [],
};

const render = (p: Partial<ProgramDetail>) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <StandardProgramPage preview program={{ ...base, ...p }} />
    </MemoryRouter>,
  );

describe('StandardProgramPage', () => {
  it('minimal program: hero and back link only, no empty sections', () => {
    const html = render({});
    expect(html).toContain('Test Program');
    expect(html).toContain('All Programs');
    for (const h of ['About the Program', 'How the Program Works', 'Who Can Participate?', 'What Participants Gain',
      'Important Dates', 'How to Apply', 'How to Participate', 'Frequently Asked Questions', 'Previous Editions']) {
      expect(html).not.toContain(h);
    }
    expect(html).not.toContain('<a href="http');
  });

  it('complete program renders every section in order', () => {
    const html = render({
      status: 'applications_open', application_url: 'https://example.org/apply',
      start_date: '2027-01-10', application_close_date: '2026-12-01', location: 'Online',
      content: {
        overview: 'Overview text.', objectives: ['Objective A'],
        phases: [{ title: 'Phase One', description: 'd' }], eligibility: ['Open to all'], benefits: ['Mentoring'],
        howToApply: 'Fill the form.', faq: [{ question: 'Q?', answer: 'A.' }], contactNote: 'Questions?',
      },
      reports: [{ id: 1, title: 'R1', edition_label: '2026', view_url: '/v', download_url: '/d' } as never],
    });
    const order = ['About the Program', 'Program Objectives', 'How the Program Works', 'Who Can Participate?',
      'What Participants Gain', 'Important Dates', 'How to Apply', 'Frequently Asked Questions', 'Previous Editions'];
    const idx = order.map((h) => html.indexOf(h));
    expect(idx.every((i) => i >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });

  it('objectives alone still render the About section', () => {
    const html = render({ content: { objectives: ['Only objective'] } });
    expect(html).toContain('About the Program');
    expect(html).toContain('Only objective');
  });

  it('Apply button appears only when open with a valid URL, and only once when instructions exist', () => {
    const withInstr = render({ status: 'applications_open', application_url: 'https://example.org/apply', content: { howToApply: 'Do this.' } });
    expect(withInstr.match(/href="https:\/\/example\.org\/apply"/g)?.length).toBe(2); // hero + section, no final duplicate
    const noInstr = render({ status: 'applications_open', application_url: 'https://example.org/apply', content: { contactNote: 'Hi' } });
    expect(noInstr.match(/href="https:\/\/example\.org\/apply"/g)?.length).toBe(2); // hero + final CTA
    for (const bad of [null, '', 'javascript:alert(1)', 'ftp://x']) {
      expect(render({ status: 'applications_open', application_url: bad })).not.toContain('Apply Now');
    }
    expect(render({ status: 'applications_closed', application_url: 'https://example.org/apply' })).not.toContain('https://example.org/apply');
    expect(render({ status: 'upcoming', application_url: 'https://example.org/apply' })).not.toContain('https://example.org/apply');
  });

  it('instructions are hidden for completed programs; heading adapts for non-application programs', () => {
    expect(render({ status: 'completed', content: { howToApply: 'x' } })).not.toContain('How to');
    expect(render({ status: 'ongoing', content: { howToApply: 'Just turn up.' } })).toContain('How to Participate');
    expect(render({ status: 'upcoming', content: { howToApply: 'Register.' } })).toContain('How to Apply');
  });

  it('escapes stored markup instead of injecting it', () => {
    const html = render({ content: { overview: '<script>alert(1)</script>' } });
    expect(html).not.toContain('<script>');
  });
});

describe('program JSON import: new fields', () => {
  it('imports objectives and howToApply', () => {
    const r = parseProgramJson(JSON.stringify({
      title: 'T', content: { objectives: ['A', 'B'], howToApply: 'Email us.' },
    }));
    expect(r.fatal).toBe(false);
    expect(r.values.objectives).toEqual(['A', 'B']);
    expect(r.values.howToApply).toBe('Email us.');
    expect(r.warnings.join(' ')).not.toContain('Unknown field');
  });
  it('rejects wrong types with useful errors', () => {
    const r = parseProgramJson(JSON.stringify({ title: 'T', content: { objectives: 'nope', howToApply: 5 } }));
    expect(r.errors.join(' ')).toContain('content.objectives');
    expect(r.errors.join(' ')).toContain('content.howToApply');
  });
  it('example file round-trips with no errors and never sets published', () => {
    const r = parseProgramJson(JSON.stringify(EXAMPLE_PROGRAM_JSON));
    expect(r.errors).toEqual([]);
    expect(r.values).not.toHaveProperty('published');
  });
  it('invalid JSON is fatal', () => {
    expect(parseProgramJson('{nope').fatal).toBe(true);
  });
});
