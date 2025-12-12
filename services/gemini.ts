import { GoogleGenAI, Type, Schema, Chat, Modality } from "@google/genai";
import { ParsedStatement } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for structured extraction
const transactionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING, description: "Date of transaction in YYYY-MM-DD format" },
    description: { type: Type.STRING, description: "Merchant or description" },
    amount: { type: Type.NUMBER, description: "Absolute value of the transaction amount" },
    type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
    category: { type: Type.STRING, description: "Category like Groceries, Utilities, Salary, Transfer, etc." },
  },
  required: ["date", "description", "amount", "type", "category"]
};

const summarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    accountHolder: { type: Type.STRING },
    accountNumber: { type: Type.STRING },
    statementPeriod: { type: Type.STRING },
    currency: { type: Type.STRING },
    totalIncome: { type: Type.NUMBER },
    totalExpenses: { type: Type.NUMBER },
    openingBalance: { type: Type.NUMBER },
    closingBalance: { type: Type.NUMBER },
  },
  required: ["totalIncome", "totalExpenses"]
};

const statementSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: summarySchema,
    transactions: {
      type: Type.ARRAY,
      items: transactionSchema
    },
    insights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3-5 short key financial patterns or anomalies found."
    }
  },
  required: ["summary", "transactions", "insights"]
};

export const extractFinancialData = async (fileBase64: string, mimeType: string): Promise<ParsedStatement> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          {
            text: "Analyze this bank statement. Extract all transactions, account summary details, and key insights strictly following the JSON schema."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: statementSchema,
        temperature: 0.1 // Low temperature for factual extraction
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as ParsedStatement;
  } catch (error) {
    console.error("Extraction error:", error);
    throw error;
  }
};

let chatSession: Chat | null = null;

export const initializeChat = (data: ParsedStatement) => {
  const context = JSON.stringify(data);
  const systemInstruction = `
    You are 'FinGuru', a witty, slightly sarcastic, yet highly competent financial advisor. 
    Think of yourself as a mix of a strict Indian parent and a stand-up comedian.

    **CORE PERSONALITY:**
    - **Humor:** Roast bad spending habits playfully. Praise good saving habits with exaggerated enthusiasm.
    - **Language:** You are fluently **Bilingual (English & Hindi/Hinglish)**. Switch naturally based on user input or for comedic effect.
    - **Tone:** Informal, conversational, but 100% accurate with numbers.

    **DATA CONTEXT:**
    ${context}

    **INSTRUCTIONS:**
    1. **Analyze Spending:** If the user asks about spending, don't just give a number. Add commentary. 
       (e.g., "$200 on Coffee? Bhai, do you drink liquid gold? ☕")
    2. **Advice:** Give actionable advice but keep it fun. 
       (e.g., "Stop ordering food. Your kitchen misses you. 🍳")
    3. **Accuracy:** Math must be perfect. No jokes about the actual numbers, only the *decisions*.
    4. **Formatting:** Use Markdown. Use bolding for emphasis. Use lists for breakdowns.
    5. **Currency:** Use ${data.summary.currency}.

    **KEY PHRASES TO USE SPARINGLY (For Flavor):**
    - "Paisa ped pe nahi ugta" (Money doesn't grow on trees)
    - "Savings ko aag laga di" (Set fire to savings)
    - "Ambani ho kya?" (Are you Ambani?)
    - "Kharcha pani control karo" (Control your daily expenses)

    If the user asks for a roast, go all out (respectfully).
    If the information is not in the statement, politely (and jokingly) say you can't see into the void.
  `;

  chatSession = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemInstruction,
    }
  });
};

export const sendMessageToAssistant = async (message: string): Promise<string> => {
  if (!chatSession) {
    throw new Error("Chat session not initialized");
  }

  try {
    const result = await chatSession.sendMessage({ message });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I encountered an error analyzing that request.";
  }
};

export const speakText = async (text: string): Promise<string> => {
  try {
    // Generate speech using Gemini TTS model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text: text }]
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' } // 'Kore' has a good natural tone
          }
        }
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error("No audio data received from Gemini TTS");
    }
    return audioData;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};