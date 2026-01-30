import React, { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { Button } from './Button';

interface LatexPreviewProps {
  code: string;
}

export const LatexPreview: React.FC<LatexPreviewProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "resume.tex";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!code) return null;

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            LaTeX Gerado
          </span>
        </h2>
        <div className="flex space-x-2">
           <Button variant="outline" onClick={handleDownload} icon={<Download size={16} />} title="Baixar arquivo .tex">
            Baixar
          </Button>
          <Button variant={copied ? "primary" : "secondary"} onClick={handleCopy} icon={copied ? <Check size={16} /> : <Copy size={16} />}>
            {copied ? "Copiado!" : "Copiar Código"}
          </Button>
        </div>
      </div>

      <div className="relative group flex-grow">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
        <div className="relative w-full h-[600px] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
          <div className="flex items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            </div>
            <span className="ml-4 text-xs text-slate-500 font-mono">resume.tex</span>
          </div>
          <pre className="flex-grow p-4 overflow-auto text-sm font-mono text-emerald-100/90 custom-scrollbar">
            <code>{code}</code>
          </pre>
        </div>
      </div>
      <p className="mt-4 text-slate-400 text-sm text-center">
        Copie este código e cole no Overleaf ou editor LaTeX local para compilar o PDF.
      </p>
    </div>
  );
};