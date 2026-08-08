const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'jscpd-report', 'jscpd-report.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Regex to capture the file names and line numbers
const regex = /<div class="clone-info">\s*([^()]+) \(Line (\d+):\d+ - Line (\d+):\d+\),\s*([^()]+) \(Line (\d+):\d+ - Line (\d+):\d+\)\s*<\/div>\s*<div>\s*<button class="toggle-btn" onclick="toggle\('([^']+)'\)">Show code<\/button>\s*<\/div>\s*<pre id="[^"]+" class="code-block"><\/pre>/g;

let count = 0;
html = html.replace(regex, (match, file1, start1, end1, file2, start2, end2) => {
    file1 = file1.trim();
    file2 = file2.trim();
    try {
        let fullPath1 = path.join(__dirname, 'server', 'src', file1);
        if (!fs.existsSync(fullPath1)) fullPath1 = path.join(__dirname, 'client', 'src', file1);
        
        let fullPath2 = path.join(__dirname, 'server', 'src', file2);
        if (!fs.existsSync(fullPath2)) fullPath2 = path.join(__dirname, 'client', 'src', file2);

        const code1 = fs.readFileSync(fullPath1, 'utf8').split('\n').slice(parseInt(start1)-1, parseInt(end1)).join('\n');
        const code2 = fs.readFileSync(fullPath2, 'utf8').split('\n').slice(parseInt(start2)-1, parseInt(end2)).join('\n');
        
        let display = `// ====== ${file1} (Lines ${start1}-${end1}) ======\n${code1}\n\n// ====== ${file2} (Lines ${start2}-${end2}) ======\n${code2}`;
        // Escape HTML characters so the code displays properly
        display = display.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        count++;
        return match.replace('></pre>', `>${display}</pre>`);
    } catch (e) {
        console.error("Error reading files:", e);
        return match;
    }
});

fs.writeFileSync(htmlPath, html);
console.log(`Successfully injected source code for ${count} clones directly into the HTML!`);
