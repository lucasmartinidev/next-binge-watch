const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&nbsp;': ' ',
};

const ENTITY_PATTERN = /&(?:amp|lt|gt|quot|#39|#x27|nbsp);/g;
const TAG_PATTERN = /<[^>]*>/g;
const WHITESPACE_PATTERN = /\s+/g;

export function stripHtml(raw?: string | null): string | null {
  if (!raw) {
    return null;
  }
  const withoutTags = raw.replace(TAG_PATTERN, ' ');
  const decoded = withoutTags.replace(ENTITY_PATTERN, (entity) => HTML_ENTITIES[entity] ?? entity);
  const normalized = decoded.replace(WHITESPACE_PATTERN, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}
