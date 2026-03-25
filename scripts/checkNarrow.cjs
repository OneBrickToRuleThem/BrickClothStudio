const fs = require('fs');

// Parse the second filled path from SingleHoleNarrow_Template.svg
const svg = fs.readFileSync('SingleHoleNarrow_Template.svg', 'utf-8');
const re = /(<path[^>]*?)d="([^"]+)"([^>]*>)/gs;
let match;
const filledPaths = [];
while ((match = re.exec(svg)) !== null) {
  const tag = match[1] + match[3];
  if (/fill:#000000|fill="black"|fill:#000\b/.test(tag)) {
    filledPaths.push(match[2]);
  }
}

console.log('Filled paths found:', filledPaths.length);
if (filledPaths.length >= 2) {
  console.log('\n=== Second filled path (Narrow variant shape?) ===');
  console.log('d length:', filledPaths[1].length);
  console.log('d:', filledPaths[1].substring(0, 300));
}

// Also look at the viewBox and dimensions again
const vb = svg.match(/viewBox="([^"]+)"/);
console.log('\nviewBox:', vb ? vb[1] : 'not found');
const w = svg.match(/width="([\d.]+)mm"/);
const h = svg.match(/height="([\d.]+)mm"/);
console.log('Size:', w?.[1], 'x', h?.[1], 'mm');

// Check if the second filled path is the actual "narrow" outline
// (it might be much smaller/different from the standard cape outline)
