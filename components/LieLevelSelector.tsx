import React from 'react';
import { ShieldCheck, Shuffle, Flame } from 'lucide-react';
import { LieLevel } from '../types';

interface LevelConfig {
  level: LieLevel;
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
    level: LieLevel.HONEST,
    label: 'Honesto',
    sublabel: '100% real',
    description:
      'Reescreve seu currículo com as palavras-chave exatas da vaga sem inventar nada. Máxima pontuação ATS com suas informações reais.',
    icon: <ShieldCheck size={20} strokeWidth={1.8} />,
    selectedBg: 'bg-emerald-900/25',
    selectedBorder: 'border-emerald-500/60',
    selectedText: 'text-emerald-400',
    selectedDot: 'bg-emerald-400',
    riskLabel: 'Sem risco',
    riskClass: 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30',
  },
  {
    level: LieLevel.ADAPTED,
    label: 'Adaptado',
    sublabel: 'Transferência de skills',
    description:
      'Faz ponte inteligente entre suas habilidades e a vaga. Ex: Java API → apresentado como dev de APIs RESTful cobrindo Node.js.',
    icon: <Shuffle size={20} strokeWidth={1.8} />,
    selectedBg: 'bg-amber-900/25',
    selectedBorder: 'border-amber-500/60',
    selectedText: 'text-amber-400',
    selectedDot: 'bg-amber-400',
    riskLabel: 'Baixo risco',
    riskClass: 'text-amber-400 bg-amber-900/30 border-amber-500/30',
  },
  {
    level: LieLevel.AUDACIOUS,
    label: 'Audacioso',
    sublabel: 'Adapta 100% à vaga',
    description:
      'Alinha completamente o currículo à vaga, adicionando skills e experiências exigidas. Máxima compatibilidade ATS.',
    icon: <Flame size={20} strokeWidth={1.8} />,
    selectedBg: 'bg-rose-900/25',
    selectedBorder: 'border-rose-500/60',
    selectedText: 'text-rose-400',
    selectedDot: 'bg-rose-400',
    riskLabel: 'Alto risco',
    riskClass: 'text-rose-400 bg-rose-900/30 border-rose-500/30',
  },
];

interface LieLevelSelectorProps {
  value: LieLevel;
  onChange: (level: LieLevel) => void;
  disabled?: boolean;
}

export const LieLevelSelector: React.FC<LieLevelSelectorProps> = ({
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
