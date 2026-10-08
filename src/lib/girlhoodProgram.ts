export function validateGirlhoodProgram(template: string, slug: string): string | null {
  if (template === 'girlhood' && slug !== 'girlhood') return 'Girlhood uses the permanent slug “girlhood” to preserve campaign and receipt links.';
  if (slug === 'girlhood' && template !== 'girlhood') return 'The slug “girlhood” is reserved for the Girlhood campaign template.';
  return null;
}
