import sanitizeHtml from 'sanitize-html';
import AppError from '../errors/AppError';

export type PolicyType = 'about' | 'terms';
const tags = ['p', 'br', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'blockquote', 'ol', 'ul', 'li', 'a', 'sub', 'sup', 'hr'];

export const policyType = (value: unknown): PolicyType => {
  if (value !== 'about' && value !== 'terms') throw new AppError(400, 'Choose About Us or Terms and Conditions');
  return value;
};

export const policyHtml = (value: unknown, required = true): string => {
  if (typeof value !== 'string' || value.length > 100000) throw new AppError(400, 'Content must be text with at most 100,000 characters');
  let source = value.trim();
  // Preserve historical plain-text content and its paragraph breaks.
  if (!/<\/?[a-z][^>]*>/i.test(source)) {
    source = sanitizeHtml(source, { allowedTags: [], allowedAttributes: {} })
      .split(/\n\s*\n/).map(p => `<p>${p.replace(/\r?\n/g, '<br>')}</p>`).join('');
  }
  const html = sanitizeHtml(source, {
    allowedTags: tags,
    allowedAttributes: { '*': ['style'], a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    allowedStyles: { '*': {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^(black|white|red|blue|green|gray|grey|yellow|orange|purple|transparent)$/i],
      'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^(black|white|red|blue|green|gray|grey|yellow|orange|purple|transparent)$/i],
      'text-align': [/^(left|center|right|justify)$/],
      'font-size': [/^(0\.75|1|1\.5|2\.5)em$/],
      'margin-left': [/^(2|4|6|8|10|12|14|16)em$/],
    } },
    transformTags: { '*': (tagName, attribs) => {
      const styles = attribs.style ? [attribs.style] : [];
      for (const name of (attribs.class ?? '').split(/\s+/)) {
        const alignment = /^ql-align-(center|right|justify)$/.exec(name);
        const indent = /^ql-indent-([1-8])$/.exec(name);
        if (alignment) styles.push(`text-align:${alignment[1]}`);
        if (indent) styles.push(`margin-left:${Number(indent[1]) * 2}em`);
        if (name === 'ql-size-small') styles.push('font-size:0.75em');
        if (name === 'ql-size-large') styles.push('font-size:1.5em');
        if (name === 'ql-size-huge') styles.push('font-size:2.5em');
      }
      return { tagName, attribs: { ...attribs, style: styles.join(';'), ...(tagName === 'a' ? { target: '_blank', rel: 'noopener noreferrer' } : {}) } };
    } },
  });
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&(?:nbsp|#160|#xa0);/gi, ' ').replace(/[\s\u200b-\u200d\ufeff]/g, '');
  if (required && !text) throw new AppError(400, 'Add content before publishing');
  return html;
};
