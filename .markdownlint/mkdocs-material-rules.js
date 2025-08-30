// Custom markdownlint rules for Material for MkDocs compatibility

module.exports = [{
  "names": ["mkdocs-material-admonition"],
  "description": "Validates Material for MkDocs admonition syntax",
  "tags": ["mkdocs", "admonitions"],
  "function": function rule(params, onError) {
    const validTypes = [
      "note", "abstract", "info", "tip", "success",
      "question", "warning", "failure", "danger",
      "bug", "example", "quote"
    ];

    const lines = params.lines;

    lines.forEach((line, lineIndex) => {
      const admonitionMatch = line.match(/^!!!\s+(\S+)(\s+"([^"]*)")?/);

      if (admonitionMatch) {
        const type = admonitionMatch[1];
        const title = admonitionMatch[3];

        // Check if type is valid and lowercase
        if (!validTypes.includes(type)) {
          // Check if it's a case issue
          if (validTypes.includes(type.toLowerCase())) {
            onError({
              "lineNumber": lineIndex + 1,
              "detail": `Admonition type "${type}" should be lowercase: "${type.toLowerCase()}"`,
              "context": line
            });
          } else {
            // Check for common mistakes
            let suggestion = type;
            if (type.toLowerCase() === "hint") suggestion = "tip";
            else if (type.toLowerCase() === "notice") suggestion = "note";
            else if (type.toLowerCase() === "caution") suggestion = "warning";
            else if (type.toLowerCase() === "error") suggestion = "failure";

            onError({
              "lineNumber": lineIndex + 1,
              "detail": `Invalid admonition type "${type}". ${suggestion !== type ? `Did you mean "${suggestion}"? ` : ""}Valid types: ${validTypes.join(", ")}`,
              "context": line
            });
          }
        }

        // Check for empty title (empty quotes)
        if (admonitionMatch[2] && title === "") {
          onError({
            "lineNumber": lineIndex + 1,
            "detail": "Admonition should not have empty quotes. Remove the quotes or add a title.",
            "context": line
          });
        }
      }
    });
  }
}];
