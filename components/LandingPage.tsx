import React from 'react';
import { FileText, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from './Button';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800/60 backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <FileText className="text-white h-6 w-6" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              LatexResume<span className="text-indigo-400">AI</span>
            </span>
          </div>
          <div className="hidden md:flex space-x-4">
             <button onClick={onGetStarted} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
               Entrar
             </button>
             <Button onClick={onGetStarted} variant="primary" className="py-1.5 px-4 text-sm">
               Começar Agora
             </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-900/10 px-3 py-1 text-sm font-medium text-indigo-300 mb-8 animate-fadeIn">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2"></span>
            Alpha fechada para convidados
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight animate-slideInUp">
            Seu currículo em LaTeX <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
              Gerado por IA
            </span>
          </h1>
          
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-400 mb-10 animate-slideInUp delay-100">
            Adapte seu currículo à linguagem de uma vaga usando somente informações reais e receba um código LaTeX pronto para revisar.
          </p>

          <div className="flex justify-center gap-4 animate-slideInUp delay-200">
            <Button onClick={onGetStarted} className="px-8 py-4 text-lg rounded-xl shadow-indigo-500/25">
              Entrar ou criar conta
            </Button>
          </div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Como funciona</h2>
            <p className="text-slate-400">Três passos para criar uma versão direcionada à vaga</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="h-8 w-8 text-emerald-400" />,
                title: "Importe seus Dados",
                desc: "Cole o texto ou importe um PDF com texto selecionável e confira os dados antes de gerar."
              },
              {
                icon: <Sparkles className="h-8 w-8 text-indigo-400" />,
                title: "Personalização Inteligente",
                desc: "Escolha entre edição fiel, ênfase estratégica ou análise de lacunas. Nenhum modo inventa fatos."
              },
              {
                icon: <CheckCircle className="h-8 w-8 text-cyan-400" />,
                title: "Código LaTeX Pronto",
                desc: "Revise o código gerado, faça download do arquivo .tex ou abra-o no Overleaf."
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-800/40 p-8 rounded-2xl border border-slate-700/50 hover:border-indigo-500/30 transition-all hover:bg-slate-800/60 group">
                <div className="mb-4 bg-slate-900/50 w-16 h-16 rounded-xl flex items-center justify-center border border-slate-700 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alpha Section */}
      <section className="py-24 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-900/20 to-slate-900 p-8 md:p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Participe da versão alpha</h2>
            <p className="text-slate-400 mb-8">
              O acesso é gratuito para convidados e usa créditos concedidos pela equipe. Pagamentos ainda não estão disponíveis.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-300 mb-8">
              <span className="flex items-center"><CheckCircle size={16} className="mr-2 text-emerald-400" />Cadastro e histórico reais</span>
              <span className="flex items-center"><CheckCircle size={16} className="mr-2 text-emerald-400" />Consumo protegido no servidor</span>
              <span className="flex items-center"><CheckCircle size={16} className="mr-2 text-emerald-400" />Sem cobrança durante a alpha</span>
            </div>
            <Button onClick={onGetStarted} variant="primary" className="px-8 py-3">
              Acessar alpha
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
             <div className="bg-indigo-900/30 p-1.5 rounded-lg">
              <FileText className="text-indigo-400 h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-300">LatexResume<span className="text-indigo-500">AI</span></span>
          </div>
          <div className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} LatexResumeAI. Alpha em desenvolvimento.
          </div>
        </div>
      </footer>
    </div>
  );
};
