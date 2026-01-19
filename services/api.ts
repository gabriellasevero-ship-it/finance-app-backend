
// URL do backend - pode ser configurada via variável de ambiente ou usa a padrão
const BASE_URL = import.meta.env.VITE_API_URL || "https://finance-app-backend-1.onrender.com";

export const api = {
  checkBackendHealth: async () => {
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

  connectBank: async (institutionId: string) => {
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
  }
};
