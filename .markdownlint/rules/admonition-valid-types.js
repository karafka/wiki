module.exports = {
  names: ['admonition-valid-types', 'mkdocs-admonition-valid-types'],
  description: 'MkDocs Material admonitions must use only allowed types',
  tags: ['admonitions', 'mkdocs'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    // Valid admonition types from MkDocs Material documentation
    const validTypes = [
      'note',
      'abstract',
      'info',
      'tip',
      'success',
      'question',
      'warning',
      'failure',
      'danger',
      'bug',
      'example',
      'quote'
    ];

    const lines = params.lines;
    const admonitionRegex = /^!!!?\s+(\S+)(?:\s|$)/;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const match = line.match(admonitionRegex);
      
      if (match) {
        const type = match[1];
        
        // Check if the type is valid
        if (!validTypes.includes(type)) {
          onError({
            lineNumber: lineIndex + 1,
            detail: `Invalid admonition type: "${type}". Valid types are: ${validTypes.join(', ')}`,
            context: line
          });
        }
      }
    }
  }
};