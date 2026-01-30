import React, { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { extractTextFromPdf } from '../services/pdfService';

interface InputAreaProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  allowFileUpload?: boolean;
  onFileProcessingStart?: () => void;
  onFileProcessingEnd?: () => void;
  className?: string;
}

export const InputArea: React.FC<InputAreaProps> = ({
  label,
  placeholder,
  value,
  onChange,
  allowFileUpload = false,
  onFileProcessingStart,
  onFileProcessingEnd,
  className = ""
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("Por favor, envie um arquivo PDF.");
      return;
    }

    try {
      setError(null);
      setFileName(file.name);
      onFileProcessingStart?.();
      const result = await extractTextFromPdf(file);
      onChange(result.text);
    } catch (err) {
      console.error(err);
      setError("Falha ao ler PDF. Tente copiar o texto manualmente.");
      setFileName(null);
    } finally {
      onFileProcessingEnd?.();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearFile = () => {
    setFileName(null);
    onChange("");
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
        {allowFileUpload && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />
            {!fileName ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Upload size={14} className="mr-1" /> Importar PDF
              </button>
            ) : (
              <div className="flex items-center space-x-2 bg-indigo-900/30 px-2 py-1 rounded border border-indigo-500/30">
                <FileText size={14} className="text-indigo-400" />
                <span className="text-xs text-indigo-200 truncate max-w-[150px]">{fileName}</span>
                <button onClick={clearFile} className="text-slate-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
        <textarea
          className="relative w-full h-64 bg-slate-800/80 text-slate-200 p-4 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};