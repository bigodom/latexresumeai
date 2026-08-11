import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Cpu, KeyRound, LogOut, RefreshCw, Save, ShieldAlert } from 'lucide-react';
import { AuthPage } from '../AuthPage';
import { Button } from '../Button';
import { useAuth } from '../../context/AuthContext';
import {
  activateAIConfiguration,
  AdminAIState,
  AdminProvider,
  createAIConfiguration,
  createPromptVersion,
  loadAdminAIState,
} from '../../services/adminAiService';

const providerLabels: Record<AdminProvider, string> = {
  deepseek: 'DeepSeek V4 Flash',
  gemini: 'Gemini 3.6 Flash',
  openai: 'GPT-5.6 Luna',
};

const fieldClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none';
const labelClass = 'mb-1 block text-sm font-medium text-slate-300';

const LocalAdminContent: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const [state, setState] = useState<AdminAIState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<AdminProvider>('deepseek');
  const [name, setName] = useState('');
  const [promptId, setPromptId] = useState('');
  const [maxTokens, setMaxTokens] = useState(5000);
  const [thinking, setThinking] = useState<'enabled' | 'disabled'>('disabled');
  const [deepseekEffort, setDeepseekEffort] = useState<'low' | 'high' | 'max'>('low');
  const [sampling, setSampling] = useState<'default' | 'temperature' | 'top_p'>('temperature');
  const [temperature, setTemperature] = useState(0.2);
  const [topP, setTopP] = useState(1);
  const [geminiThinking, setGeminiThinking] = useState<'low' | 'medium' | 'high'>('medium');
  const [openaiEffort, setOpenaiEffort] = useState<'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'>('low');
  const [reasoningMode, setReasoningMode] = useState<'standard' | 'pro'>('standard');
  const [verbosity, setVerbosity] = useState<'low' | 'medium' | 'high'>('low');
  const [newPromptVersion, setNewPromptVersion] = useState('');
  const [newPromptText, setNewPromptText] = useState('');

  const refresh = async () => {
    setError(null);
    const next = await loadAdminAIState();
    setState(next);
    if (!promptId && next.prompts[0]) setPromptId(next.prompts[0].id);
  };

  useEffect(() => {
    if (user) void refresh().catch((reason) => setError(reason instanceof Error ? reason.message : 'Falha ao carregar.'));
  }, [user]);

  const parameters = useMemo(() => {
    if (provider === 'deepseek') return {
      maxOutputTokens: maxTokens, thinking, reasoningEffort: deepseekEffort,
      sampling, temperature, topP,
    };
    if (provider === 'gemini') return { maxOutputTokens: maxTokens, thinkingLevel: geminiThinking };
    return { maxOutputTokens: maxTokens, reasoningEffort: openaiEffort, reasoningMode, verbosity };
  }, [provider, maxTokens, thinking, deepseekEffort, sampling, temperature, topP, geminiThinking, openaiEffort, reasoningMode, verbosity]);

  const run = async (operation: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(null); setNotice(null);
    try {
      await operation();
      await refresh();
      setNotice(success);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Operação não concluída.');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 p-8 text-slate-300">Carregando…</div>;
  if (!user) return <AuthPage onBack={() => { window.location.href = '/'; }} />;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Somente localhost</p>
            <h1 className="text-3xl font-bold">Configuração de IA</h1>
            <p className="mt-1 text-slate-400">Crie versões imutáveis e ative uma configuração por vez.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={() => void refresh()} disabled={busy}>Atualizar</Button>
            <Button variant="ghost" icon={<LogOut size={16} />} onClick={() => void logout()}>Sair</Button>
          </div>
        </header>

        <div className="rounded-xl border border-amber-700/40 bg-amber-950/30 p-4 text-sm text-amber-200">
          <ShieldAlert className="mr-2 inline" size={18} />
          Chaves não são exibidas nem salvas aqui. Com o modo local habilitado, qualquer usuário autenticado pode usar a função.
        </div>
        {error && <div aria-live="assertive" className="rounded-lg border border-red-700 bg-red-950/40 p-3 text-red-300">{error}</div>}
        {notice && <div aria-live="polite" className="rounded-lg border border-emerald-700 bg-emerald-950/40 p-3 text-emerald-300">{notice}</div>}

        <section className="grid gap-4 md:grid-cols-3">
          {(Object.keys(providerLabels) as AdminProvider[]).map((key) => (
            <div key={key} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{providerLabels[key]}</span>
                <span className={state?.availableSecrets[key] ? 'text-emerald-400' : 'text-amber-400'}>
                  <KeyRound size={18} />
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">Secret {state?.availableSecrets[key] ? 'configurado' : 'ausente'}.</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Cpu size={20} /> Configurações</h2>
          <div className="grid gap-3">
            {state?.configurations.map((config) => (
              <div key={config.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div>
                  <div className="flex items-center gap-2 font-semibold">{config.name}{config.is_active && <CheckCircle2 size={17} className="text-emerald-400" />}</div>
                  <p className="text-sm text-slate-400">{config.model} · {JSON.stringify(config.parameters)}</p>
                </div>
                <Button variant={config.is_active ? 'secondary' : 'outline'} disabled={busy || config.is_active || !state.availableSecrets[config.provider]} onClick={() => void run(() => activateAIConfiguration(config.id), 'Configuração ativada.')}>{config.is_active ? 'Ativa' : 'Ativar'}</Button>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5" onSubmit={(event) => {
            event.preventDefault();
            void run(() => createAIConfiguration({ name, provider, promptVersionId: promptId, parameters }), 'Nova configuração criada.');
          }}>
            <h2 className="text-xl font-semibold">Nova configuração</h2>
            <div><label className={labelClass}>Nome</label><input className={fieldClass} required minLength={3} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: DeepSeek prompt v2" /></div>
            <div><label className={labelClass}>Provedor/modelo</label><select className={fieldClass} value={provider} onChange={(e) => setProvider(e.target.value as AdminProvider)}>{Object.entries(providerLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
            <div><label className={labelClass}>Prompt</label><select className={fieldClass} required value={promptId} onChange={(e) => setPromptId(e.target.value)}>{state?.prompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.version}</option>)}</select></div>
            <div><label className={labelClass}>Máximo de tokens de saída</label><input className={fieldClass} type="number" min={500} max={20000} value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} /></div>

            {provider === 'deepseek' && <>
              <div><label className={labelClass}>Thinking</label><select className={fieldClass} value={thinking} onChange={(e) => setThinking(e.target.value as typeof thinking)}><option value="disabled">Desativado</option><option value="enabled">Ativado</option></select></div>
              {thinking === 'enabled' ? <div><label className={labelClass}>Reasoning effort</label><select className={fieldClass} value={deepseekEffort} onChange={(e) => setDeepseekEffort(e.target.value as typeof deepseekEffort)}><option>low</option><option>high</option><option>max</option></select></div> : <>
                <div><label className={labelClass}>Amostragem</label><select className={fieldClass} value={sampling} onChange={(e) => setSampling(e.target.value as typeof sampling)}><option value="default">Padrão</option><option value="temperature">Temperature</option><option value="top_p">Top P</option></select></div>
                {sampling === 'temperature' && <div><label className={labelClass}>Temperature (0–2)</label><input className={fieldClass} type="number" step="0.1" min="0" max="2" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} /></div>}
                {sampling === 'top_p' && <div><label className={labelClass}>Top P (0–1)</label><input className={fieldClass} type="number" step="0.05" min="0" max="1" value={topP} onChange={(e) => setTopP(Number(e.target.value))} /></div>}
              </>}
            </>}
            {provider === 'gemini' && <><div><label className={labelClass}>Thinking level</label><select className={fieldClass} value={geminiThinking} onChange={(e) => setGeminiThinking(e.target.value as typeof geminiThinking)}><option>low</option><option>medium</option><option>high</option></select></div><p className="text-xs text-slate-400">Gemini 3.6 não recebe temperature, top_p ou top_k: esses parâmetros foram descontinuados.</p></>}
            {provider === 'openai' && <>
              <div><label className={labelClass}>Reasoning effort</label><select className={fieldClass} value={openaiEffort} onChange={(e) => setOpenaiEffort(e.target.value as typeof openaiEffort)}>{['none','low','medium','high','xhigh','max'].map((v) => <option key={v}>{v}</option>)}</select></div>
              <div><label className={labelClass}>Reasoning mode</label><select className={fieldClass} value={reasoningMode} onChange={(e) => setReasoningMode(e.target.value as typeof reasoningMode)}><option value="standard">standard</option><option value="pro">pro</option></select></div>
              <div><label className={labelClass}>Text verbosity</label><select className={fieldClass} value={verbosity} onChange={(e) => setVerbosity(e.target.value as typeof verbosity)}><option>low</option><option>medium</option><option>high</option></select></div>
            </>}
            <Button type="submit" icon={<Save size={16} />} isLoading={busy} disabled={!promptId}>Criar versão de configuração</Button>
          </form>

          <form className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5" onSubmit={(event) => {
            event.preventDefault();
            void run(() => createPromptVersion(newPromptVersion, newPromptText), 'Nova versão de prompt criada.');
          }}>
            <h2 className="text-xl font-semibold">Nova versão de prompt</h2>
            <div><label className={labelClass}>Identificador</label><input className={fieldClass} required pattern="[a-z0-9._-]+" value={newPromptVersion} onChange={(e) => setNewPromptVersion(e.target.value)} placeholder="resume-v2" /></div>
            <div><label className={labelClass}>Instruções editoriais</label><textarea className={`${fieldClass} min-h-64`} required minLength={20} maxLength={12000} value={newPromptText} onChange={(e) => setNewPromptText(e.target.value)} /></div>
            <p className="text-xs text-slate-400">As regras contra fabricação de fatos ficam no código e não podem ser removidas por este campo.</p>
            <Button type="submit" icon={<Save size={16} />} isLoading={busy}>Criar prompt imutável</Button>
          </form>
        </section>
      </div>
    </main>
  );
};

export const LocalAdminPage: React.FC = () => <LocalAdminContent />;
