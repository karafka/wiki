// Karafka Simplified Technical English: write contractions out in documentation
// prose ("do not", not "don't"). The controlled list lives in ste-terms.json.
//
// Skips fenced code, inline code, link/image targets, HTML tags, ATX headings,
// and pure navigation/TOC list items - the same protected regions the other STE
// rules leave untouched - so verbatim code and quoted examples keep their text.

const terms = require('./ste-terms.json');

function maskProtected(line) {
  const blank = (match) => ' '.repeat(match.length);
  return line
    .replace(/(`+)[^`]*?\1/g, blank) // inline code spans
    .replace(/\]\([^)]*\)/g, blank)  // markdown link / image targets
    .replace(/<[^>]*>/g, blank);     // autolinks and HTML tags
}

// Build one regex per contraction, tolerant of straight (') and curly (’)
// apostrophes, with boundaries that ignore possessives/plurals (e.g. "don'ts").
const checks = Object.entries(terms.contractions || {}).map(([term, fix]) => ({
  term,
  fix,
  regex: new RegExp(
    "(?<![\\w'’])" + term.replace(/'/g, "['’]") + "(?![\\w'’])",
    'gi'
  )
}));

module.exports = {
  names: ['no-contractions'],
  description: 'Avoid contractions in documentation prose - write them out (STE)',
  tags: ['style', 'ste', 'vocabulary'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    const lines = params.lines;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (/^(`{3,}|~{3,})/.test(trimmed)) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) {
        continue;
      }
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
          onError({
            lineNumber: i + 1,
            detail: `Avoid contractions - write "${check.term}" as "${check.fix}" (STE).`,
            context: line.substr(match.index, match[0].length),
            range: [match.index + 1, match[0].length]
          });
        }
      }
    }
  }
};
