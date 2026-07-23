// Internal wiki links use the bare page slug: no path and no `.md` extension
// (for example ](Consumer-Groups-Routing)). The `.md`-suffixed form is only for
// the published llms.txt URLs, which are absolute http(s) links and are ignored
// here. Skips fenced code blocks.
module.exports = {
  names: ['no-md-link-extension'],
  description: 'Internal wiki links must not include the .md extension',
  tags: ['style', 'links'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    // The repo README is a GitHub file, not a wiki page - its links (for example
    // ](LICENSE.md)) follow GitHub file-link conventions, so skip it.
    if (/(^|\/)README\.md$/i.test(params.name || '')) {
      return;
    }
    const lines = params.lines;
    let inCodeBlock = false;
    const linkTarget = /\]\(([^)]+)\)/g;

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

      linkTarget.lastIndex = 0;
      let match;
      while ((match = linkTarget.exec(line)) !== null) {
        const target = match[1].trim();
        if (/^https?:/i.test(target)) {
          continue;
        }
        if (/\.md(#[^)]*)?$/i.test(target)) {
          onError({
            lineNumber: i + 1,
            detail: 'Internal link includes ".md". Use the bare wiki slug, e.g. ](Consumer-Groups-Routing).',
            context: match[0]
          });
        }
      }
    }
  }
};
