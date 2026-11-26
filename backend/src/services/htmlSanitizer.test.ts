import { describe, expect, it } from 'vitest';
import { stripHtml } from './htmlSanitizer';

describe('htmlSanitizer (UT-01)', () => {
  it('strips HTML tags and decodes common entities into clean plain text', () => {
    const raw = '<p>Walter &amp; Jesse &quot;cook&quot; in <b>New Mexico</b>&nbsp;&#39;2008&#39;.</p>';
    expect(stripHtml(raw)).toBe('Walter & Jesse "cook" in New Mexico \'2008\'.');
  });

  it('returns null for null, undefined, or whitespace-only markup', () => {
    expect(stripHtml(null)).toBeNull();
    expect(stripHtml(undefined)).toBeNull();
    expect(stripHtml('<p>   </p>')).toBeNull();
  });
});
