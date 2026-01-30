import React, { useState } from 'react';
import { Sparkles, FileText, Briefcase, ChevronRight, Wand2, LogOut, User as UserIcon, Zap } from 'lucide-react';
import { InputArea } from './components/InputArea';
import { LatexPreview } from './components/LatexPreview';
import { Button } from './components/Button';
import { generateResumeLatex } from './services/geminiService';
import { GenerationStatus } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';

const ResumeBuilder: React.FC = () => {
  const { user, logout } = useAuth();
  const [profileText, setProfileText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [generatedLatex, setGeneratedLatex] = useState("");
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!profileText.trim() || !jobDescription.trim()) {
      setErrorMsg("Por favor, forneça os detalhes do seu perfil e a descrição da vaga.");
      return;
    }

    setStatus(GenerationStatus.GENERATING);
    setErrorMsg(null);
    setGeneratedLatex("");

    try {
      const latex = await generateResumeLatex(profileText, jobDescription);
      setGeneratedLatex(latex);
      setStatus(GenerationStatus.SUCCESS);
    } catch (e) {
      setErrorMsg("Ocorreu um erro ao gerar o currículo. Verifique sua chave de API ou tente novamente.");
      setStatus(GenerationStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800/60 backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <FileText className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              LatexResume<span className="text-indigo-400">AI</span>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
             {/* Progress Steps (Hidden on mobile) */}
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-400 mr-8">
                <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${profileText ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
                Perfil
                </div>
                <ChevronRight size={14} />
                <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${jobDescription ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
                Vaga
                </div>
                <ChevronRight size={14} />
                <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${status === GenerationStatus.SUCCESS ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
                Resultado
                </div>
            </div>

            {/* User Menu & Credits */}
            <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
                
                {/* Credits Display */}
                <div className="hidden sm:flex items-center bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 mr-2">
                   <Zap size={14} className="text-yellow-400 mr-2" />
                   <span className="text-sm font-bold text-white">{user?.credits || 0}</span>
                </div>

                <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-sm text-white font-medium">{user?.name}</span>
                    <span className="text-xs text-slate-500">{user?.email}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-indigo-400">
                    <UserIcon size={16} />
                </div>
                <button 
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Sair"
                >
                    <LogOut size={18} />
                </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Intro */}
        <div className="mb-10 text-center max-w-2xl mx-auto animate-fadeIn">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Adapte seu currículo em <span className="text-indigo-400">segundos</span>.
          </h2>
          <p className="text-slate-400 text-lg">
            Envie seu CV atual ou digite suas habilidades, adicione a descrição da vaga e deixe nossa IA criar o código LaTeX perfeito para sua aplicação.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Left Column: Inputs */}
          <div className="space-y-8 animate-slideInLeft">
            
            {/* Profile Input */}
            <InputArea
              label="1. Seu Perfil / Currículo Existente"
              placeholder="Cole o texto do seu currículo atual aqui, ou liste sua educação, habilidades e experiência..."
              value={profileText}
              onChange={setProfileText}
              allowFileUpload={true}
              onFileProcessingStart={() => setStatus(GenerationStatus.READING_PDF)}
              onFileProcessingEnd={() => setStatus(GenerationStatus.IDLE)}
            />

            {/* Job Description Input */}
            <InputArea
              label="2. Descrição da Vaga Alvo"
              placeholder="Cole os requisitos da vaga, responsabilidades e qualificações aqui..."
              value={jobDescription}
              onChange={setJobDescription}
              className="mt-6"
            />

            {/* Action Area */}
            <div className="pt-4 flex flex-col items-center space-y-4">
              {errorMsg && (
                <div className="w-full p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                  {errorMsg}
                </div>
              )}
              
              <Button 
                onClick={handleGenerate} 
                disabled={!profileText || !jobDescription}
                isLoading={status === GenerationStatus.GENERATING || status === GenerationStatus.READING_PDF}
                className="w-full md:w-auto text-lg px-8 py-3"
                icon={<Wand2 size={20} />}
              >
                {status === GenerationStatus.READING_PDF ? "Lendo PDF..." : 
                 status === GenerationStatus.GENERATING ? "Criando Currículo..." : 
                 "Gerar Currículo LaTeX"}
              </Button>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:pl-8 lg:border-l border-slate-800 animate-slideInRight min-h-[500px]">
             {status === GenerationStatus.IDLE && !generatedLatex && (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 border-2 border-dashed border-slate-800 rounded-xl p-10">
                  <Sparkles size={48} className="text-slate-700" />
                  <p className="text-center font-medium">Pronto para gerar mágica.</p>
                  <p className="text-sm text-center max-w-xs">Seu código LaTeX personalizado aparecerá aqui, pronto para ser copiado para o Overleaf.</p>
                </div>
             )}

             {(status === GenerationStatus.GENERATING || status === GenerationStatus.READING_PDF) && (
               <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Briefcase size={20} className="text-indigo-400" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-white">Trabalhando nisso...</h3>
                    <p className="text-slate-400">
                      {status === GenerationStatus.READING_PDF ? "Extraindo texto do seu PDF..." : "Analisando requisitos e escrevendo LaTeX..."}
                    </p>
                  </div>
               </div>
             )}

             {generatedLatex && status !== GenerationStatus.GENERATING && (
                <LatexPreview code={generatedLatex} />
             )}
          </div>

        </div>
      </main>
    </div>
  );
};

// Main App Component that handles Routing/Auth
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. If user is logged in, show the App
  if (user) {
    return <ResumeBuilder />;
  }

  // 2. If user is NOT logged in and clicked "Get Started", show Auth Page
  if (showAuth) {
    return <AuthPage onBack={() => setShowAuth(false)} />;
  }

  // 3. Default: Show Landing Page
  return <LandingPage onGetStarted={() => setShowAuth(true)} />;
};

export default App;