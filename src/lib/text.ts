/** Longest slug in characters; Thai is 3 bytes per char in UTF-8, and file names cap at 255 bytes. */
const SLUG_MAX = 80;

/**
 * Legacy slug(): keep A-Z, a-z, 0-9 and Thai; collapse everything else to "-".
 * Capped at SLUG_MAX characters so static file names stay valid; the legacy
 * router only used the id, so the slug is cosmetic.
 */
export const slug = (s: string | null | undefined) =>
  [...String(s ?? '').replace(/[^A-Za-z0-9฀-๿]+/g, '-')]
    .slice(0, SLUG_MAX)
    .join('')
    .replace(/-+$/, '');

export const stripHtml = (html: string | null | undefined) =>
  String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Legacy title_text(): cut to `length` characters on a word boundary and add "...".
 * Thai has no spaces between words, so a single long "word" is hard-cut instead.
 */
export function truncate(str: string | null | undefined, length = 35): string {
  const text = stripHtml(str);
  if ([...text].length <= length) return text;
  const words = text.split(' ');
  let out = '';
  for (const word of words) {
    const next = out ? `${out} ${word}` : word;
    if ([...next].length > length) {
      if (!out) out = [...next].slice(0, length).join('');
      break;
    }
    out = next;
  }
  return `${out}...`;
}

/** YouTube watch URL -> embed URL, as the legacy views did with str_replace. */
export const youtubeEmbed = (u: string | null | undefined) =>
  String(u ?? '').replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/');
