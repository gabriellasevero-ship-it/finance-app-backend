
import { GoogleGenAI, Type } from "@google/genai";
import { Debt, User } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getFinancialInsight = async (user: User, debts: Debt[]) => {
  if (!process.env.API_KEY) return "Aguardando chave de API para análise inteligente.";
  if (debts.length === 0) return "Parabéns! Você não possui dívidas registradas. Que tal começar um plano de liberdade financeira?";

  const prompt = `
    Você é um Consultor Estratégico de Open Finance.
    Nome do Usuário: ${user.nome}
    Renda: R$ ${user.salario_liquido}
    Lista de Dívidas: ${JSON.stringify(debts.filter(d => d.ativo))}

    Analise o impacto no fluxo de caixa. Priorize dívidas que liberam mais salário mensal.
    Dê um conselho tático direto, usando tom motivador e profissional.
    Não use introduções formais. Comece direto no ponto.
    Use Markdown para negritos.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro ao processar sua análise inteligente. Foque no controle do seu comprometimento mensal.";
  }
};

export const simulateScenario = async (debts: Debt[], windfall: number, priority: string) => {
  if (debts.length === 0) return null;

  const prompt = `
    Como consultor financeiro, simule o melhor uso de R$ ${windfall} para estas dívidas: ${JSON.stringify(debts.filter(d => d.ativo))}.
    O objetivo do usuário é: ${priority}.
    
    Retorne apenas um JSON válido.
    {
      "bestDebtId": "string (id da melhor dívida)",
      "monthlySavings": number (quanto de parcela será liberado),
      "monthsReduced": number (quantos meses a menos de dívida),
      "explanation": "string (uma frase curta explicando por que esta é a melhor opção)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bestDebtId: { type: Type.STRING },
            monthlySavings: { type: Type.NUMBER },
            monthsReduced: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          },
          required: ["bestDebtId", "monthlySavings", "monthsReduced", "explanation"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Simulation Error:", error);
    return null;
  }
};
