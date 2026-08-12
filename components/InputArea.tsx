import React, { useId, useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { extractTextFromPdf, MAX_PDF_SIZE_BYTES } from '../services/pdfService';

interface InputAreaProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  allowFileUpload?: boolean;
  onFileProcessingStart?: () => void;
  onFileProcessingEnd?: () => void;
  className?: string;
  textareaClassName?: string;
  maxLength?: number;
  helperText?: string;
}

export const InputArea: React.FC<InputAreaProps> = ({
  label,
  placeholder,
  value,
  onChange,
  allowFileUpload = false,
  onFileProcessingStart,
  onFileProcessingEnd,
  className = "",
  textareaClassName = '',
  maxLength,
  helperText,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaId = useId();
  const errorId = `${textareaId}-error`;
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type && file.type !== 'application/pdf') {
      setError("Por favor, envie um arquivo PDF.");
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      setError('O PDF deve ter no máximo 5 MB.');
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
      setError(err instanceof Error ? err.message : 'Falha ao ler PDF. Tente copiar o texto manualmente.');
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
        <label htmlFor={textareaId} className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
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
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center rounded text-xs text-indigo-400 transition-colors hover:text-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Upload size={14} className="mr-1" /> Importar PDF
              </button>
            ) : (
              <div className="flex items-center space-x-2 bg-indigo-900/30 px-2 py-1 rounded border border-indigo-500/30">
                <FileText size={14} className="text-indigo-400" />
                <span className="text-xs text-indigo-200 truncate max-w-[150px]">{fileName}</span>
                <button
                  type="button"
                  onClick={clearFile}
                  className="rounded text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  aria-label={`Remover arquivo ${fileName}`}
                >
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
          id={textareaId}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className={`relative h-64 w-full resize-none rounded-xl border border-slate-700 bg-slate-800/80 p-4 font-mono text-sm leading-relaxed text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${textareaClassName}`}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {error && <p id={errorId} className="mt-1 text-xs text-red-400" role="alert">{error}</p>}
      <div className="flex items-start justify-between gap-3 text-xs text-slate-500">
        {helperText ? <p className="leading-relaxed">{helperText}</p> : <span />}
        {maxLength && (
          <span className="shrink-0 tabular-nums" aria-label={`${value.length} de ${maxLength} caracteres`}>
            {value.length.toLocaleString('pt-BR')}/{maxLength.toLocaleString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
};
