import { GoogleGenAI, Type } from "@google/genai";
import { InstrumentExtraction, GeneratedClause, Trust, MemoryNode } from "../types";

// NOTE: In production, API key should be handled via secure backend or env var
const API_KEY = process.env.API_KEY || ''; 

// Fallback mock if no key is present to prevent crash during demo preview
const isMock = !API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const geminiService = {
  
  async parseInstrument(input: { 
    text?: string, 
    file?: { mimeType: string, data: string },
    memoryContext?: MemoryNode[] 
  }): Promise<InstrumentExtraction> {
    
    if (isMock) {
      return new Promise(resolve => setTimeout(() => resolve({
        creditor: "MOCK CORP INC.",
        accountNumber: "123-456-789",
        amount: 1500.00,
        date: "2023-10-27",
        violationRisk: "Low",
        executiveSummary: "Standard billing statement detected. The document appears to be a monthly statement of account.",
        identifiedEntities: ["MOCK CORP INC.", "JOHN DOE"],
        riskFactors: ["No wet-ink signature detected", "Ambiguous interest calculation"],
        strategicAction: "Send Request for Validation of Debt (FDCPA 809)."
      }), 1500));
    }

    if (!ai) throw new Error("AI not initialized");

    const parts: any[] = [];
    
    if (input.file) {
      parts.push({
        inlineData: {
          mimeType: input.file.mimeType,
          data: input.file.data
        }
      });
      parts.push({
        text: "Analyze this document image/PDF."
      });
    }

    if (input.text) {
      parts.push({
        text: input.text
      });
    }

    // Contextual Injection
    const memoryString = input.memoryContext 
      ? input.memoryContext.map(m => `- ${m.type}: ${m.value}`).join('\n') 
      : "No prior context.";

    parts.push({
      text: `
      Role: You are a sovereign legal auditor and commercial instrument analyzer.
      
      Task: Analyze the provided commercial instrument.
      
      Context / Memory of User's Affairs:
      ${memoryString}
      
      Requirements:
      1. Extract metadata: creditor, accountNumber, amount, date.
      2. Analyze for 'violationRisk' (None, Low, High, Critical) based on FDCPA, TILA, and UCC violations.
      3. Create an 'executiveSummary' (2-3 sentences max).
      4. List 'identifiedEntities' (All caps names, Corporations).
      5. List 'riskFactors' (Specific clauses or omissions that are legally dangerous).
      6. Recommend a 'strategicAction' (e.g., "Accept for Value", "Conditional Acceptance", "Ignore").
      
      Format: JSON.
      `
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            creditor: { type: Type.STRING },
            accountNumber: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            violationRisk: { type: Type.STRING, enum: ["None", "Low", "High", "Critical"] },
            executiveSummary: { type: Type.STRING },
            identifiedEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            strategicAction: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}') as InstrumentExtraction;
  },

  async draftDeedOfTrust(trust: Trust): Promise<GeneratedClause> {
    if (isMock) {
      return new Promise(resolve => setTimeout(() => resolve({
        markdown: `# DEED OF TRUST: ${trust.title}\n\n**THIS INDENTURE**, made this ${new Date().toLocaleDateString()}...\n\n### Article I: Trust Purpose\nThe purpose of this Trust is to protect the assets...\n\n### Article II: Trustees\nThe initial Trustee shall be **${trust.trustees.find(t => t.role === 'Primary')?.name || 'Undesignated'}**...`,
        rationales: [
          { summary: "Sovereign structure established", citations: ["Common Law"], riskLevel: "Low" },
          { summary: "Beneficiary anti-lapse included", citations: ["Uniform Trust Code § 112"], riskLevel: "Low" }
        ]
      }), 2000));
    }

    if (!ai) throw new Error("AI not initialized");

    const promptContext = JSON.stringify({
      title: trust.title,
      grantor: trust.grantor,
      trustees: trust.trustees,
      beneficiaries: trust.beneficiaries.map(b => ({
        name: b.name,
        successors: b.successors,
        lapseRule: b.lapseRule
      })),
      assets: trust.assets
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Draft a comprehensive Deed of Trust (Private Express Trust 98 Series style) based on the following structure.
      
      Structure: ${promptContext}
      
      Requirements:
      - Include comprehensive detailed clauses for Trustee powers, Beneficiary protections, and Anti-Lapse rules based on the provided input.
      - Ensure the tone is commercial, authoritative, and precise. Avoid "statutory trust" language; prefer "Indenture" and "Contract" terminology.
      - Explicitly distinguish between Legal Title (Trustees) and Equitable Title (Beneficiaries).
      - Return the Deed content in Markdown format.
      - Return a list of 'rationales' explaining key clauses and citations.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                markdown: { type: Type.STRING },
                rationales: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            summary: { type: Type.STRING },
                            citations: { type: Type.ARRAY, items: { type: Type.STRING } },
                            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
                        }
                    }
                }
            }
        }
      }
    });

    return JSON.parse(response.text || '{}') as GeneratedClause;
  },

  async draftTrustClause(context: any): Promise<GeneratedClause> {
    return this.draftDeedOfTrust({
      title: "Clause Generation Context",
      grantor: "N/A",
      series: 'Custom',
      trustees: [],
      beneficiaries: context.beneficiaries || [],
      assets: [],
      createdAt: new Date().toISOString(),
      id: "temp"
    });
  }
};