const fs = require('fs');
const files = ['SingleHoleNarrow_Template.svg', 'SingleHoleTop_template.svg', 'SteppedShoulderSingleHole_Template.svg'];

for (const file of files) {
  console.log('\n=== ' + file + ' ===');
  const svg = fs.readFileSync(file, 'utf-8');
  
  // Find all path d attributes
  const re = /(<path[^>]*?)d="([^"]+)"([^>]*>)/gs;
  let match;
  let idx = 0;
  while ((match = re.exec(svg)) !== null) {
    const before = match[1];
    const d = match[2];
    const after = match[3];
    const fullTag = before + 'd="..."' + after;
    const hasFill = /fill:#000000|fill="black"|fill:#000\b/.test(before + after);
    const isCutLine = /class="cut-line"/.test(before + after);
    console.log(`  Path ${idx}: fill=${hasFill}, cutLine=${isCutLine}`);
    console.log(`    d length: ${d.length}, starts: ${d.substring(0, 60)}`);
    console.log(`    tag snippet: ${fullTag.substring(0, 120)}`);
    idx++;
  }
}
