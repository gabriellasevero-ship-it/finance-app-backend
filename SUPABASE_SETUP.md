# Configuração do Supabase

Este projeto está configurado para usar Supabase como banco de dados. Siga os passos abaixo para configurar.

## 1. Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha:
   - **Name**: finance-app-backend (ou o nome que preferir)
   - **Database Password**: escolha uma senha forte
   - **Region**: escolha a região mais próxima (ex: South America - São Paulo)
5. Clique em "Create new project"

## 2. Obter as Chaves de API

Após criar o projeto:

1. Vá em **Settings** > **API**
2. Anote as seguintes informações:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: (chave pública, segura para usar no frontend)
   - **service_role key**: (chave privada, apenas para backend - NÃO exponha no frontend!)

## 3. Executar Migrations

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em "New query"
3. Abra o arquivo `migrations/001_initial_schema.sql` deste projeto
4. Cole todo o conteúdo SQL no editor
5. Clique em "Run" para executar

Isso criará todas as tabelas necessárias:
- `users` - Usuários
- `debts` - Dívidas
- `accounts` - Contas bancárias
- `institutions` - Instituições financeiras
- `alerts` - Alertas

## 4. Configurar Variáveis de Ambiente

### Frontend (.env.local)

Crie o arquivo `.env.local` na raiz do projeto:

```env
# Gemini API Key (para IA)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration (Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Backend (.env)

Crie o arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration (Backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Backend Configuration
PORT=3000
BELVO_SECRET_ID=your_belvo_secret_id
BELVO_SECRET_PASSWORD=your_belvo_secret_password
```

**⚠️ IMPORTANTE**: Nunca commite arquivos `.env` ou `.env.local` no Git!

## 5. Verificar Configuração

### Testar Frontend

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. O app deve carregar e usar Supabase se as variáveis estiverem configuradas.

### Testar Backend

1. Inicie o servidor:
   ```bash
   npm start
   ```

2. Acesse `http://localhost:3000` - deve retornar "API rodando 🚀"

## 6. Como Funciona

### Frontend
- Usa **VITE_SUPABASE_URL** e **VITE_SUPABASE_ANON_KEY** (chave pública)
- Se Supabase não estiver configurado, usa `localStorage` como fallback
- Os dados são sincronizados automaticamente com Supabase quando disponível

### Backend
- Usa **SUPABASE_URL** e **SUPABASE_SERVICE_ROLE_KEY** (chave privada)
- Tem acesso administrativo ao banco (bypass de RLS quando necessário)
- Usado para operações que precisam de permissões elevadas

## Troubleshooting

### Erro: "Supabase não configurado"
- Verifique se as variáveis de ambiente estão definidas corretamente
- No frontend, use o prefixo `VITE_` para variáveis
- Reinicie o servidor após alterar variáveis de ambiente

### Erro: "permission denied"
- Verifique se executou as migrations corretamente
- Verifique as políticas de RLS no Supabase (Settings > Authentication > Policies)
- Para desenvolvimento, as políticas estão configuradas para permitir acesso geral

### Dados não aparecem
- Verifique se o usuário tem um `id` válido
- Verifique os logs do console do navegador
- Verifique a aba Network para ver se as requisições estão sendo feitas

## Próximos Passos

- [ ] Configurar autenticação do Supabase (opcional)
- [ ] Ajustar políticas RLS para produção
- [ ] Configurar backups automáticos
- [ ] Configurar índices adicionais se necessário
