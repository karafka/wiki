// Karafka Simplified Technical English: documentation gives direct instructions,
// not polite requests. Ban "please" in hand-authored prose.
//
// Skips fenced code, inline code, link/image targets, HTML tags, ATX headings,
// and pure navigation/TOC list items - the same protected regions the other STE
// rules leave untouched - so verbatim examples and error output keep their text.

function maskProtected(line) {
  const blank = (match) => ' '.repeat(match.length);
  return line
    .replace(/(`+)[^`]*?\1/g, blank) // inline code spans
    .replace(/\]\([^)]*\)/g, blank)  // markdown link / image targets
    .replace(/<[^>]*>/g, blank);     // autolinks and HTML tags
}

const PLEASE = /\bplease\b/gi;

module.exports = {
  names: ['no-please'],
  description: 'Remove "please": documentation gives direct instructions, not requests',
  tags: ['style', 'ste', 'vocabulary'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    const lines = params.lines;
    const codeLines = require('./code-lines')(params);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (codeLines.has(i + 1)) {
        continue;
      }
      // Headings are anchor targets; pure nav/TOC items mirror them.
      if (/^#{1,6}\s/.test(trimmed)) {
        continue;
      }
      if (/^(?:[-*+]|\d+[.)])\s+\[[^\]]*\]\([^)]*\)\.?\s*$/.test(trimmed)) {
        continue;
      }

      const masked = maskProtected(line);
      PLEASE.lastIndex = 0;
      let match;
      while ((match = PLEASE.exec(masked)) !== null) {
        onError({
          lineNumber: i + 1,
          detail: 'Remove "please". Documentation gives direct instructions, not requests (STE).',
          context: line.substr(match.index, match[0].length),
          range: [match.index + 1, match[0].length]
        });
      }
    }
  }
};
