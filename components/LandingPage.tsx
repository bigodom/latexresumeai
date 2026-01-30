import React from 'react';
import { FileText, Sparkles, CheckCircle, Zap, Shield, ChevronRight, Star } from 'lucide-react';
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
            A revolução na criação de currículos
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight animate-slideInUp">
            Seu currículo em LaTeX <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
              Gerado por IA
            </span>
          </h1>
          
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-400 mb-10 animate-slideInUp delay-100">
            Transforme seu perfil e a descrição da vaga em um código LaTeX profissional, compilável e otimizado para passar nos filtros de recrutamento.
          </p>

          <div className="flex justify-center gap-4 animate-slideInUp delay-200">
            <Button onClick={onGetStarted} className="px-8 py-4 text-lg rounded-xl shadow-indigo-500/25">
              Criar Currículo Grátis
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
            <p className="text-slate-400">Três passos simples para o currículo perfeito</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="h-8 w-8 text-emerald-400" />,
                title: "Importe seus Dados",
                desc: "Cole seu texto ou faça upload do seu PDF atual. Nossa IA extrai tudo automaticamente."
              },
              {
                icon: <Sparkles className="h-8 w-8 text-indigo-400" />,
                title: "Personalização Inteligente",
                desc: "A IA adapta suas experiências para as palavras-chave exatas da descrição da vaga."
              },
              {
                icon: <CheckCircle className="h-8 w-8 text-cyan-400" />,
                title: "Código LaTeX Pronto",
                desc: "Receba o código pronto para copiar e colar no Overleaf. Design profissional garantido."
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

      {/* Pricing Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Escolha seu pacote de créditos</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Invista na sua carreira com preços acessíveis. Cada crédito equivale a uma geração completa de currículo otimizado.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Tier 1: Starter */}
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col hover:border-slate-600 transition-colors">
              <div className="mb-4">
                <span className="text-slate-400 font-medium uppercase tracking-wider text-xs">Iniciante</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">R$ 4,99</span>
                <span className="text-slate-500 ml-2">/ único</span>
              </div>
              <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm inline-flex items-center w-max">
                 <Star size={12} className="mr-1 fill-current" /> Promocional
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-slate-300">
                  <CheckCircle size={18} className="text-indigo-500 mr-3" />
                  <span className="font-bold text-white mr-1">5</span> Créditos de Geração
                </li>
                <li className="flex items-center text-slate-300">
                  <CheckCircle size={18} className="text-indigo-500 mr-3" />
                  Acesso a modelos padrão
                </li>
                <li className="flex items-center text-slate-300">
                  <CheckCircle size={18} className="text-indigo-500 mr-3" />
                  Suporte básico
                </li>
              </ul>
              <Button onClick={onGetStarted} variant="outline" className="w-full">
                Comprar 5 Créditos
              </Button>
            </div>

            {/* Tier 2: Standard (Highlighted) */}
            <div className="relative bg-gradient-to-b from-indigo-900/20 to-slate-900 border border-indigo-500/50 rounded-2xl p-8 flex flex-col transform md:-translate-y-4 shadow-2xl shadow-indigo-900/20">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Mais Popular
              </div>
              <div className="mb-4">
                <span className="text-indigo-400 font-medium uppercase tracking-wider text-xs">Padrão</span>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">R$ 9,99</span>
                <span className="text-slate-500 ml-2">/ único</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-slate-300">
                  <CheckCircle size={18} className="text-indigo-400 mr-3" />
                  <span className="font-bold text-white mr-1">10</span> Créditos de Geração
                </li>
                <li className="flex items-center text-slate-300">
                  <CheckCircle size={18} className="text-indigo-400 mr-3" />
                  Prioridade na fila de IA
                </li>
                <li className="flex items-center text-slate-300">
                  <CheckCircle size={18} className="text-indigo-400 mr-3" />
                  Modelos Premium
                </li>
              </ul>
              <Button onClick={onGetStarted} variant="primary" className="w-full py-3 text-lg">
                Comprar 10 Créditos
              </Button>
            </div>

            {/* Tier 3: Pro */}
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col hover:border-slate-600 transition-colors">
              <div className="mb-4">
                <span className="text-slate-400 font-medium uppercase tracking-wider text-xs">Profissional</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">R$ 15,99</span>
                <span className="text-slate-500 ml-2">/ único</span>
              </div>
               <div className="mb-6 text-transparent px-3 py-1 text-sm inline-flex items-center">
                 &nbsp;
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-slate-300">
                  <CheckCircle size={18} className="text-indigo-500 mr-3" />
                  <span className="font-bold text-white mr-1">20</span> Créditos de Geração
                </li>
                <li className="flex items-center text-slate-300">
                  <CheckCircle size={18} className="text-indigo-500 mr-3" />
                  Histórico ilimitado
                </li>
                <li className="flex items-center text-slate-300">
                  <CheckCircle size={18} className="text-indigo-500 mr-3" />
                  Suporte prioritário
                </li>
              </ul>
              <Button onClick={onGetStarted} variant="outline" className="w-full">
                Comprar 20 Créditos
              </Button>
            </div>

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
            &copy; 2024 LatexResumeAI. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};