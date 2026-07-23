// Admonitions must have a DESCRIPTIVE title that states the takeaway - not the
// bare type word, not a low-content placeholder ("Important Note", "Please Read"),
// and not something too short to say anything. Complements admonition-title-required,
// which only checks that a title exists. Skips fenced code blocks.

// Placeholder titles that satisfy "has a title" but carry no information.
const GENERIC_TITLES = new Set([
  'note', 'notes', 'info', 'information', 'warning', 'warn', 'tip', 'hint',
  'danger', 'success', 'example', 'abstract', 'summary', 'quote', 'question',
  'faq', 'bug', 'failure', 'caution', 'error', 'important', 'important note',
  'please note', 'please read', 'read this', 'read me', 'heads up', 'fyi',
  'attention', 'notice', 'psa', 'reminder', 'todo', 'to do', 'nb', 'disclaimer'
]);

function wordCount(text) {
  return (text.trim().match(/[A-Za-z0-9]+/g) || []).length;
}

module.exports = {
  names: ['no-generic-admonition-title'],
  description: 'Admonition titles must be descriptive, not a placeholder or too short',
  tags: ['style', 'admonitions'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    const lines = params.lines;
    let inCodeBlock = false;
    const admonition = /^(?:!!!|\?\?\?\+?)\s+(\w+)\s+"([^"]*)"\s*$/;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (/^(`{3,}|~{3,})/.test(trimmed)) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) {
        continue;
      }

      const match = admonition.exec(trimmed);
      if (!match) {
        continue;
      }
      const type = match[1].toLowerCase();
      const title = match[2].trim();
      const normalized = title.toLowerCase();

      let problem = null;
      if (normalized === type) {
        problem = `repeats the type ("${title}")`;
      } else if (GENERIC_TITLES.has(normalized)) {
        problem = `is a generic placeholder ("${title}")`;
      } else if (wordCount(title) < 2) {
        problem = `is too short to state a takeaway ("${title}")`;
      }

      if (problem) {
        onError({
          lineNumber: i + 1,
          detail: `Admonition title ${problem}. Use a descriptive title that states the takeaway.`,
          context: trimmed
        });
      }
    }
  }
};
