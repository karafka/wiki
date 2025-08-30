module.exports = {
  names: ['shell-language-standardization', 'use-shell-not-bash-sh'],
  description: 'Use "shell" instead of "bash" or "sh" for shell code blocks',
  tags: ['code', 'language', 'standardization'],
  parser: 'markdownit',
  function: function rule(params, onError) {
    const lines = params.lines;
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      // Check if this line starts a code block
      if (line.startsWith('```')) {
        // Extract the language specifier (if any)
        const langSpec = line.substring(3).trim().toLowerCase();
        
        // Check if language is bash or sh
        if (langSpec === 'bash' || langSpec === 'sh') {
          onError({
            lineNumber: lineIndex + 1,
            detail: `Use "shell" instead of "${langSpec}" for standardization`,
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
};