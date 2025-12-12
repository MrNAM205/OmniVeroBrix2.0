import { KeyPair } from '../types';

export const cryptoService = {
  // Deterministic SHA-256 Hashing
  async sha256(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Simulate generating a secure keypair (Simplified for demo, usually uses subtle.generateKey)
  async generateKeyPair(): Promise<KeyPair> {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // In a real app, we would use crypto.subtle.generateKey
    // and export the JWKs properly. For UI demonstration:
    return {
      id,
      algorithm: 'ECDSA-P256',
      publicJwk: { kty: 'EC', crv: 'P-256', x: '...', y: '...' },
      privateJwkEncrypted: 'AES-GCM::' + await this.sha256(id + timestamp), // Simulated encryption
      createdAt: timestamp,
    };
  }
};