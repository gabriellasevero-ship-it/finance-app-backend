import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  initialMode?: AuthMode;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nome, setNome] = useState('');
  const [salarioLiquido, setSalarioLiquido] = useState<number>(0);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNome('');
    setSalarioLiquido(0);
    setMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const result = await authService.signIn(email, password);

    if (result.success && result.user) {
      setMessage({ type: 'success', text: result.message });
      onAuthSuccess(result.user);
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validações
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' });
      setIsLoading(false);
      return;
    }

    if (!nome.trim()) {
      setMessage({ type: 'error', text: 'Por favor, informe seu nome' });
      setIsLoading(false);
      return;
    }

    const result = await authService.signUp(email, password, nome, salarioLiquido);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      // Se o email não precisa de confirmação, fazer login automático
      if (result.user) {
        setTimeout(() => {
          onAuthSuccess(result.user!);
        }, 2000);
      }
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Por favor, informe seu email' });
      setIsLoading(false);
      return;
    }

    const result = await authService.resetPassword(email);

    setMessage({ 
      type: result.success ? 'success' : 'error', 
      text: result.message 
    });

    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' });
      setIsLoading(false);
      return;
    }

    const result = await authService.updatePassword(password);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        setMode('login');
        resetForm();
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setIsLoading(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20">
            <i className="fa-solid fa-wallet text-3xl"></i>
          </div>
          <h1 className="text-2xl font-bold">Decisão Financeira</h1>
          <p className="text-slate-400 text-sm mt-1">Sua jornada para a liberdade financeira</p>
        </div>

        {/* Card de Autenticação */}
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700">
          
          {/* LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Entrar</h2>
                <p className="text-slate-400 text-sm">Acesse sua conta para continuar</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="seu@email.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => switchMode('forgot-password')}
                className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
              >
                Esqueceu a senha?
              </button>

              {message && (
                <div className={`p-4 rounded-xl text-sm ${
                  message.type === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <i className={`fa-solid ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar <i className="fa-solid fa-arrow-right"></i>
                  </>
                )}
              </button>

              <p className="text-center text-slate-400 text-sm">
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Criar conta
                </button>
              </p>
            </form>
          )}

          {/* CADASTRO */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Criar Conta</h2>
                <p className="text-slate-400 text-sm">Comece sua jornada financeira</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="seu@email.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Salário Líquido (R$)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                    <input
                      type="number"
                      required
                      placeholder="0,00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={salarioLiquido || ''}
                      onChange={e => setSalarioLiquido(Number(e.target.value))}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Valor que cai na conta após descontos</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar Senha</label>
                  <input
                    type="password"
                    required
                    placeholder="Repita a senha"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm ${
                  message.type === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <i className={`fa-solid ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Criando conta...
                  </>
                ) : (
                  <>
                    Criar Conta <i className="fa-solid fa-user-plus"></i>
                  </>
                )}
              </button>

              <p className="text-center text-slate-400 text-sm">
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Entrar
                </button>
              </p>
            </form>
          )}

          {/* ESQUECI A SENHA */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Recuperar Senha</h2>
                <p className="text-slate-400 text-sm">Enviaremos um link para redefinir sua senha</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm ${
                  message.type === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <i className={`fa-solid ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar Link de Recuperação <i className="fa-solid fa-paper-plane"></i>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-slate-400 hover:text-slate-300 text-sm font-medium"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Voltar para o login
              </button>
            </form>
          )}

          {/* REDEFINIR SENHA (após clicar no link do email) */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Nova Senha</h2>
                <p className="text-slate-400 text-sm">Digite sua nova senha</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nova Senha</label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    required
                    placeholder="Repita a nova senha"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm ${
                  message.type === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <i className={`fa-solid ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    Salvar Nova Senha <i className="fa-solid fa-check"></i>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Seus dados estão seguros e criptografados
        </p>
      </div>
    </div>
  );
};

export default Auth;
