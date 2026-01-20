import React, { useEffect, useCallback, useState } from 'react';
import { api } from '../services/api';

// Declaração global para o script do Belvo
declare global {
  interface Window {
    belvoSDK?: {
      createWidget: (accessToken: string, options: BelvoWidgetOptions) => {
        build: () => void;
      };
    };
  }
}

interface BelvoWidgetOptions {
  institution?: string;
  callback: (link: string, institution: string) => void;
  onExit?: (data: { last_encountered_error?: { message: string } }) => void;
  onEvent?: (data: { eventName: string; meta_data?: Record<string, unknown> }) => void;
  locale?: string;
  country_codes?: string[];
}

interface BelvoWidgetProps {
  userId: string;
  onSuccess: (linkId: string, institution: string, accounts: unknown[]) => void;
  onError: (error: string) => void;
  onClose: () => void;
  institution?: string; // Pré-selecionar instituição
}

const BelvoWidget: React.FC<BelvoWidgetProps> = ({
  userId,
  onSuccess,
  onError,
  onClose,
  institution
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega o script do Belvo
  const loadBelvoScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Verifica se já está carregado
      if (window.belvoSDK) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      // Sandbox para desenvolvimento, production para produção
      script.src = 'https://cdn.belvo.io/belvo-widget-1-stable.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar Belvo SDK'));
      document.body.appendChild(script);
    });
  }, []);

  // Inicializa o widget
  const initWidget = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Carrega o script
      await loadBelvoScript();

      // 2. Obtém o token de acesso
      const tokenResponse = await api.belvo.getWidgetToken();
      
      if (!tokenResponse.success || !tokenResponse.data) {
        const errorDetails = (tokenResponse as { details?: string }).details;
        const hint = (tokenResponse as { hint?: string }).hint;
        let errorMsg = tokenResponse.message || 'Erro ao obter token';
        if (errorDetails) errorMsg += ` - ${errorDetails}`;
        if (hint) errorMsg += `. ${hint}`;
        throw new Error(errorMsg);
      }

      const { access: accessToken } = tokenResponse.data;

      // 3. Cria e exibe o widget
      if (!window.belvoSDK) {
        throw new Error('Belvo SDK não carregado');
      }

      const widget = window.belvoSDK.createWidget(accessToken, {
        institution: institution,
        locale: 'pt',
        country_codes: ['BR'],
        
        // Callback de sucesso - usuário conectou o banco
        callback: async (linkId: string, institutionName: string) => {
          try {
            // Registra o link no backend
            const result = await api.belvo.registerLink(linkId, userId, institutionName);
            
            if (result.success && result.data) {
              onSuccess(linkId, institutionName, result.data.accounts || []);
            } else {
              onError(result.message || 'Erro ao registrar conexão');
            }
          } catch (err) {
            onError('Erro ao processar conexão bancária');
          }
        },

        // Callback de saída - usuário fechou o widget
        onExit: (data) => {
          if (data.last_encountered_error) {
            onError(data.last_encountered_error.message);
          } else {
            onClose();
          }
        },

        // Callback de eventos (para logging/analytics)
        onEvent: (data) => {
          console.log('Belvo Widget Event:', data.eventName, data.meta_data);
        }
      });

      widget.build();
      setIsLoading(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setIsLoading(false);
      onError(errorMessage);
    }
  }, [loadBelvoScript, institution, userId, onSuccess, onError, onClose]);

  useEffect(() => {
    initWidget();

    // Cleanup
    return () => {
      // Remove o container do widget se existir
      const widgetContainer = document.getElementById('belvo-widget');
      if (widgetContainer) {
        widgetContainer.innerHTML = '';
      }
    };
  }, [initWidget]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-triangle-exclamation text-rose-500 text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Erro na Conexão</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Carregando...</h3>
          <p className="text-slate-600">Preparando conexão segura com seu banco</p>
        </div>
      </div>
    );
  }

  // O widget será renderizado pelo SDK no container
  return (
    <div className="fixed inset-0 z-50">
      <div id="belvo-widget" className="w-full h-full"></div>
    </div>
  );
};

export default BelvoWidget;
