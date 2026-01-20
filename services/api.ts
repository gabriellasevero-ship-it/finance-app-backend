// URL do backend - pode ser configurada via variável de ambiente
// Em produção no Vercel, a API está no mesmo domínio (ou configure VITE_API_URL)
const BASE_URL = import.meta.env.VITE_API_URL || "";

// Tipos para respostas da API
interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

interface BelvoWidgetToken {
  access: string;
  refresh: string;
  environment: 'sandbox' | 'production';
}

interface BelvoInstitution {
  id: string;
  name: string;
  type: string;
  logo: string | null;
  country: string[];
  features: string[];
}

interface BelvoAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface BelvoLink {
  id: string;
  user_id: string;
  institution: string;
  status: string;
  created_at: string;
}

export const api = {
  // ============ HEALTH CHECK ============
  checkBackendHealth: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (!response.ok) throw new Error("Erro na resposta do servidor");
      
      const data = await response.json();
      console.log("Resposta do backend:", data);
      return { 
        success: true, 
        message: data.message || "Conectado ao Backend",
        data 
      };
    } catch (error) {
      console.error("Erro ao conectar no backend:", error);
      return { 
        success: false, 
        message: "Erro ao conectar no backend" 
      };
    }
  },

  // ============ CONEXÃO LEGADA (mantida para compatibilidade) ============
  connectBank: async (institutionId: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${BASE_URL}/api/connect-bank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institution: institutionId
        })
      });

      if (!response.ok) throw new Error("Falha na requisição de conexão");

      const data = await response.json();
      console.log("Resposta da conexão do banco:", data);
      return { 
        success: true, 
        message: data.message || `Sucesso ao conectar ${institutionId}`,
        data 
      };
    } catch (error) {
      console.error("Erro ao conectar no backend:", error);
      return { 
        success: false, 
        message: "Erro ao conectar no backend. Verifique o servidor." 
      };
    }
  },

  // ============ BELVO - OPEN FINANCE ============

  /**
   * Verifica se Belvo está configurado no backend
   */
  belvo: {
    checkStatus: async (): Promise<ApiResponse<{ configured: boolean; environment: string }>> => {
      try {
        const response = await fetch(`${BASE_URL}/api/belvo/status`);
        const data = await response.json();
        
        return {
          success: data.configured,
          message: data.message,
          data
        };
      } catch (error) {
        console.error("Erro ao verificar status Belvo:", error);
        return {
          success: false,
          message: "Erro ao verificar status do Belvo"
        };
      }
    },

    /**
     * Obtém token para o Belvo Connect Widget
     */
    getWidgetToken: async (linkId?: string): Promise<ApiResponse<BelvoWidgetToken> & { details?: string; hint?: string }> => {
      try {
        const response = await fetch(`${BASE_URL}/api/belvo/widget-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(linkId ? { link_id: linkId } : {})
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            message: data.message || data.error || "Erro ao obter token",
            details: data.details,
            hint: data.hint
          };
        }

        return {
          success: true,
          message: "Token obtido com sucesso",
          data
        };
      } catch (error) {
        console.error("Erro ao obter widget token:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Erro ao obter token do widget"
        };
      }
    },

    /**
     * Lista instituições disponíveis na Belvo
     */
    listInstitutions: async (country = 'BR'): Promise<ApiResponse<BelvoInstitution[]>> => {
      try {
        const response = await fetch(`${BASE_URL}/api/belvo/institutions?country=${country}`);
        
        if (!response.ok) throw new Error("Erro ao listar instituições");

        const data = await response.json();
        return {
          success: true,
          message: "Instituições carregadas",
          data
        };
      } catch (error) {
        console.error("Erro ao listar instituições:", error);
        return {
          success: false,
          message: "Erro ao carregar instituições"
        };
      }
    },

    /**
     * Registra um link após o usuário completar o widget
     */
    registerLink: async (linkId: string, userId: string, institution: string): Promise<ApiResponse<{ link: BelvoLink; accounts: BelvoAccount[] }>> => {
      try {
        const response = await fetch(`${BASE_URL}/api/belvo/register-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            link_id: linkId,
            user_id: userId,
            institution
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Erro ao registrar link");
        }

        const data = await response.json();
        return {
          success: true,
          message: data.message || "Banco conectado com sucesso!",
          data
        };
      } catch (error) {
        console.error("Erro ao registrar link:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Erro ao registrar conexão"
        };
      }
    },

    /**
     * Lista links (conexões) do usuário
     */
    listLinks: async (userId: string): Promise<ApiResponse<BelvoLink[]>> => {
      try {
        const response = await fetch(`${BASE_URL}/api/belvo/links?user_id=${userId}`);
        
        if (!response.ok) throw new Error("Erro ao listar conexões");

        const data = await response.json();
        return {
          success: true,
          message: "Conexões carregadas",
          data
        };
      } catch (error) {
        console.error("Erro ao listar links:", error);
        return {
          success: false,
          message: "Erro ao carregar conexões"
        };
      }
    },

    /**
     * Busca contas de um link
     */
    getAccounts: async (linkId: string): Promise<ApiResponse<BelvoAccount[]>> => {
      try {
        const response = await fetch(`${BASE_URL}/api/belvo/accounts/${linkId}`);
        
        if (!response.ok) throw new Error("Erro ao buscar contas");

        const data = await response.json();
        return {
          success: true,
          message: "Contas carregadas",
          data
        };
      } catch (error) {
        console.error("Erro ao buscar contas:", error);
        return {
          success: false,
          message: "Erro ao carregar contas"
        };
      }
    },

    /**
     * Busca transações de um link
     */
    getTransactions: async (linkId: string, dateFrom?: string, dateTo?: string): Promise<ApiResponse> => {
      try {
        let url = `${BASE_URL}/api/belvo/transactions/${linkId}`;
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Erro ao buscar transações");

        const data = await response.json();
        return {
          success: true,
          message: "Transações carregadas",
          data
        };
      } catch (error) {
        console.error("Erro ao buscar transações:", error);
        return {
          success: false,
          message: "Erro ao carregar transações"
        };
      }
    },

    /**
     * Sincroniza dados de um link
     */
    syncLink: async (linkId: string, userId: string): Promise<ApiResponse> => {
      try {
        const response = await fetch(`${BASE_URL}/api/belvo/sync/${linkId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) throw new Error("Erro ao sincronizar");

        const data = await response.json();
        return {
          success: true,
          message: data.message || "Dados sincronizados",
          data
        };
      } catch (error) {
        console.error("Erro ao sincronizar:", error);
        return {
          success: false,
          message: "Erro ao sincronizar dados"
        };
      }
    },

    /**
     * Desconecta um banco (remove link)
     */
    deleteLink: async (linkId: string, userId: string): Promise<ApiResponse> => {
      try {
        const response = await fetch(`${BASE_URL}/api/belvo/links/${linkId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) throw new Error("Erro ao desconectar");

        const data = await response.json();
        return {
          success: true,
          message: data.message || "Banco desconectado",
          data
        };
      } catch (error) {
        console.error("Erro ao desconectar:", error);
        return {
          success: false,
          message: "Erro ao desconectar banco"
        };
      }
    }
  }
};
