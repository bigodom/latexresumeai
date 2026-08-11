import React from 'react';
import {
  AlertCircle,
  BriefcaseBusiness,
  Check,
  Clock3,
  FileClock,
  History,
  RefreshCw,
} from 'lucide-react';
import { AdaptationMode, ResumeVersion } from '../types';

interface ResumeHistoryProps {
  versions: ResumeVersion[];
  selectedVersionId?: string;
  isLoading: boolean;
  error: string | null;
  onSelect: (version: ResumeVersion) => void;
  onRetry: () => void;
}

const modeLabels: Record<AdaptationMode, string> = {
  [AdaptationMode.FAITHFUL]: 'Fiel',
  [AdaptationMode.STRATEGIC]: 'Estratégico',
  [AdaptationMode.GAP_ANALYSIS]: 'Análise de lacunas',
};

const modeClasses: Record<AdaptationMode, string> = {
  [AdaptationMode.FAITHFUL]: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  [AdaptationMode.STRATEGIC]: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  [AdaptationMode.GAP_ANALYSIS]: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const HistorySkeleton = () => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
    {Array.from({ length: 4 }, (_, index) => (
      <div
        key={index}
        className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/45 p-4"
      >
        <div className="h-4 w-2/3 rounded bg-slate-800" />
        <div className="mt-3 h-3 w-1/2 rounded bg-slate-800/80" />
        <div className="mt-9 h-5 w-20 rounded-full bg-slate-800" />
      </div>
    ))}
  </div>
);

export const ResumeHistory: React.FC<ResumeHistoryProps> = ({
  versions,
  selectedVersionId,
  isLoading,
  error,
  onSelect,
  onRetry,
}) => (
  <section
    className="rounded-3xl border border-slate-800/80 bg-slate-900/35 p-5 shadow-2xl shadow-black/10 sm:p-7"
    aria-labelledby="history-title"
    aria-busy={isLoading}
  >
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-indigo-300">
          <History size={18} aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.18em]">Biblioteca</span>
        </div>
        <h2 id="history-title" className="text-xl font-bold text-white sm:text-2xl">
          Currículos salvos
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Consulte e reutilize as últimas versões geradas para suas candidaturas.
        </p>
      </div>
      {!isLoading && !error && versions.length > 0 && (
        <span className="text-xs text-slate-500">
          {versions.length} {versions.length === 1 ? 'versão recente' : 'versões recentes'}
        </span>
      )}
    </div>

    {isLoading && <HistorySkeleton />}

    {!isLoading && error && (
      <div
        className="flex flex-col items-start gap-4 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 sm:flex-row sm:items-center sm:justify-between"
        role="alert"
      >
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 shrink-0 text-amber-300" size={20} aria-hidden="true" />
          <div>
            <p className="font-semibold text-amber-100">Não foi possível carregar o histórico</p>
            <p className="mt-1 text-sm text-amber-100/70">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-400/30 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <RefreshCw size={15} aria-hidden="true" />
          Tentar novamente
        </button>
      </div>
    )}

    {!isLoading && !error && versions.length === 0 && (
      <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 px-5 py-8 text-center">
        <div className="mb-3 rounded-2xl border border-slate-700 bg-slate-800/70 p-3 text-slate-400">
          <FileClock size={26} aria-hidden="true" />
        </div>
        <p className="font-semibold text-slate-200">Seu primeiro currículo aparecerá aqui</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">
          Preencha seu perfil e a vaga acima. Cada geração concluída fica salva para consulta.
        </p>
      </div>
    )}

    {!isLoading && !error && versions.length > 0 && (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {versions.map((version) => {
          const selected = version.id === selectedVersionId;
          const mode = version.adaptationMode;
          const title = version.jobTitle || 'Currículo adaptado';

          return (
            <button
              key={version.id}
              type="button"
              onClick={() => onSelect(version)}
              aria-pressed={selected}
              aria-label={`${selected ? 'Versão selecionada' : 'Abrir versão'}: ${title}${
                version.company ? ` para ${version.company}` : ''
              }`}
              className={`group relative flex min-h-36 flex-col rounded-2xl border p-4 text-left transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                selected
                  ? 'border-indigo-400/70 bg-indigo-500/10 shadow-lg shadow-indigo-950/30'
                  : 'border-slate-800 bg-slate-950/45 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex w-full items-start justify-between gap-3">
                <span
                  className={`rounded-xl border p-2 ${
                    selected
                      ? 'border-indigo-400/30 bg-indigo-400/10 text-indigo-300'
                      : 'border-slate-700 bg-slate-800/70 text-slate-400 group-hover:text-slate-300'
                  }`}
                >
                  <BriefcaseBusiness size={17} aria-hidden="true" />
                </span>
                {selected && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300">
                    <Check size={13} aria-hidden="true" />
                    Aberto
                  </span>
                )}
              </div>

              <span className="mt-3 line-clamp-1 text-sm font-semibold text-slate-100">{title}</span>
              {version.company && (
                <span className="mt-0.5 line-clamp-1 text-xs text-slate-400">{version.company}</span>
              )}

              <span className="mt-auto flex items-end justify-between gap-2 pt-3">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock3 size={12} aria-hidden="true" />
                  {formatDate(version.createdAt)}
                </span>
                {mode && (
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${modeClasses[mode]}`}
                  >
                    {modeLabels[mode]}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    )}
  </section>
);
