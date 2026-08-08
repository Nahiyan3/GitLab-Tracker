const fs = require('fs');
const path = require('path');
const ts = require('typescript');

// Recursively find all .ts files in a directory
function getAllTsFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  
  const files = fs.readdirSync(dirPath);
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllTsFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

function analyzeAST(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true
  );

  let totalNodes = 0;
  let cyclomaticComplexity = 1;
  let functionCount = 0;
  let variableCount = 0; // NEW: Number of variables declared
  let anyTypeCount = 0; 
  let linesOfCode = code.split('\n').length;

  function visit(node) {
    totalNodes++;
    
    switch (node.kind) {
      // Complexity branches
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.CaseClause:
      case ts.SyntaxKind.CatchClause:
      case ts.SyntaxKind.ConditionalExpression:
        cyclomaticComplexity++;
        break;
      case ts.SyntaxKind.BinaryExpression:
        if (
          node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
          node.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
        ) {
          cyclomaticComplexity++;
        }
        break;
      
      // Function definitions
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.MethodDeclaration:
      case ts.SyntaxKind.ArrowFunction:
      case ts.SyntaxKind.FunctionExpression:
        functionCount++;
        break;

      // Variable definitions
      case ts.SyntaxKind.VariableDeclaration:
        variableCount++;
        break;

      // Type checking
      case ts.SyntaxKind.AnyKeyword:
        anyTypeCount++;
        break;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    file: filePath.split(path.sep + 'src' + path.sep)[1] || path.basename(filePath),
    linesOfCode,
    totalNodes,
    variableCount,
    functionCount,
    cyclomaticComplexity,
    anyTypeCount
  };
}

const srcDir = path.join(__dirname, '../src');
const allFiles = getAllTsFiles(srcDir);

const results = allFiles.map(analyzeAST);

// Sort by complexity descending
results.sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity);

console.log("=== ENHANCED AST ANALYSIS ===");
console.table(results.slice(0, 10));

const avgComplexity = results.reduce((acc, curr) => acc + curr.cyclomaticComplexity, 0) / results.length;
const totalLines = results.reduce((acc, curr) => acc + curr.linesOfCode, 0);
const totalVars = results.reduce((acc, curr) => acc + curr.variableCount, 0);

console.log(`\nMetrics Summary:`);
console.log(`- Files Analyzed: ${results.length}`);
console.log(`- Total Backend Lines of Code: ${totalLines}`);
console.log(`- Total Variables Declared: ${totalVars}`);
console.log(`- Average Cyclomatic Complexity: ${avgComplexity.toFixed(2)}`);

fs.writeFileSync('backend_ast_analysis.json', JSON.stringify(results, null, 2));
console.log("\nFull enhanced results saved to backend_ast_analysis.json");
