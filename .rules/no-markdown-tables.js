// Karafka house style: every table is an HTML <table>. This rule flags a
// markdown pipe table by its delimiter row (for example |---|---| or | :-- | --: |),
// which unambiguously marks a markdown table. Skips fenced code blocks.
module.exports = {
  names: ['no-markdown-tables'],
  description: 'Use HTML <table> elements, not markdown pipe tables',
  tags: ['style', 'tables'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    const lines = params.lines;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (/^(`{3,}|~{3,})/.test(trimmed)) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) {
        continue;
      }

      // Delimiter row: only pipes, dashes, colons, and spaces, with at least one
      // pipe and three or more dashes. A plain `---` rule has no pipe and is left
      // to the no-horizontal-rule check.
      if (
        trimmed.includes('|') &&
        /^[\s|:-]+$/.test(trimmed) &&
        (trimmed.match(/-/g) || []).length >= 3
      ) {
        onError({
          lineNumber: i + 1,
          detail: 'Markdown table found. Use an HTML <table> element instead.',
          context: trimmed.slice(0, 40)
        });
      }
    }
  }
};
