// Crypto & Identity
export interface KeyPair {
  id: string;
  algorithm: 'ECDSA-P256';
  publicJwk: JsonWebKey;
  privateJwkEncrypted: string;
  createdAt: string;
}

export interface Persona {
  id: string;
  givenName: string;
  familyName: string;
  tradeNameAllCaps: string;
  domicileState: string;
  keyPairId: string;
}

// Memory & Context
export interface MemoryNode {
  id: string;
  type: 'Entity' | 'Statute' | 'Fact';
  value: string;
  confidence: number;
  timestamp: string;
}

// Trust & Estate
export interface Trustee {
  id: string;
  name: string;
  role: 'Primary' | 'Successor';
}

export interface Successor {
  id: string;
  name: string;
  condition: string; // e.g., "If primary beneficiary predeceases"
}

export interface Beneficiary {
  id: string;
  name: string;
  priorityOrder: number;
  successors: Successor[];
  lapseRule: 'Per Stirpes' | 'Per Capita' | 'Lapse to Corpus';
}

export interface Asset {
  id: string;
  description: string;
  initialValue?: string;
}

export interface Trust {
  id: string;
  title: string;
  grantor: string;
  series: '98' | '61524' | 'Custom';
  trustees: Trustee[];
  beneficiaries: Beneficiary[];
  assets: Asset[];
  createdAt: string;
}

export interface RationaleBlock {
  summary: string;
  citations: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface GeneratedClause {
  markdown: string;
  rationales: RationaleBlock[];
}

// Instruments (JARVIS)
export interface InstrumentExtraction {
  // Metadata
  creditor?: string;
  accountNumber?: string;
  amount?: number;
  date?: string;
  
  // Intelligence Sections
  violationRisk: 'None' | 'Low' | 'High' | 'Critical';
  executiveSummary: string;
  identifiedEntities: string[]; // Names of people/corps found
  riskFactors: string[]; // Specific points of failure/violation
  strategicAction: string; // Recommended next step (e.g., "File Motion to Dismiss")
}

export interface Instrument {
  id: string;
  rawText?: string;
  fileData?: {
    mimeType: string;
    data: string; // base64
    name: string;
  };
  extraction?: InstrumentExtraction;
  hash: string;
  timestamp: string;
}

// App Navigation
export type ViewState = 'dashboard' | 'identity' | 'jarvis' | 'trust' | 'settings';