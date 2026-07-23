// Admonitions must have a DESCRIPTIVE title that states the takeaway, not the
// bare type word (for example !!! note "Note"). Complements admonition-title-required,
// which only checks that a title exists. Skips fenced code blocks.
module.exports = {
  names: ['no-generic-admonition-title'],
  description: 'Admonition titles must be descriptive, not the bare type word',
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
      if (match && match[2].trim().toLowerCase() === match[1].toLowerCase()) {
        onError({
          lineNumber: i + 1,
          detail: `Admonition title "${match[2]}" just repeats the type. Use a descriptive title that states the takeaway.`,
          context: trimmed
        });
      }
    }
  }
};
