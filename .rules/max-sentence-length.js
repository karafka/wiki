// Karafka Simplified Technical English: keep sentences short. ASD-STE100 limits
// descriptive sentences to 25 words and procedure steps to 20. This rule counts
// words per sentence on prose lines and flags the ones that run long.
//
// Config (in .markdownlint-cli2.jsonc):
//   "max-sentence-length": { "maximum": 25, "maximum_step": 20 }

// Strip markdown/HTML decoration so the word count reflects real words only.
function toPlainText(text) {
  return text
    .replace(/`[^`]*`/g, ' ')               // inline code
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links/images -> visible text
    .replace(/<[^>]+>/g, ' ')               // HTML tags
    .replace(/[*_~]{1,3}/g, '')             // emphasis markers
    .replace(/^\s*#{1,6}\s+/, '');          // stray heading marker
}

function countWords(sentence) {
  return sentence
    .trim()
    .split(/\s+/)
    .filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

module.exports = {
  names: ['max-sentence-length'],
  description: 'Sentences should be short (STE): 25 words max, 20 in numbered steps',
  tags: ['style', 'ste', 'readability'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    const config = params.config || {};
    const maximum = config.maximum || 25;
    const maximumStep = config.maximum_step || 20;
    const lines = params.lines;
    const codeLines = require('./code-lines')(params);

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (codeLines.has(i + 1) || trimmed === '') {
        continue;
      }
      // Skip non-prose lines: headers, table rows, HTML lines, admonition markers.
      if (/^#{1,6}\s/.test(trimmed)) continue;
      if (/^\|/.test(trimmed) || /^<\/?[a-zA-Z]/.test(trimmed)) continue;
      if (/^(!!!|\?\?\?)/.test(trimmed)) continue;

      const isNumberedStep = /^\d+[.)]\s/.test(trimmed);
      const threshold = isNumberedStep ? maximumStep : maximum;

      // Drop the list/step marker, then measure each sentence on the line.
      const body = trimmed.replace(/^(\d+[.)]|[-*+])\s+/, '');
      const sentences = toPlainText(body).split(/(?<=[.!?])\s+/);

      for (const sentence of sentences) {
        const words = countWords(sentence);
        if (words > threshold) {
          onError({
            lineNumber: i + 1,
            detail: `Sentence has ${words} words (max ${threshold}). Split it into shorter sentences (STE).`,
            context: sentence.trim().slice(0, 60)
          });
        }
      }
    }
  }
};
