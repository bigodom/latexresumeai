import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FileText,
  Info,
  LogOut,
  Save,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  BaseResume,
  MAX_BASE_RESUME_LENGTH,
  saveBaseResume,
} from '../services/baseResumeService';
import { Button } from './Button';
import { InputArea } from './InputArea';

interface BaseResumePageProps {
  resume: BaseResume;
  onSaved: (resume: BaseResume) => void;
  onOpenGenerator: () => void;
}

const formatUpdatedAt = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const BaseResumePage: React.FC<BaseResumePageProps> = ({
  resume,
  onSaved,
  onOpenGenerator,
}) => {
  const { user, logout } = useAuth();
  const [draft, setDraft] = useState(resume.text);
  const [pendingAction, setPendingAction] = useState<'save' | 'continue' | null>(null);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => setDraft(resume.text), [resume.text]);

  const normalizedDraft = draft.trim();
  const isDirty = normalizedDraft !== resume.text;
  const savedAt = useMemo(() => formatUpdatedAt(resume.updatedAt), [resume.updatedAt]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [isDirty]);

  const persistResume = async (action: 'save' | 'continue') => {
    setPendingAction(action);
    setError(null);
    setSuccessMessage(null);
    try {
      const savedResume = await saveBaseResume(draft);
      onSaved(savedResume);
      setDraft(savedResume.text);
      return savedResume;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar seu currículo.');
      return null;
    } finally {
      setPendingAction(null);
    }
  };

  const handleSave = async () => {
    const savedResume = await persistResume('save');
    if (savedResume) setSuccessMessage('Currículo base salvo com sucesso.');
  };

  const handleOpenGenerator = async () => {
    if (!normalizedDraft) {
      setError('Adicione e salve seu currículo base antes de gerar uma versão para uma vaga.');
      return;
    }
    if (isDirty || !resume.text) {
      const savedResume = await persistResume('continue');
      if (!savedResume) return;
    }
    onOpenGenerator();
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 selection:bg-indigo-500/30">
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-600 p-2 shadow-lg shadow-indigo-500/20">
              <FileText className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <h1 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-xl font-bold text-transparent">
              LatexResume<span className="text-indigo-400">AI</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 sm:flex">
              <Zap size={14} className="mr-2 text-yellow-400" aria-hidden="true" />
              <span className="text-sm font-bold text-white">{user?.credits ?? 0}</span>
              <span className="ml-1 text-xs text-slate-400">créditos</span>
            </div>
            <div className="hidden flex-col items-end md:flex">
              <span className="text-sm font-medium text-white">{user?.name}</span>
              <span className="text-xs text-slate-500">{user?.email}</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-indigo-400">
              <UserIcon size={16} aria-hidden="true" />
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Sair da conta"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-indigo-300">
            <Sparkles size={16} aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Seu ponto de partida</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight text-white md:text-4xl">
            Mantenha um <span className="text-indigo-400">currículo base</span> pronto para cada oportunidade.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Importe seu PDF uma vez, revise o texto extraído e mantenha as informações atualizadas. Ao abrir o gerador, este conteúdo já estará preenchido.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)] lg:gap-8">
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-2xl shadow-black/10 sm:p-7" aria-labelledby="base-resume-title">
            <div className="mb-6 flex flex-col gap-3 border-b border-slate-800 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck2 size={20} className="text-indigo-300" aria-hidden="true" />
                  <h3 id="base-resume-title" className="text-xl font-bold text-white">Meu currículo base</h3>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {savedAt ? `Última atualização em ${savedAt}.` : 'Você ainda não salvou um currículo base.'}
                </p>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                isDirty
                  ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
                  : resume.text
                    ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}>
                {isDirty ? 'Alterações não salvas' : resume.text ? 'Salvo' : 'Não configurado'}
              </span>
            </div>

            <InputArea
              label="Conteúdo do currículo"
              placeholder="Importe um PDF ou cole aqui suas experiências, formação, habilidades e dados de contato..."
              value={draft}
              onChange={(value) => {
                setDraft(value);
                setError(null);
                setSuccessMessage(null);
              }}
              allowFileUpload
              maxLength={MAX_BASE_RESUME_LENGTH}
              textareaClassName="h-[430px] sm:h-[520px]"
              helperText="O PDF é processado no navegador; somente o texto que você revisar e salvar é armazenado."
              onFileProcessingStart={() => {
                setIsReadingPdf(true);
                setError(null);
              }}
              onFileProcessingEnd={() => setIsReadingPdf(false)}
            />

            <div className="mt-5 min-h-6" aria-live="polite">
              {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
              {successMessage && (
                <p className="flex items-center gap-2 text-sm text-emerald-300">
                  <CheckCircle2 size={16} aria-hidden="true" />
                  {successMessage}
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSave()}
                disabled={!normalizedDraft || !isDirty || isReadingPdf || pendingAction !== null}
                isLoading={pendingAction === 'save'}
                icon={<Save size={17} aria-hidden="true" />}
              >
                Salvar alterações
              </Button>
              <Button
                type="button"
                onClick={() => void handleOpenGenerator()}
                disabled={!normalizedDraft || isReadingPdf || pendingAction !== null}
                isLoading={pendingAction === 'continue'}
                icon={<ArrowRight size={18} aria-hidden="true" />}
              >
                {isDirty || !resume.text ? 'Salvar e gerar para uma vaga' : 'Gerar para uma vaga'}
              </Button>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/10 p-5 sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-300">
                <Zap size={22} aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Depois de salvar</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                No gerador você precisará informar apenas a vaga e escolher o modo de adaptação. O currículo base continuará editável para aquela geração.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/45 p-5 sm:p-6">
              <div className="flex gap-3">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-white">Revise a extração</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    PDFs com colunas podem ter texto fora de ordem. Confira datas, cargos e contatos antes de salvar.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 text-sm text-slate-500">
              <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>O currículo base não consome créditos. Um crédito é usado somente ao gerar uma versão para uma vaga.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
