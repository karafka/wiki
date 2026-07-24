// Shared helper for the Karafka STE lint rules.
//
// Returns a Set of 1-indexed line numbers that fall inside fenced or indented
// code blocks, derived from the markdown-it token stream (rules declare
// `parser: 'markdownit'`). This replaces naive fence toggling
// (`/^(`{3,}|~{3,})/` flipping a boolean), which has two bugs:
//   - mixed fences: a ``` line inside a ~~~ block wrongly flips the state;
//   - indented code: 4-space code blocks have no fence and are missed entirely.
// Token `map` is [startLine, endLine) 0-indexed; both fence and code_block
// tokens cover the whole block including the fence lines.
module.exports = function codeLines(params) {
  const set = new Set();
  const md = params && params.parsers && params.parsers.markdownit;
  const tokens = (md && md.tokens) || [];
  for (const token of tokens) {
    if (
      (token.type === 'fence' || token.type === 'code_block') &&
      Array.isArray(token.map)
    ) {
      for (let ln = token.map[0] + 1; ln <= token.map[1]; ln++) {
        set.add(ln);
      }
    }
  }
  return set;
};
