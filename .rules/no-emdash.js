module.exports = {
  names: ['no-emdash'],
  description: 'Em dashes are not allowed - use a regular hyphen instead',
  tags: ['style'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    const lines = params.lines;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('—')) {
        onError({
          lineNumber: i + 1,
          detail: 'Em dash found. Use a regular hyphen (-) instead.',
          context: line.trim()
        });
      }
    }
  }
};
