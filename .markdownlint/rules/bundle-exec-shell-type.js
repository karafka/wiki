module.exports = {
  names: ['bundle-exec-shell-type', 'code-block-bundle-exec-shell'],
  description: 'Code blocks starting with "bundle exec" must have shell language type',
  tags: ['code', 'language'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    const lines = params.lines;
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      // Check if this line starts a code block
      if (line.startsWith('```')) {
        // Extract the language specifier (if any)
        const langSpec = line.substring(3).trim().toLowerCase();
        
        // Check if the next line exists and starts with "bundle exec"
        if (lineIndex + 1 < lines.length) {
          const nextLine = lines[lineIndex + 1].trim();
          
          if (nextLine.startsWith('bundle exec')) {
            // Check if language is not shell, sh, or bash
            if (langSpec !== '' && langSpec !== 'shell' && langSpec !== 'sh' && langSpec !== 'bash') {
              onError({
                lineNumber: lineIndex + 1,
                detail: `Code block with "bundle exec" should use shell language type (found: "${langSpec || 'none'}")`,
                context: line,
                fixInfo: {
                  lineNumber: lineIndex + 1,
                  deleteCount: line.length,
                  insertText: '```shell'
                }
              });
            } else if (langSpec === '') {
              // No language specified
              onError({
                lineNumber: lineIndex + 1,
                detail: 'Code block with "bundle exec" should use shell language type (found: no language)',
                context: line,
                fixInfo: {
                  lineNumber: lineIndex + 1,
                  deleteCount: line.length,
                  insertText: '```shell'
                }
              });
            }
          }
        }
      }
    }
  }
};