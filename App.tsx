import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Briefcase,
  ChevronRight,
  Wand2,
  LogOut,
  User as UserIcon,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { InputArea } from './components/InputArea';
import { LatexPreview } from './components/LatexPreview';
import { Button } from './components/Button';
import { AdaptationModeSelector } from './components/LieLevelSelector';
import {
  generateResumeLatex,
  listResumeVersions,
} from './services/resumeService';
import { AdaptationMode, GenerationStatus, ResumeVersion } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { ResumeHistory } from './components/ResumeHistory';
import { BaseResumePage } from './components/BaseResumePage';
import { BaseResume, loadBaseResume } from './services/baseResumeService';

interface ResumeBuilderProps {
  baseResumeText: string;
  onBackToBaseResume: () => void;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ baseResumeText, onBackToBaseResume }) => {
  const { user, logout, refreshUser } = useAuth();
  const [profileText, setProfileText] = useState(baseResumeText);
  const [jobDescription, setJobDescription] = useState('');
  const [adaptationMode, setAdaptationMode] = useState<AdaptationMode>(AdaptationMode.FAITHFUL);
  const [generatedLatex, setGeneratedLatex] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<ResumeVersion | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<ResumeVersion[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      setHistory(await listResumeVersions());
      setHistoryError(null);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Não foi possível carregar o histórico.');
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const isGenerating =
    status === GenerationStatus.GENERATING || status === GenerationStatus.READING_PDF;

  const handleGenerate = async () => {
    if (!profileText.trim() || !jobDescription.trim()) {
      setErrorMsg('Por favor, forneça os detalhes do seu perfil e a descrição da vaga.');
      return;
    }

    setStatus(GenerationStatus.GENERATING);
    setErrorMsg(null);
    setGeneratedLatex('');
    setSelectedVersion(null);

    try {
      const result = await generateResumeLatex(
        profileText,
        jobDescription,
        adaptationMode
      );
      setGeneratedLatex(result.resumeVersion.latex);
      setSelectedVersion(result.resumeVersion);
      await refreshUser(result.remainingCredits);
      await loadHistory();
      setStatus(GenerationStatus.SUCCESS);
      window.requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (err: any) {
      // Mostra a mensagem de erro real retornada pela API/serviço, em vez de um texto genérico
      setErrorMsg(err?.message || 'Ocorreu um erro ao gerar o currículo. Tente novamente.');
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleSelectVersion = (version: ResumeVersion) => {
    setGeneratedLatex(version.latex);
    setSelectedVersion(version);
    setErrorMsg(null);
    setStatus(GenerationStatus.SUCCESS);
    window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Label do botão de gerar baseado no status
  const generateLabel = () => {
    if (status === GenerationStatus.READING_PDF) return 'Lendo PDF...';
    if (status === GenerationStatus.GENERATING) return 'Criando Currículo...';
    return 'Gerar Currículo LaTeX';
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 selection:bg-indigo-500/30">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/60 backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <FileText className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              LatexResume<span className="text-indigo-400">AI</span>
            </h1>
          </div>

          {/* Progress + User */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              type="button"
              onClick={onBackToBaseResume}
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:px-3"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Meu currículo</span>
            </button>
            {/* Progress (oculto em mobile) */}
            <div className="hidden xl:flex items-center space-x-6 text-sm font-medium text-slate-400 mr-5">
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${profileText ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                Perfil
              </div>
              <ChevronRight size={14} />
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${jobDescription ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                Vaga
              </div>
              <ChevronRight size={14} />
              <div className="flex items-center">
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    status === GenerationStatus.SUCCESS ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                />
                Resultado
              </div>
            </div>

            {/* User info */}
            <div className="flex items-center space-x-3 border-l border-slate-800 pl-3 sm:pl-4">
              {/* Créditos */}
              <div className="hidden sm:flex items-center bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 mr-2">
                <Zap size={14} className="text-yellow-400 mr-2" />
                <span className="text-sm font-bold text-white">{user?.credits ?? 0}</span>
              </div>

              <div className="flex-col items-end hidden sm:flex">
                <span className="text-sm text-white font-medium">{user?.name}</span>
                <span className="text-xs text-slate-500">{user?.email}</span>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-indigo-400">
                <UserIcon size={16} />
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sair"
                aria-label="Sair da conta"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        {/* Intro */}
        <div className="mb-8 max-w-3xl animate-fadeIn sm:mb-10">
          <div className="mb-3 flex items-center gap-2 text-indigo-300">
            <Sparkles size={16} aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Nova candidatura</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight text-white md:text-4xl">
            Um currículo mais relevante para <span className="text-indigo-400">cada vaga</span>.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Seu currículo base já foi carregado. Cole os requisitos da oportunidade, escolha como
            adaptar e revise o resultado antes de usar.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">

          {/* ── Coluna esquerda: Inputs ──────────────────────────────────────── */}
          <section
            className="animate-slideInLeft space-y-7 rounded-3xl border border-slate-800/80 bg-slate-900/35 p-5 shadow-2xl shadow-black/10 sm:p-7"
            aria-labelledby="generator-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h3 id="generator-title" className="text-xl font-bold text-white">Criar nova versão</h3>
                <p className="mt-1 text-sm text-slate-400">Complete as três etapas para consumir 1 crédito.</p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-xs font-semibold text-yellow-200 sm:hidden">
                <Zap size={13} aria-hidden="true" />
                {user?.credits ?? 0}
              </span>
            </div>

            {/* 1. Perfil */}
            <InputArea
              label="1. Currículo base"
              placeholder="Seu currículo salvo será carregado aqui..."
              value={profileText}
              onChange={setProfileText}
              maxLength={50_000}
              helperText="Você pode ajustar o texto para esta vaga. Essas alterações não modificam o currículo base salvo."
            />

            {/* 2. Vaga */}
            <InputArea
              label="2. Descrição da Vaga Alvo"
              placeholder="Cole os requisitos da vaga, responsabilidades e qualificações aqui..."
              value={jobDescription}
              onChange={setJobDescription}
              maxLength={30_000}
            />

            {/* 3. Nível de adaptação */}
            <AdaptationModeSelector
              value={adaptationMode}
              onChange={setAdaptationMode}
              disabled={isGenerating}
            />

            {/* Ação */}
            <div className="flex flex-col items-center space-y-4 pt-1">
              {errorMsg && (
                <div className="w-full p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  <p className="mb-0.5 font-semibold text-red-300">Erro ao gerar o currículo</p>
                  <p className="text-red-200/90 break-words">{errorMsg}</p>
                </div>
              )}

              {(user?.credits ?? 0) <= 0 && (
                <div className="w-full p-3 bg-amber-900/20 border border-amber-500/40 rounded-lg text-amber-200 text-sm">
                  Você ainda não tem créditos. Durante a alpha, eles são concedidos pela equipe aos convidados.
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={!profileText || !jobDescription || (user?.credits ?? 0) <= 0}
                isLoading={isGenerating}
                className="w-full px-8 py-3 text-base sm:text-lg"
                icon={<Wand2 size={20} />}
              >
                {generateLabel()}
              </Button>
              <p className="text-center text-xs leading-relaxed text-slate-500">
                A IA pode cometer erros. Revise datas, empresas, tecnologias e demais fatos antes de usar.
              </p>
            </div>
          </section>

          {/* ── Coluna direita: Output ───────────────────────────────────────── */}
          <div
            ref={resultRef}
            className="animate-slideInRight min-h-[520px] scroll-mt-24 rounded-3xl border border-slate-800/80 bg-slate-900/35 p-5 shadow-2xl shadow-black/10 sm:p-7"
          >

            {/* Estado inicial */}
            {status === GenerationStatus.IDLE && !generatedLatex && (
              <div className="flex min-h-[470px] flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950/25 p-8 text-center text-slate-500">
                <div className="rounded-2xl border border-indigo-400/15 bg-indigo-400/5 p-4 text-indigo-300/70">
                  <FileText size={34} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-slate-300">Seu resultado aparecerá aqui</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed">
                    Depois da geração, revise o conteúdo e escolha se deseja copiar o código,
                    baixar o arquivo ou abrir no Overleaf.
                  </p>
                </div>
                {history.length > 0 && (
                  <p className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400">
                    Você também pode abrir uma versão na biblioteca abaixo.
                  </p>
                )}
              </div>
            )}

            {status === GenerationStatus.ERROR && !generatedLatex && (
              <div className="flex min-h-[470px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-950/10 p-8 text-center">
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-300">
                  <Briefcase size={30} aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-200">A geração não foi concluída</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                  Confira a mensagem ao lado e tente novamente. Se um crédito foi reservado, o backend
                  realiza o estorno em caso de falha.
                </p>
              </div>
            )}

            {/* Gerando */}
            {isGenerating && (
              <div className="flex min-h-[470px] flex-col items-center justify-center space-y-6" role="status" aria-live="polite">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Briefcase size={20} className="text-indigo-400" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-white">Trabalhando nisso...</h3>
                  <p className="text-slate-400">
                    {status === GenerationStatus.READING_PDF
                      ? 'Extraindo texto do seu PDF...'
                      : 'Analisando requisitos e escrevendo LaTeX...'}
                  </p>
                  <p className="text-xs text-slate-600">Mantenha esta página aberta até a conclusão.</p>
                </div>
              </div>
            )}

            {/* Resultado */}
            {generatedLatex && !isGenerating && (
              <>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                    <CheckCircle2 size={17} aria-hidden="true" />
                    Versão pronta para revisão
                  </span>
                  {selectedVersion?.createdAt && (
                    <span className="text-xs text-slate-500">
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(selectedVersion.createdAt))}
                    </span>
                  )}
                </div>
                {selectedVersion?.generatedContent &&
                  Array.isArray((selectedVersion.generatedContent as { gaps?: unknown }).gaps) &&
                  ((selectedVersion.generatedContent as { gaps: unknown[] }).gaps.length > 0) && (
                    <aside className="mb-5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                      <h3 className="font-semibold text-amber-200">Lacunas identificadas</h3>
                      <p className="mt-1 text-xs text-amber-100/70">
                        Estes requisitos não foram adicionados ao currículo porque não há evidência no perfil.
                      </p>
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-100/90">
                        {(selectedVersion.generatedContent as { gaps: unknown[] }).gaps
                          .filter((gap): gap is string => typeof gap === 'string')
                          .map((gap) => <li key={gap}>{gap}</li>)}
                      </ul>
                    </aside>
                  )}
                <LatexPreview code={generatedLatex} />
              </>
            )}
          </div>
        </div>

        <div className="mt-8">
          <ResumeHistory
            versions={history}
            selectedVersionId={selectedVersion?.id}
            isLoading={isHistoryLoading}
            error={historyError}
            onSelect={handleSelectVersion}
            onRetry={() => void loadHistory()}
          />
        </div>
      </main>
    </div>
  );
};

// ── Root ────────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

const AuthenticatedWorkspace: React.FC = () => {
  const { user, logout } = useAuth();
  const [page, setPage] = useState<'base-resume' | 'generator'>('base-resume');
  const [baseResume, setBaseResume] = useState<BaseResume>({ text: '', updatedAt: null });
  const [isResumeLoading, setIsResumeLoading] = useState(true);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const fetchBaseResume = useCallback(async () => {
    setIsResumeLoading(true);
    setResumeError(null);
    try {
      setBaseResume(await loadBaseResume());
    } catch (error) {
      setResumeError(error instanceof Error ? error.message : 'Não foi possível carregar seu currículo.');
    } finally {
      setIsResumeLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBaseResume();
  }, [fetchBaseResume, user?.id]);

  if (isResumeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200" role="status" aria-live="polite">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">Carregando seu currículo...</p>
        </div>
      </div>
    );
  }

  if (resumeError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-200">
        <div className="w-full max-w-md rounded-3xl border border-red-500/25 bg-slate-900 p-7 text-center">
          <h1 className="text-xl font-bold text-white">Não foi possível abrir seu espaço</h1>
          <p className="mt-2 text-sm text-slate-400">{resumeError}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" onClick={() => void fetchBaseResume()}>
              Tentar novamente
            </Button>
            <Button type="button" variant="outline" onClick={() => void logout()}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'generator') {
    return (
      <ResumeBuilder
        baseResumeText={baseResume.text}
        onBackToBaseResume={() => setPage('base-resume')}
      />
    );
  }

  return (
    <BaseResumePage
      resume={baseResume}
      onSaved={setBaseResume}
      onOpenGenerator={() => setPage('generator')}
    />
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <AuthenticatedWorkspace />;
  if (showAuth) return <AuthPage onBack={() => setShowAuth(false)} />;
  return <LandingPage onGetStarted={() => setShowAuth(true)} />;
};

export default App;
