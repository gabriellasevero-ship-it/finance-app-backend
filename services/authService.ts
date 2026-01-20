import { supabase, isSupabaseConfigured } from './supabaseService';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export const authService = {
  /**
   * Cadastra um novo usuário com email e senha
   */
  async signUp(email: string, password: string, nome: string, salarioLiquido: number): Promise<AuthResponse> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, message: 'Serviço de autenticação não configurado' };
    }

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            salario_liquido: salarioLiquido
          }
        }
      });

      if (authError) {
        console.error('Erro no signup:', authError);
        return { success: false, message: translateAuthError(authError.message) };
      }

      if (!authData.user) {
        return { success: false, message: 'Erro ao criar usuário' };
      }

      // 2. Criar perfil na tabela users
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          nome,
          email,
          salario_liquido: salarioLiquido
        }]);

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        // Não retorna erro aqui pois o usuário foi criado no Auth
      }

      const user: User = {
        id: authData.user.id,
        nome,
        email,
        salario_liquido: salarioLiquido
      };

      return { 
        success: true, 
        message: 'Conta criada com sucesso! Verifique seu email para confirmar.', 
        user 
      };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { success: false, message: 'Erro ao criar conta. Tente novamente.' };
    }
  },

  /**
   * Login com email e senha
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, message: 'Serviço de autenticação não configurado' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Erro no login:', error);
        return { success: false, message: translateAuthError(error.message) };
      }

      if (!data.user) {
        return { success: false, message: 'Credenciais inválidas' };
      }

      // Buscar dados do perfil
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const user: User = profile || {
        id: data.user.id,
        nome: data.user.user_metadata?.nome || email.split('@')[0],
        email,
        salario_liquido: data.user.user_metadata?.salario_liquido || 0
      };

      return { success: true, message: 'Login realizado com sucesso!', user };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, message: 'Erro ao fazer login. Tente novamente.' };
    }
  },

  /**
   * Logout
   */
  async signOut(): Promise<AuthResponse> {
    if (!isSupabaseConfigured() || !supabase) {
      // Limpar localStorage no modo offline
      localStorage.removeItem('dfp_user');
      return { success: true, message: 'Logout realizado' };
    }

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout:', error);
        return { success: false, message: 'Erro ao fazer logout' };
      }

      return { success: true, message: 'Logout realizado com sucesso' };
    } catch (error) {
      console.error('Erro no logout:', error);
      return { success: false, message: 'Erro ao fazer logout' };
    }
  },

  /**
   * Recuperar senha - envia email com link de reset
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, message: 'Serviço de autenticação não configurado' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Erro ao enviar email de recuperação:', error);
        return { success: false, message: translateAuthError(error.message) };
      }

      return { 
        success: true, 
        message: 'Email de recuperação enviado! Verifique sua caixa de entrada.' 
      };
    } catch (error) {
      console.error('Erro na recuperação de senha:', error);
      return { success: false, message: 'Erro ao enviar email de recuperação' };
    }
  },

  /**
   * Atualizar senha (após clicar no link de recuperação)
   */
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, message: 'Serviço de autenticação não configurado' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Erro ao atualizar senha:', error);
        return { success: false, message: translateAuthError(error.message) };
      }

      return { success: true, message: 'Senha atualizada com sucesso!' };
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      return { success: false, message: 'Erro ao atualizar senha' };
    }
  },

  /**
   * Verificar se há sessão ativa
   */
  async getSession(): Promise<{ user: User | null; isAuthenticated: boolean }> {
    if (!isSupabaseConfigured() || !supabase) {
      // Modo offline - verificar localStorage
      const storedUser = localStorage.getItem('dfp_user');
      if (storedUser) {
        return { user: JSON.parse(storedUser), isAuthenticated: true };
      }
      return { user: null, isAuthenticated: false };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return { user: null, isAuthenticated: false };
      }

      // Buscar dados do perfil
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const user: User = profile || {
        id: session.user.id,
        nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário',
        email: session.user.email || '',
        salario_liquido: session.user.user_metadata?.salario_liquido || 0
      };

      return { user, isAuthenticated: true };
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      return { user: null, isAuthenticated: false };
    }
  },

  /**
   * Escutar mudanças de autenticação
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    if (!isSupabaseConfigured() || !supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const user: User = profile || {
          id: session.user.id,
          nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          salario_liquido: session.user.user_metadata?.salario_liquido || 0
        };

        callback(user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }
};

/**
 * Traduz mensagens de erro do Supabase para português
 */
function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha incorretos',
    'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
    'User already registered': 'Este email já está cadastrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Unable to validate email address: invalid format': 'Formato de email inválido',
    'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
    'For security purposes, you can only request this once every 60 seconds': 
      'Por segurança, aguarde 60 segundos antes de tentar novamente.',
  };

  return translations[message] || message;
}
