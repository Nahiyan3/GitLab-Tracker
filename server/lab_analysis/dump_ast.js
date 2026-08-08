const fs = require('fs');
const ts = require('typescript');

const filePath = '../src/services/project/projectSyncService.ts';
const code = fs.readFileSync(filePath, 'utf8');

// 1. Generate the AST
const sourceFile = ts.createSourceFile(
  filePath,
  code,
  ts.ScriptTarget.Latest,
  true
);

// 2. We can't easily stringify the raw TS AST because it has circular references (parent pointers).
// So we build a clean, readable version of the tree showing the structure.
function serializeAST(node) {
  const result = {
    kind: ts.SyntaxKind[node.kind],
  };
  
  // Try to capture identifiers/names so you can recognize your code
  if (node.name) result.name = node.name.text;
  if (node.text) result.text = node.text;
  
  const children = [];
  ts.forEachChild(node, child => {
    children.push(serializeAST(child));
  });
  
  if (children.length > 0) {
    result.children = children;
  }
  
  return result;
}

const simplifiedAST = serializeAST(sourceFile);

// 3. Save it to a file so you can explore it!
fs.writeFileSync('ast_output.json', JSON.stringify(simplifiedAST, null, 2));
console.log("AST successfully generated and saved to ast_output.json!");
