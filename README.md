# finance-app-backend

App para gerenciar meus planos financeiros

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Estrutura do Projeto

Este repositório contém:

### Frontend (React + TypeScript)
- Aplicação web para gestão financeira
- Integração com Open Finance
- Análise inteligente com IA (Gemini)
- Interface responsiva

### Backend (Node.js + Express)
- API REST para conexão com instituições financeiras
- Integração com Belvo (Open Finance)
- Gerenciamento de dívidas e contas

## Run Locally - Frontend

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Run Locally - Backend

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```
   PORT=3000
   BELVO_SECRET_ID=your_belvo_secret_id
   BELVO_SECRET_PASSWORD=your_belvo_password
   ```

3. Run the server:
   ```bash
   npm start
   ```

## View in AI Studio

View your app in AI Studio: https://ai.studio/apps/drive/1kyT5jO9paDh70BTtg2J9aGphWpbyd93d
