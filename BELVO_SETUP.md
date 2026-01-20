# Integração Belvo - Open Finance

Este documento descreve como configurar e usar a integração com a Belvo para conectar bancos via Open Finance.

## O que é a Belvo?

A Belvo é uma plataforma de Open Finance que permite conectar contas bancárias de forma segura. Com ela, você pode:

- Conectar contas de diversos bancos brasileiros
- Acessar saldos e transações em tempo real
- Sincronizar dados financeiros automaticamente

## Pré-requisitos

1. Conta na Belvo (https://belvo.com)
2. Credenciais de API (Secret ID e Secret Password)
3. Node.js 18+ instalado

## Configuração

### 1. Obter Credenciais

1. Acesse o [Dashboard da Belvo](https://dashboard.belvo.com)
2. Crie uma conta ou faça login
3. Vá em **API Keys** e copie suas credenciais

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Belvo API Credentials
BELVO_SECRET_ID=seu_secret_id_aqui
BELVO_SECRET_PASSWORD=seu_secret_password_aqui

# Ambiente: 'sandbox' para testes, 'production' para produção
BELVO_ENV=sandbox
```

### 3. Executar Migration no Supabase

Execute a migration `002_belvo_links.sql` no seu banco Supabase:

```sql
-- Acesse o SQL Editor no Supabase Dashboard e execute o conteúdo de:
-- migrations/002_belvo_links.sql
```

### 4. Deploy no Render

Se estiver usando Render, adicione as variáveis de ambiente no dashboard:

1. Acesse seu serviço no Render
2. Vá em **Environment**
3. Adicione as variáveis `BELVO_SECRET_ID`, `BELVO_SECRET_PASSWORD` e `BELVO_ENV`

## Arquitetura

### Fluxo de Conexão

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────┐
│   Frontend  │────▶│ Belvo Widget │────▶│   Backend   │────▶│  Belvo  │
│  (React)    │     │   (SDK)      │     │  (Express)  │     │   API   │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────┘
       │                   │                    │                  │
       │  1. Solicita      │                    │                  │
       │     token         │                    │                  │
       │──────────────────▶│                    │                  │
       │                   │  2. Gera token     │                  │
       │                   │────────────────────▶                  │
       │                   │                    │  3. Retorna      │
       │                   │◀────────────────────  access token   │
       │  4. Abre widget   │                    │                  │
       │◀──────────────────│                    │                  │
       │                   │                    │                  │
       │  5. Usuário       │                    │                  │
       │     conecta banco │                    │                  │
       │                   │  6. Cria link      │                  │
       │                   │────────────────────────────────────────▶
       │                   │                    │  7. Retorna      │
       │                   │◀────────────────────────────────────────
       │                   │     link_id       │                  │
       │  8. Callback      │                    │                  │
       │     com link_id   │                    │                  │
       │◀──────────────────│                    │                  │
       │                   │                    │                  │
       │  9. Registra link │                    │                  │
       │──────────────────────────────────────▶│                  │
       │                   │                    │  10. Busca       │
       │                   │                    │      contas      │
       │                   │                    │─────────────────▶│
       │                   │                    │◀─────────────────│
       │  11. Retorna      │                    │                  │
       │      contas       │                    │                  │
       │◀──────────────────────────────────────│                  │
```

### Arquivos Principais

```
├── services/
│   └── belvo.service.js      # Serviço com funções da API Belvo
├── controllers/
│   └── belvo.controller.js   # Controllers dos endpoints
├── routes/
│   └── belvo.routes.js       # Definição das rotas
├── components/
│   ├── BelvoWidget.tsx       # Componente do widget
│   └── Settings.tsx          # Tela de configurações (atualizada)
├── services/
│   └── api.ts                # Cliente API (atualizado)
└── migrations/
    └── 002_belvo_links.sql   # Migration do banco
```

## Endpoints da API

### Status
```
GET /api/belvo/status
```
Verifica se a Belvo está configurada.

### Widget Token
```
POST /api/belvo/widget-token
Body: { link_id?: string }
```
Gera token de acesso para o widget.

### Instituições
```
GET /api/belvo/institutions?country=BR
```
Lista bancos disponíveis.

### Registrar Link
```
POST /api/belvo/register-link
Body: { link_id, user_id, institution }
```
Registra uma conexão após o widget.

### Links do Usuário
```
GET /api/belvo/links?user_id=xxx
```
Lista conexões do usuário.

### Contas
```
GET /api/belvo/accounts/:linkId
```
Busca contas de uma conexão.

### Transações
```
GET /api/belvo/transactions/:linkId?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```
Busca transações de uma conexão.

### Sincronizar
```
POST /api/belvo/sync/:linkId
Body: { user_id }
```
Atualiza dados de uma conexão.

### Desconectar
```
DELETE /api/belvo/links/:linkId
Body: { user_id }
```
Remove uma conexão.

## Ambientes

### Sandbox (Desenvolvimento)

- URL: `https://sandbox.belvo.com`
- Use credenciais de sandbox
- Bancos fictícios para testes
- Dados simulados

### Production (Produção)

- URL: `https://api.belvo.com`
- Requer certificação da Belvo
- Bancos reais
- Dados reais dos usuários

## Bancos Suportados (Brasil)

A Belvo suporta os principais bancos brasileiros via Open Finance:

- Banco do Brasil
- Bradesco
- Caixa Econômica Federal
- Itaú
- Santander
- Nubank
- Inter
- C6 Bank
- BTG Pactual
- E muitos outros...

## Segurança

### Boas Práticas

1. **Nunca exponha credenciais no frontend**
   - As credenciais da Belvo ficam apenas no backend
   - O frontend usa apenas o token temporário do widget

2. **Use HTTPS em produção**
   - Todas as comunicações devem ser criptografadas

3. **Valide o user_id**
   - Sempre verifique se o usuário tem permissão para acessar os dados

4. **Implemente RLS no Supabase**
   - A migration já inclui políticas de Row Level Security

### Dados Sensíveis

- Credenciais bancárias são processadas diretamente pela Belvo
- Seu backend nunca tem acesso às senhas dos usuários
- Apenas o `link_id` é armazenado para referência

## Troubleshooting

### Erro: "Belvo não configurado"

Verifique se as variáveis de ambiente estão definidas:
```bash
echo $BELVO_SECRET_ID
echo $BELVO_SECRET_PASSWORD
```

### Erro: "Token inválido"

- Verifique se está usando as credenciais corretas para o ambiente
- Sandbox e Production têm credenciais diferentes

### Widget não carrega

- Verifique se o script da Belvo está sendo carregado
- Abra o console do navegador para ver erros

### Erro 401 na API

- Credenciais inválidas ou expiradas
- Verifique no dashboard da Belvo

## Recursos

- [Documentação Belvo](https://developers.belvo.com)
- [API Reference](https://developers.belvo.com/reference)
- [Dashboard Belvo](https://dashboard.belvo.com)
- [Status Page](https://status.belvo.com)

## Suporte

Para problemas com a integração Belvo:
- Email: support@belvo.com
- Documentação: https://developers.belvo.com
