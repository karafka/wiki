// Custom markdownlint rule for Material for MkDocs admonition validation

"use strict";

const validTypes = [
  "note", "abstract", "info", "tip", "success", 
  "question", "warning", "failure", "danger", 
  "bug", "example", "quote"
];

const commonMistakes = {
  "hint": "tip",
  "notice": "note",
  "caution": "warning",
  "error": "failure",
  "attention": "warning"
};

module.exports = {
  "names": ["mkdocs-material-admonitions"],
  "description": "Material for MkDocs admonition syntax validation",
  "tags": ["mkdocs", "admonitions"],
  "function": function rule(params, onError) {
    const lines = params.lines;
    
    lines.forEach((line, lineIndex) => {
      const admonitionMatch = line.match(/^!!!\s+(\S+)(\s+"([^"]*)")?/);
      
      if (admonitionMatch) {
        const type = admonitionMatch[1];
        const title = admonitionMatch[3];
        
        // Check if type is valid
        if (!validTypes.includes(type)) {
          // Check if it's a case issue
          if (validTypes.includes(type.toLowerCase())) {
            onError({
              "lineNumber": lineIndex + 1,
              "detail": `Admonition type "${type}" should be lowercase: "${type.toLowerCase()}"`,
              "context": line,
              "fixInfo": {
                "lineNumber": lineIndex + 1,
                "editColumn": line.indexOf(type) + 1,
                "deleteCount": type.length,
                "insertText": type.toLowerCase()
              }
            });
          } else {
            // Check for common mistakes
            const suggestion = commonMistakes[type.toLowerCase()] || 
                             commonMistakes[type] ||
                             (validTypes.includes(type.toLowerCase()) ? type.toLowerCase() : null);
            
            onError({
              "lineNumber": lineIndex + 1,
              "detail": `Invalid admonition type "${type}".${suggestion ? ` Did you mean "${suggestion}"?` : ''} Valid types: ${validTypes.join(", ")}`,
              "context": line,
              "fixInfo": suggestion ? {
                "lineNumber": lineIndex + 1,
                "editColumn": line.indexOf(type) + 1,
                "deleteCount": type.length,
                "insertText": suggestion
              } : null
            });
          }
        }
        
        // Check for empty title (empty quotes)
        if (admonitionMatch[2] && title === "") {
          const quotesMatch = line.match(/\s+""/);
          if (quotesMatch) {
            onError({
              "lineNumber": lineIndex + 1,
              "detail": "Admonition should not have empty quotes. Remove the quotes or add a title.",
              "context": line,
              "fixInfo": {
                "lineNumber": lineIndex + 1,
                "editColumn": line.indexOf(' ""') + 1,
                "deleteCount": 3,
                "insertText": ""
              }
            });
          }
        }
      }
    });
  }
};