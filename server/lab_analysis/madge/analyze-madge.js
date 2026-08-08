const fs = require('fs');
const path = require('path');
let content = fs.readFileSync(path.join(__dirname, 'madge-output.json'));
let text = content.toString('utf16le');
if (text.charCodeAt(0) === 0xFEFF || text.charCodeAt(0) === 0xFFFE) {
    text = text.substring(1);
}

// In case it was somehow utf8
if (!text.startsWith('{')) {
    text = content.toString('utf8');
}

const data = JSON.parse(text);

const incomingCounts = {};

for (const [file, deps] of Object.entries(data)) {
  for (const dep of deps) {
    incomingCounts[dep] = (incomingCounts[dep] || 0) + 1;
  }
}

const sorted = Object.entries(incomingCounts).sort((a, b) => b[1] - a[1]);

console.log("Top files by incoming dependencies (Hubs):");
for (let i = 0; i < Math.min(20, sorted.length); i++) {
  console.log(`${sorted[i][1]} dependents: ${sorted[i][0]}`);
}
