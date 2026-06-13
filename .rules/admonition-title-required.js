module.exports = {
  names: ['admonition-title-required'],
  description: 'Admonitions must have a quoted title string',
  tags: ['material-mkdocs', 'admonitions'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    const lines = params.lines;
    // Matches !!! type or ???[+] type with nothing after (no quoted title)
    const missingTitle = /^(?:!!!|\?\?\?\+?)\s+\w+\s*$/;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (missingTitle.test(trimmed)) {
        onError({
          lineNumber: i + 1,
          detail: 'Admonition is missing a title. Add a quoted title string, e.g. "Note".',
          context: trimmed
        });
      }
    }
  }
};
