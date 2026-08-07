import React from 'react';
import { ShieldCheck, Shuffle, ListChecks } from 'lucide-react';
import { AdaptationMode } from '../types';

interface LevelConfig {
  level: AdaptationMode;
  label: string;
  sublabel: string;
  description: string;
  icon: React.ReactNode;
  // classes condicionais quando selecionado
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
  selectedDot: string;
  // badge de risco
  riskLabel: string;
  riskClass: string;
}

const LEVELS: LevelConfig[] = [
  {
    level: AdaptationMode.FAITHFUL,
    label: 'Fiel',
    sublabel: 'Somente fatos',
    description:
      'Organiza e reescreve apenas as informações fornecidas, priorizando o que é relevante para a vaga.',
    icon: <ShieldCheck size={20} strokeWidth={1.8} />,
    selectedBg: 'bg-emerald-900/25',
    selectedBorder: 'border-emerald-500/60',
    selectedText: 'text-emerald-400',
    selectedDot: 'bg-emerald-400',
    riskLabel: 'Sem inferências',
    riskClass: 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30',
  },
  {
    level: AdaptationMode.STRATEGIC,
    label: 'Estratégico',
    sublabel: 'Competências reais',
    description:
      'Destaca competências reais e transferíveis com linguagem alinhada à vaga, sem adicionar qualificações.',
    icon: <Shuffle size={20} strokeWidth={1.8} />,
    selectedBg: 'bg-amber-900/25',
    selectedBorder: 'border-amber-500/60',
    selectedText: 'text-amber-400',
    selectedDot: 'bg-amber-400',
    riskLabel: 'Ênfase estratégica',
    riskClass: 'text-amber-400 bg-amber-900/30 border-amber-500/30',
  },
  {
    level: AdaptationMode.GAP_ANALYSIS,
    label: 'Análise de lacunas',
    sublabel: 'Identifica o que falta',
    description:
      'Adapta apenas os fatos confirmados e registra requisitos ausentes para orientar seus próximos passos.',
    icon: <ListChecks size={20} strokeWidth={1.8} />,
    selectedBg: 'bg-rose-900/25',
    selectedBorder: 'border-rose-500/60',
    selectedText: 'text-rose-400',
    selectedDot: 'bg-rose-400',
    riskLabel: 'Sem inventar fatos',
    riskClass: 'text-rose-400 bg-rose-900/30 border-rose-500/30',
  },
];

interface AdaptationModeSelectorProps {
  value: AdaptationMode;
  onChange: (level: AdaptationMode) => void;
  disabled?: boolean;
}

export const AdaptationModeSelector: React.FC<AdaptationModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          3. Nível de Adaptação
        </label>
        <span className="text-xs text-slate-500">Como o currículo será gerado</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LEVELS.map((cfg) => {
          const isSelected = value === cfg.level;
          return (
            <button
              key={cfg.level}
              onClick={() => !disabled && onChange(cfg.level)}
              disabled={disabled}
              className={`
                relative flex flex-col text-left p-4 rounded-xl border-2 transition-all duration-200 group
                focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  isSelected
                    ? `${cfg.selectedBg} ${cfg.selectedBorder}`
                    : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800/60'
                }
              `}
            >
              {/* Dot indicador de seleção */}
              <span
                className={`
                  absolute top-3 right-3 w-2 h-2 rounded-full transition-all duration-200
                  ${isSelected ? `${cfg.selectedDot} shadow-sm` : 'bg-slate-700'}
                `}
              />

              {/* Ícone + título */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`transition-colors ${
                    isSelected ? cfg.selectedText : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                >
                  {cfg.icon}
                </span>
                <span
                  className={`text-sm font-bold transition-colors ${
                    isSelected ? cfg.selectedText : 'text-slate-300'
                  }`}
                >
                  {cfg.label}
                </span>
              </div>

              {/* Badge de risco */}
              <span
                className={`
                  inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border mb-2
                  ${cfg.riskClass}
                `}
              >
                {cfg.riskLabel}
              </span>

              {/* Descrição */}
              <p className="text-xs text-slate-400 leading-relaxed">{cfg.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
