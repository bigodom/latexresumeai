import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, ArrowRight, User, Mail, Lock, Loader2, ArrowLeft, Beaker } from 'lucide-react';
import { Button } from './Button';

interface AuthPageProps {
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const { login, register, loginAsTestUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black px-4 relative">
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Voltar para Início
      </button>

      <div className="max-w-md w-full space-y-8 animate-fadeIn">
        
        {/* Logo Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
            <FileText className="text-white h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            LatexResume<span className="text-indigo-400">AI</span> - Seu currículo profissional em segundos.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-10 group-hover:opacity-20 transition duration-500 blur"></div>
          
          <form className="relative space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-200 placeholder-slate-500 sm:text-sm transition-all"
                    placeholder="Seu nome"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-200 placeholder-slate-500 sm:text-sm transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-200 placeholder-slate-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3 text-base"
              isLoading={loading}
              variant="primary"
            >
              {isLogin ? 'Entrar' : 'Cadastrar'}
              {!loading && <ArrowRight size={18} className="ml-2" />}
            </Button>
          </form>

          <div className="mt-6 text-center relative z-10">
            <p className="text-sm text-slate-400">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{' '}
              <button
                onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                }}
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none focus:underline"
              >
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>

          {/* Botão de Teste */}
          <div className="mt-8 pt-6 border-t border-slate-800 relative z-10">
             <Button
                onClick={loginAsTestUser}
                variant="secondary"
                className="w-full text-sm bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300 border border-emerald-500/30 transition-all"
                icon={<Beaker size={16} />}
              >
                Modo Teste (Entrar com 1000 Créditos)
              </Button>
          </div>

        </div>
      </div>
    </div>
  );
};