const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'AR app', 'APP-1', 'dashboard', 'src', 'app', 'places', '[id]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace(/QrCode, /g, '');

// 2. place state
content = content.replace(/\s*qrId:\s*'[^']+',\n/, '\n');

// 3. spatialConfig state
content = content.replace(/anchorType:\s*'Physical QR Code Sticker',/, "anchorType: 'LiDAR Point Cloud Mesh',");
content = content.replace(/\s*qrDimension:\s*'[^']+',\n/, '\n');

// 4. State hooks
content = content.replace(/\s*const \[showQrModal, setShowQrModal\] = useState\(false\);\n/, '\n');
content = content.replace(/\s*const \[qrStickerTheme, setQrStickerTheme\] = useState<[^>]+>\('branded'\);\n/, '\n');

// 5. refs and hooks
content = content.replace(/\s*\/\/ Canvas Reference for Real QR Generation & Download\n\s*const qrCanvasRef = useRef<HTMLCanvasElement \| null>\(null\);\n/, '\n');

const useEffectRegex = /\s*\/\/ Generate & Draw Real QR Code on Canvas[\s\S]*?\}, \[showQrModal, qrStickerTheme, place\.qrId\]\);\n/;
content = content.replace(useEffectRegex, '\n');

const downloadRegex = /\s*\/\/ Real QR Download Handler[\s\S]*?showToast\('success', `Downloaded QR Anchor sticker: \$\{link\.download\}`\);\n\s*\}\n/;
content = content.replace(downloadRegex, '\n');

// 6. JSON Export
content = content.replace(/anchorId:\s*place\.qrId,/, "anchorId: place.systemId,");

// 7. Header badges
const headerBadgeRegex = /\s*<span>Anchor ID: <strong className="text-slate-700">\{place\.qrId\}<\/strong><\/span>\n\s*<span>•<\/span>\n/;
content = content.replace(headerBadgeRegex, '\n');

// 8. Download button
const downloadBtnRegex = /\s*<button\s*onClick=\{[^}]+\}\s*className="[^"]+"\s*title="Download Physical QR Code Sticker"\s*>\s*<QrCode className="w-4 h-4" \/> Download QR\s*<\/button>\n/;
content = content.replace(downloadBtnRegex, '\n');

// 9. Spatial Anchor Card
content = content.replace(/<h3 className="text-base font-bold text-slate-900 flex items-center gap-2">\s*<QrCode className="w-4 h-4 text-indigo-500" \/>\s*Spatial Anchor & Geolocation\s*<\/h3>/, '<h3 className="text-base font-bold text-slate-900 flex items-center gap-2">\n                  <Map className="w-4 h-4 text-indigo-500" />\n                  Spatial Anchor & Geolocation\n                </h3>');

const qrIdBoxRegex = /\s*<div className="p-3\.5 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-between">[\s\S]*?<\/div>\n\s*<\/div>/;
content = content.replace(qrIdBoxRegex, '');

// 10. Options
content = content.replace(/\s*<option value="Physical QR Code Sticker">Physical QR Code Sticker \(Standard Marker\)<\/option>\n/, '\n');

// 11. qrDimension Input
const dimensionInputRegex = /\s*<div>\s*<label className="block text-xs font-bold text-slate-700 mb-1\.5">QR Code Dimension<\/label>\s*<input\s*type="text"\s*value=\{spatialConfig\.qrDimension\}[\s\S]*?<\/div>\n/;
content = content.replace(dimensionInputRegex, '\n');

// 12. Modal removal
const modalRegex = /\s*\{\/\* 1\. Real Canvas-Generated QR Code Modal \*\/\}(.|\n)*?\s*\}\)/;
content = content.replace(modalRegex, '\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleanup script completed successfully.');
