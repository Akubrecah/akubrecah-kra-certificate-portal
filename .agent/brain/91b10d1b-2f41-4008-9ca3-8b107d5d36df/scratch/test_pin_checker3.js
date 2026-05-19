const fs = require('fs');
const html = fs.readFileSync('/Users/Akubrecah/Desktop/Akubrecah KRA/.agent/brain/91b10d1b-2f41-4008-9ca3-8b107d5d36df/scratch/kra_html.html', 'utf8');

const regex = />\s*(\d{2}\/\d{2}\/\d{4})\s*<\/td>/g;
const matches = [...html.matchAll(regex)];
console.log("All dates found in HTML:");
matches.forEach((m, i) => console.log(`[${i}] ${m[1]}`));

const textRegex = />([^<]+)</g;
const textMatches = [...html.matchAll(textRegex)].map(m => m[1].trim()).filter(Boolean);
console.log("Some relevant text around dates:");
const dateIndices = textMatches.map((t, i) => t.match(/^\d{2}\/\d{2}\/\d{4}$/) ? i : -1).filter(i => i !== -1);
for (const idx of dateIndices) {
  console.log(`Context for ${textMatches[idx]}:`, textMatches.slice(Math.max(0, idx - 5), idx + 2).join(" | "));
}
