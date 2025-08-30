module.exports = {
  names: ['admonition-no-empty-title', 'mkdocs-admonition-no-empty-title'],
  description: 'MkDocs Material admonitions must not have empty titles ("") - use no title instead',
  tags: ['admonitions', 'mkdocs'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    const lines = params.lines;
    // Match admonitions with empty title quotes
    const emptyTitleRegex = /^!!!?\s+\S+\s+\"\"\s*$/;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      if (emptyTitleRegex.test(line)) {
        onError({
          lineNumber: lineIndex + 1,
          detail: 'Admonition has empty title (""). Remove the quotes entirely if no title is needed.',
          context: line
        });
      }
    }
  }
};