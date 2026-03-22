const fs = require('fs');
const path = require('path');

function tokenizePath(d) {
  d = d.replace(/[\n\r\t]/g, ' ');
  const tokens = [];
  let i = 0;
  
  while (i < d.length) {
    const ch = d[i];
    if (ch === ' ' || ch === ',') { i++; continue; }
    if (/[a-zA-Z]/.test(ch)) { tokens.push(ch); i++; continue; }
    if (ch === '-' || ch === '+' || ch === '.' || /\d/.test(ch)) {
      let num = '';
      if (ch === '-' || ch === '+') { num += ch; i++; }
      while (i < d.length && /\d/.test(d[i])) { num += d[i]; i++; }
      if (i < d.length && d[i] === '.') {
        num += d[i]; i++;
        while (i < d.length && /\d/.test(d[i])) { num += d[i]; i++; }
      }
      if (num && num !== '-' && num !== '+' && num !== '.') {
        tokens.push(parseFloat(num));
      } else {
        console.log('BAD TOKEN at pos ' + i + ': "' + num + '" context: "' + d.substring(Math.max(0,i-10), i+10) + '"');
      }
      continue;
    }
    i++;
  }
  return tokens;
}

const svg = fs.readFileSync('AsymetricCapeTemplate.svg', 'utf8');
const dMatch = svg.match(/\bd="([\s\S]*?)"/);
const d = dMatch[1];

console.log('Path d length:', d.length);
console.log('First 200 chars:', d.substring(0, 200));

const tokens = tokenizePath(d);
console.log('Total tokens:', tokens.length);

// Show first 30 tokens
console.log('First 30 tokens:', tokens.slice(0, 30));

// Check for any NaN tokens
const nanIdx = tokens.findIndex(t => typeof t === 'number' && isNaN(t));
console.log('First NaN at index:', nanIdx);
if (nanIdx >= 0) {
  console.log('Context around NaN:', tokens.slice(Math.max(0, nanIdx-5), nanIdx+5));
}

// Also check: count number vs string tokens
const nums = tokens.filter(t => typeof t === 'number');
const strs = tokens.filter(t => typeof t === 'string');
console.log('Number tokens:', nums.length, ' Command tokens:', strs.length);
console.log('Commands:', strs.join(' '));

// Check which numbers are NaN
const nanNums = nums.map((n, i) => isNaN(n) ? i : -1).filter(i => i >= 0);
console.log('NaN number indices:', nanNums.length > 0 ? nanNums.slice(0, 10) : 'none');
