# Configuração do Render

Este guia explica como fazer deploy do backend no Render.

## Status Atual

✅ **Frontend configurado** - Aponta para `https://finance-app-backend.onrender.com`  
✅ **Endpoint `/health` criado** - Agora responde corretamente  
✅ **Arquivo `render.yaml` criado** - Configuração do deploy

## Deploy no Render

### Opção 1: Deploy via Render Dashboard (Recomendado)

1. **Acesse Render.com**
   - Faça login em https://render.com
   - Ou crie uma conta gratuita

2. **Criar Novo Web Service**
   - Clique em "New +" → "Web Service"
   - Conecte seu repositório GitHub
   - Selecione o repositório: `gabriellasevero-ship-it/finance-app-backend`

3. **Configurar o Service**
   - **Name**: `finance-app-backend` (ou o nome que preferir)
   - **Region**: `Oregon (US West)` ou escolha a região mais próxima
   - **Branch**: `main`
   - **Root Directory**: Deixe vazio (raiz do projeto)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (para começar)

4. **Configurar Variáveis de Ambiente**
   
   No painel do Render, vá em **Environment** e adicione:
   
   ```
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   BELVO_SECRET_ID=your_belvo_secret_id (opcional)
   BELVO_SECRET_PASSWORD=your_belvo_password (opcional)
   ```
   
   ⚠️ **Importante**: Use o `SUPABASE_SERVICE_ROLE_KEY` (não a anon key) no backend!

5. **Deploy**
   - Clique em "Create Web Service"
   - O Render irá fazer o build e deploy automaticamente
   - Aguarde o deploy completar (pode levar alguns minutos)

6. **Obter a URL**
   - Após o deploy, você receberá uma URL: `https://finance-app-backend-xxxx.onrender.com`
   - Atualize o `BASE_URL` no arquivo `services/api.ts` se a URL for diferente

### Opção 2: Deploy via render.yaml

O arquivo `render.yaml` já está configurado. Para usar:

1. **Conecte o Repositório no Render**
   - Render pode detectar automaticamente o `render.yaml`
   - Crie um novo service e o Render usará a configuração do arquivo

2. **Configure as Variáveis de Ambiente**
   - No painel do Render, adicione as variáveis de ambiente manualmente
   - As variáveis marcadas com `sync: false` precisam ser configuradas no dashboard

## Verificar se está Funcionando

Após o deploy, teste os endpoints:

1. **Health Check**:
   ```bash
   curl https://finance-app-backend.onrender.com/health
   ```
   
   Deve retornar:
   ```json
   {
     "status": "ok",
     "message": "API rodando 🚀",
     "timestamp": "2024-..."
   }
   ```

2. **Root Endpoint**:
   ```bash
   curl https://finance-app-backend.onrender.com/
   ```
   
   Deve retornar: `API rodando 🚀`

3. **Teste no Frontend**:
   - Inicie o frontend localmente: `npm run dev`
   - Verifique o console do navegador
   - O dashboard deve mostrar se o backend está online

## Problemas Comuns

### Backend não responde

- Verifique se o service está rodando no Render dashboard
- Verifique os logs no Render para erros
- Confirme que a porta está configurada corretamente (PORT=10000 no Render)

### CORS Errors

- O backend já está configurado com `cors()`, mas se ainda tiver problemas:
  - Adicione o domínio do frontend nas configurações CORS do Render
  - Ou ajuste o CORS no `server.js` para permitir seu domínio específico

### Variáveis de Ambiente não funcionam

- Verifique se as variáveis estão configuradas no dashboard do Render
- Certifique-se de que não há espaços extras nas chaves/valores
- Reinicie o service após adicionar novas variáveis

### Build Falha

- Verifique os logs do build no Render
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se o `start` script está correto no `package.json`

## Atualizar o Deploy

Toda vez que você fizer push para o branch `main` no GitHub:

1. O Render detecta automaticamente a mudança
2. Inicia um novo build automaticamente
3. Faz deploy da nova versão

Você pode desabilitar o auto-deploy nas configurações se preferir fazer deploy manual.

## Próximos Passos

- [ ] Fazer deploy inicial no Render
- [ ] Testar os endpoints
- [ ] Atualizar `BASE_URL` no frontend se necessário
- [ ] Configurar domínio customizado (opcional)
- [ ] Configurar HTTPS (automático no Render)
