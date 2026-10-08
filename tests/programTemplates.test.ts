import { describe, expect, it } from 'vitest';
import { SUPPORTED_PAGE_TEMPLATES, STANDARD_TEMPLATE, isSupportedTemplate } from '../src/lib/programTemplates';
import { specialProgramTemplates } from '../src/pages/programs/specialProgramTemplates';

describe('program template support list', () => {
  it('always supports the standard template', () => {
    expect(SUPPORTED_PAGE_TEMPLATES).toContain(STANDARD_TEMPLATE);
    expect(isSupportedTemplate('standard')).toBe(true);
  });
  it('rejects unknown, empty and non-string templates', () => {
    for (const t of ['wall_of_voices', '', 'Standard', undefined, null, 5]) expect(isSupportedTemplate(t)).toBe(false);
  });
  it('stays in sync with the coded registry: every registered template is listed as supported, and vice versa', () => {
    const registered = Object.keys(specialProgramTemplates).sort();
    const supportedSpecial = SUPPORTED_PAGE_TEMPLATES.filter((t) => t !== STANDARD_TEMPLATE).sort();
    expect(supportedSpecial).toEqual(registered);
  });
});
