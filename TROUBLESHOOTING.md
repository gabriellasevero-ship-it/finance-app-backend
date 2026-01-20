# Troubleshooting - Tela em Branco

## Problemas Comuns e Soluções

### 1. Verificar Console do Navegador

Abra o DevTools do navegador (F12 ou Cmd+Option+I) e verifique:
- **Console** - Procure por erros em vermelho
- **Network** - Veja se há arquivos que não estão carregando (status 404)

### 2. Reiniciar o Servidor

Pare o servidor atual (Ctrl+C) e reinicie:

```bash
npm run dev
```

### 3. Limpar Cache e Node Modules

```bash
# Parar o servidor (Ctrl+C)
rm -rf node_modules
rm -rf dist
npm install
npm run dev
```

### 4. Verificar Porta

Certifique-se de que a porta 3000 está disponível:

```bash
# Ver processos na porta 3000
lsof -ti:3000

# Se houver processos, mate-os
kill -9 $(lsof -ti:3000)

# Depois reinicie
npm run dev
```

### 5. Verificar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
VITE_API_URL=https://finance-app-backend-1.onrender.com
GEMINI_API_KEY=your_key_here
```

**Importante**: Reinicie o servidor após criar/alterar o `.env.local`

### 6. Verificar Erros de Importação

Certifique-se de que todos os componentes estão importando corretamente. 
Erros comuns:
- Importações circulares
- Arquivos faltando
- Caminhos incorretos

### 7. Verificar se o Vite está Rodando

Ao executar `npm run dev`, você deve ver algo como:

```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

Se não aparecer, verifique os logs de erro.

### 8. Problemas Específicos

#### Erro: "Cannot find module"
- Execute `npm install` novamente
- Verifique se o arquivo existe

#### Erro: "Failed to load resource"
- Verifique se o servidor está rodando
- Verifique a URL no navegador

#### Erro relacionado a Supabase
- Verifique se as variáveis de ambiente estão configuradas
- Verifique se o Supabase está configurado corretamente

#### Erro relacionado a API
- Verifique se o backend no Render está rodando
- Verifique a URL no arquivo `services/api.ts`

### 9. Teste Básico

Crie um arquivo de teste simples para verificar se o React está funcionando:

```tsx
// App.tsx (versão simplificada para teste)
import React from 'react';

const App = () => {
  return <div>Teste - React está funcionando!</div>;
};

export default App;
```

Se isso funcionar, o problema está em algum componente específico.

### 10. Verificar Logs do Terminal

Olhe o terminal onde você executou `npm run dev`. Pode haver erros de compilação que não aparecem no navegador.

## Próximos Passos

Se nada funcionar:
1. Verifique os logs do terminal
2. Verifique o console do navegador
3. Copie e cole os erros aqui para análise mais detalhada
