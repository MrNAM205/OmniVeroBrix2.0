import React, { useState, useEffect } from 'react';
import { Persona, KeyPair } from '../types';
import { cryptoService } from '../services/cryptoService';

export const IdentityModule: React.FC = () => {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [keys, setKeys] = useState<KeyPair[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedP = localStorage.getItem('omni_persona');
    if (storedP) setPersona(JSON.parse(storedP));
    
    const storedK = localStorage.getItem('omni_keys');
    if (storedK) setKeys(JSON.parse(storedK));
  }, []);

  const handleGenerateKey = async () => {
    setLoading(true);
    const newKey = await cryptoService.generateKeyPair();
    const updatedKeys = [...keys, newKey];
    setKeys(updatedKeys);
    localStorage.setItem('omni_keys', JSON.stringify(updatedKeys));
    setLoading(false);
  };

  const handleCreatePersona = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if(keys.length === 0) return alert("Generate a key first");

    const newPersona: Persona = {
      id: crypto.randomUUID(),
      givenName: formData.get('givenName') as string,
      familyName: formData.get('familyName') as string,
      tradeNameAllCaps: formData.get('tradeName') as string,
      domicileState: formData.get('domicile') as string,
      keyPairId: keys[0].id
    };

    setPersona(newPersona);
    localStorage.setItem('omni_persona', JSON.stringify(newPersona));
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Sovereign Identity</h2>
        <p className="text-slate-400">Manage cryptographic keys and commercial personas.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Key Management */}
        <section className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-emerald-400 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Key Vault
            </h3>
            <button 
              onClick={handleGenerateKey}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate New ECDSA Key'}
            </button>
          </div>

          <div className="space-y-4">
            {keys.length === 0 ? (
              <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
                No keys found in secure storage.
              </div>
            ) : (
              keys.map(k => (
                <div key={k.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs">
                  <div className="flex justify-between text-slate-400 mb-2">
                    <span>ID: {k.id.slice(0, 8)}...</span>
                    <span>{k.algorithm}</span>
                  </div>
                  <div className="text-emerald-500 break-all truncate">
                    PUB: {JSON.stringify(k.publicJwk).slice(0, 50)}...
                  </div>
                  <div className="mt-2 text-slate-600 text-[10px]">
                    Created: {new Date(k.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Persona Management */}
        <section className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
           <h3 className="text-xl font-semibold text-blue-400 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Persona Details
            </h3>

            {persona ? (
               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                      <label className="block text-xs text-slate-500 uppercase">Living Name</label>
                      <div className="text-white font-medium">{persona.givenName} {persona.familyName}</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                      <label className="block text-xs text-slate-500 uppercase">Domicile</label>
                      <div className="text-white font-medium">{persona.domicileState}</div>
                    </div>
                 </div>
                 <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <label className="block text-xs text-slate-500 uppercase">Trade Name (Entity)</label>
                    <div className="text-emerald-400 font-mono text-lg">{persona.tradeNameAllCaps}</div>
                 </div>
                 <button 
                  onClick={() => { localStorage.removeItem('omni_persona'); setPersona(null); }}
                  className="text-red-400 text-sm hover:underline"
                 >
                   Reset Persona
                 </button>
               </div>
            ) : (
              <form onSubmit={handleCreatePersona} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Given Name</label>
                    <input name="givenName" required className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Family Name</label>
                    <input name="familyName" required className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none" placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Trade Name (All Caps)</label>
                  <input name="tradeName" required className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none" placeholder="JOHN H DOE" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Domicile State</label>
                  <input name="domicile" required className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none" placeholder="New York" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-medium transition-colors">
                  Establish Persona
                </button>
              </form>
            )}
        </section>
      </div>
    </div>
  );
};