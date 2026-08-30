const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'AR app', 'APP-1', 'dashboard', 'src', 'app', 'places', '[id]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove handleDownloadQrPng completely
content = content.replace(/\s*\/\/ Real QR Download Handler[\s\S]*?showToast\('success', `Downloaded QR Anchor sticker: \$\{link\.download\}`\);\n\s*\}/g, '');
content = content.replace(/\s*const handleDownloadQrPng = \(\) => \{[\s\S]*?showToast\('success', `Downloaded QR Anchor sticker: \$\{link\.download\}`\);\n\s*\};/g, '');

// Remove qrDimension input block
content = content.replace(/\s*<div>\s*<label className="block text-xs font-bold text-slate-700 mb-1\.5">QR Code Dimension<\/label>[\s\S]*?<\/div>/g, '');

// Remove the modal entirely (from showQrModal conditional rendering)
// Just look for `{showQrModal && (` or similar and remove the whole block.
// Since it's hard to match JSX with regex, I'll remove lines containing qrStickerTheme, showQrModal, qrCanvasRef
let lines = content.split('\n');
let newLines = [];
let skipModal = false;
let openBrackets = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Remove place.qrId references
  if (line.includes('Anchor ID: {place.qrId}')) continue;
  if (line.includes('Physical QR Code Anchor: {place.qrId}')) continue;
  if (line.includes('qrDimension: e.target.value')) continue;
  
  if (line.includes('{showQrModal && (')) {
    skipModal = true;
    openBrackets = 1; // 1 for the first parenthesis
    continue;
  }

  if (skipModal) {
    // Basic counting to find the end of the modal.
    if (line.includes('(')) openBrackets += (line.match(/\(/g) || []).length;
    if (line.includes(')')) openBrackets -= (line.match(/\)/g) || []).length;
    if (openBrackets <= 0) {
      skipModal = false;
    }
    continue;
  }

  if (line.includes('qrCanvasRef')) continue;
  if (line.includes('qrStickerTheme')) continue;
  if (line.includes('showQrModal')) continue;
  if (line.includes('handleDownloadQrPng')) continue;

  newLines.push(line);
}

content = newLines.join('\n');

// Also remove any dangling `{/* Real HTML5 Canvas for Authentic QR Output */}`
content = content.replace(/\s*\{\/\* Real HTML5 Canvas for Authentic QR Output \*\/\}/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Second pass cleanup script completed.');
