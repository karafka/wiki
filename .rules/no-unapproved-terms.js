const terms = require('./ste-terms.json');

// Escape a term so it can be embedded safely in a RegExp.
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Match the case of the original token when substituting (only the first letter
// matters for our word/phrase level fixes, e.g. sentence-initial "In order to").
function matchCase(replacement, original) {
  const first = original.charAt(0);
  if (first && first === first.toUpperCase() && first !== first.toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

// Replace protected regions (inline code, link/image targets, HTML tags) with
// same-length runs of spaces so match indices still line up with the original
// line. We only suppress matches inside these regions - we never rewrite them.
function maskProtected(line) {
  const blank = (match) => ' '.repeat(match.length);
  return line
    // inline code spans: `code`, ``co`de``
    .replace(/(`+)[^`]*?\1/g, blank)
    // markdown link / image targets: ](https://...regarding...)
    .replace(/\]\([^)]*\)/g, blank)
    // autolinks and HTML tags: <https://...>, <table>, <td ...>
    .replace(/<[^>]*>/g, blank);
}

// Build the flat list of checks once, at load time.
const checks = [];
for (const entry of terms.substitutions || []) {
  checks.push({
    regex: new RegExp('\\b' + escapeRegExp(entry.term) + '\\b', 'gi'),
    detail: `Use "${entry.fix}" instead of "${entry.term}" (STE controlled vocabulary).`,
    fix: entry.fix
  });
}
for (const entry of terms.flag || []) {
  checks.push({
    regex: new RegExp('\\b' + escapeRegExp(entry.term) + '\\b', 'gi'),
    detail: `Avoid "${entry.term}". ${entry.suggest} (STE)`,
    fix: null
  });
}
for (const entry of terms.banned || []) {
  checks.push({
    regex: new RegExp('\\b' + escapeRegExp(entry.term) + '\\b', 'gi'),
    detail: entry.message + ' (STE)',
    fix: null
  });
}
for (const contraction of terms.contractions || []) {
  checks.push({
    regex: new RegExp('\\b' + escapeRegExp(contraction) + '\\b', 'gi'),
    detail: `Avoid contractions in documentation - write it out instead of "${contraction}" (STE).`,
    fix: null
  });
}

module.exports = {
  names: ['no-unapproved-terms'],
  description: 'Use Karafka Simplified Technical English: approved words, no banned terms or contractions',
  tags: ['style', 'ste', 'vocabulary'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    const lines = params.lines;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Toggle fenced code state and never inspect code content.
      if (/^(`{3,}|~{3,})/.test(trimmed)) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) {
        continue;
      }

      // Never rewrite headings (they are anchor targets) or pure navigation/TOC
      // list items (they mirror headings). Changing either breaks in-page links
      // and cross-references, and can mangle verbatim quoted strings in titles.
      if (/^#{1,6}\s/.test(trimmed)) {
        continue;
      }
      if (/^(?:[-*+]|\d+[.)])\s+\[[^\]]*\]\([^)]*\)\.?\s*$/.test(trimmed)) {
        continue;
      }

      const masked = maskProtected(line);

      for (const check of checks) {
        check.regex.lastIndex = 0;
        let match;
        while ((match = check.regex.exec(masked)) !== null) {
          const original = line.substr(match.index, match[0].length);
          const error = {
            lineNumber: i + 1,
            detail: check.detail,
            context: original,
            range: [match.index + 1, match[0].length]
          };
          if (check.fix) {
            error.fixInfo = {
              editColumn: match.index + 1,
              deleteCount: match[0].length,
              insertText: matchCase(check.fix, original)
            };
          }
          onError(error);
        }
      }
    }
  }
};
