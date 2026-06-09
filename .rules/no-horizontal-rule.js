module.exports = {
  names: ['no-horizontal-rule'],
  description: 'Horizontal rules (---) are not allowed - remove the separator line',
  tags: ['style'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    const lines = params.lines;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (/^(`{3,}|~{3,})/.test(trimmed)) {
        inCodeBlock = !inCodeBlock;
      }

      if (!inCodeBlock && /^---\s*$/.test(trimmed)) {
        onError({
          lineNumber: i + 1,
          detail: 'Horizontal rule found. Remove the --- separator line.',
          context: trimmed
        });
      }
    }
  }
};
