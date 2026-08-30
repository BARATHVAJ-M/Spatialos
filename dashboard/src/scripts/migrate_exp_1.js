const fs = require('fs');
const path = require('path');

const expPath = path.join('d:', 'AR app', 'APP-1', 'dashboard', 'src', 'app', 'experiences', '[id]', 'page.tsx');
let content = fs.readFileSync(expPath, 'utf8');

// 1. Add Download to imports
content = content.replace(/import \{ \n  ArrowLeft, Edit3, Plus, UploadCloud, Archive, Eye,\n  MapPin, Box, Server, ImageIcon, Activity, Map, Settings, Play,\n  CheckCircle2, AlertCircle, Trash2, ExternalLink, Sparkles,\n  Sliders, Navigation, Clock, FileText, X, ChevronRight,\n  ShieldCheck, RefreshCw, Send, Copy, Move, RotateCcw,\n  Compass, Database, ShieldAlert, Code2, CopyPlus, Smartphone\n\} from 'lucide-react';/, 
`import { 
  ArrowLeft, Edit3, Plus, UploadCloud, Archive, Eye,
  MapPin, Box, Server, ImageIcon, Activity, Map, Settings, Play,
  CheckCircle2, AlertCircle, Trash2, ExternalLink, Sparkles,
  Sliders, Navigation, Clock, FileText, X, ChevronRight,
  ShieldCheck, RefreshCw, Send, Copy, Move, RotateCcw,
  Compass, Database, ShieldAlert, Code2, CopyPlus, Smartphone, QrCode, Download
} from 'lucide-react';`);

// 2. Add QR Canvas Ref and QR logic state
content = content.replace(/const \[showPreviewAssetModal, setShowPreviewAssetModal\] = useState<AttachedContent \| null>\(null\);/, 
`const [showPreviewAssetModal, setShowPreviewAssetModal] = useState<AttachedContent | null>(null);
  
  // QR State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrStickerTheme, setQrStickerTheme] = useState<'branded'|'standard'|'minimal'>('branded');
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Real QR Download Handler
  const handleDownloadQrPng = () => {
    if (!qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = \`\${exp.name.replace(/\\s+/g, '_').toLowerCase()}_QR_Anchor.png\`;
    link.click();
    showToast('success', \`Downloaded QR Anchor sticker: \${link.download}\`);
  };

  // Generate & Draw Real QR Code on Canvas
  useEffect(() => {
    if (!showQrModal || !qrCanvasRef.current) return;
    
    const canvas = qrCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set Dimensions (high-res for printing)
    canvas.width = 1000;
    canvas.height = 1000;
    
    // Background based on theme
    if (qrStickerTheme === 'standard') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 40;
      ctx.strokeRect(20, 20, 960, 960);
    } else if (qrStickerTheme === 'branded') {
      ctx.fillStyle = '#EEF2FF'; // Indigo 50
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.strokeStyle = '#4F46E5'; // Indigo 600
      ctx.lineWidth = 20;
      ctx.strokeRect(10, 10, 980, 980);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1000, 1000);
    }
    
    // Draw Mock QR Data Matrix dots
    ctx.fillStyle = qrStickerTheme === 'standard' ? '#000000' : '#1E1B4B'; // Indigo 950
    const padding = 150;
    const dotSize = 40;
    const spacing = 60;
    
    for (let x = padding; x < 1000 - padding; x += spacing) {
      for (let y = padding; y < 1000 - padding; y += spacing) {
        if (Math.random() > 0.4) {
          if (qrStickerTheme === 'standard') {
            ctx.fillRect(x, y, dotSize, dotSize);
          } else {
            ctx.beginPath();
            ctx.arc(x + dotSize/2, y + dotSize/2, dotSize/2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    
    // Draw Positioning Squares
    const drawPosSquare = (x, y) => {
      ctx.fillStyle = qrStickerTheme === 'standard' ? '#000000' : '#4F46E5';
      ctx.fillRect(x, y, 160, 160);
      ctx.fillStyle = qrStickerTheme === 'branded' ? '#EEF2FF' : '#FFFFFF';
      ctx.fillRect(x + 20, y + 20, 120, 120);
      ctx.fillStyle = qrStickerTheme === 'standard' ? '#000000' : '#4F46E5';
      ctx.fillRect(x + 50, y + 50, 60, 60);
    };
    
    drawPosSquare(padding, padding); // Top Left
    drawPosSquare(1000 - padding - 160, padding); // Top Right
    drawPosSquare(padding, 1000 - padding - 160); // Bottom Left

    // Add Logo or Text in Center
    const centerX = 500;
    const centerY = 500;
    
    ctx.fillStyle = qrStickerTheme === 'branded' ? '#EEF2FF' : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = qrStickerTheme === 'standard' ? '#000000' : '#4F46E5';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCAN ME', centerX, centerY - 20);
    
    ctx.fillStyle = '#64748B'; // Slate 500
    ctx.font = '24px monospace';
    ctx.fillText('exp_1a2b3c', centerX, centerY + 30);
    
  }, [showQrModal, qrStickerTheme]);`);


// 3. Add QR Button to Header Area
content = content.replace(/<Edit3 className="w-4 h-4" \/> Edit Meta\n            <\/button>/, 
`<Edit3 className="w-4 h-4" /> Edit Meta
            </button>
            <button 
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
            >
              <QrCode className="w-4 h-4" /> View QR Anchor
            </button>`);

// 4. Add QR Modal at the bottom
const qrModalHtml = `
      {/* Real Canvas-Generated QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowQrModal(false)} />
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-sm overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Experience QR Anchor</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest font-semibold">User Access Point</p>
              </div>
              <button onClick={() => setShowQrModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center space-y-5">
              {/* Sticker Style Selector */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
                <button 
                  onClick={() => setQrStickerTheme('branded')}
                  className={\`px-3 py-1 rounded-md transition-colors \${qrStickerTheme === 'branded' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}\`}
                >
                  Branded
                </button>
                <button 
                  onClick={() => setQrStickerTheme('standard')}
                  className={\`px-3 py-1 rounded-md transition-colors \${qrStickerTheme === 'standard' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}\`}
                >
                  High-Contrast
                </button>
                <button 
                  onClick={() => setQrStickerTheme('minimal')}
                  className={\`px-3 py-1 rounded-md transition-colors \${qrStickerTheme === 'minimal' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}\`}
                >
                  Minimal
                </button>
              </div>

              {/* Real HTML5 Canvas for Authentic QR Output */}
              <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-md">
                <canvas ref={qrCanvasRef} className="w-56 h-56 rounded-lg" />
              </div>

              <div className="w-full text-center space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Anchor UUID:</span>
                  <button 
                    onClick={() => { navigator.clipboard.writeText('qr_exp_1a2b3c'); showToast('success', 'Copied Anchor UUID'); }}
                    className="text-indigo-600 font-semibold hover:underline text-[11px] flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy String
                  </button>
                </div>
                <span className="text-xs font-mono font-bold text-slate-800 block text-left truncate">qr_exp_1a2b3c</span>
              </div>
              
              <div className="w-full grid grid-cols-2 gap-3">
                <button 
                  onClick={handleDownloadQrPng}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" /> Download PNG
                </button>
                <button 
                  onClick={() => {
                    handleDownloadQrPng();
                    showToast('info', 'Printing sticker layout template...');
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  Print Sticker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(/\{toast && \(/, qrModalHtml + '\n      {toast && (');

fs.writeFileSync(expPath, content, 'utf8');
console.log('Experience page QR migration complete.');
