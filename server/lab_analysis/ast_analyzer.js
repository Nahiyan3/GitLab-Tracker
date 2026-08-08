const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function analyzeAST(filePath) {
  if (!fs.existsSync(filePath)) {
    return { file: path.basename(filePath), error: "File not found" };
  }
  const code = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true
  );

  let totalNodes = 0;
  let cyclomaticComplexity = 1;

  function visit(node) {
    totalNodes++;
    
    switch (node.kind) {
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
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    file: path.basename(filePath),
    totalNodes,
    cyclomaticComplexity
  };
}

const files = [
  './src/services/project/projectSyncService.ts',
  './src/services/issueMetrics/issueMetricsDbService.ts',
  './src/controllers/healthScoreController.ts'
];

const results = files.map(f => analyzeAST(path.join(__dirname, f)));
console.log(JSON.stringify(results, null, 2));
