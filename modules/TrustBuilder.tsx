import React, { useState } from 'react';
import { Beneficiary, GeneratedClause, Trustee, Asset, Successor, Trust } from '../types';
import { geminiService } from '../services/geminiService';

type Tab = 'parties' | 'assets' | 'drafting';

export const TrustBuilderModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('parties');
  
  // State for the Trust Entity
  const [trustTitle, setTrustTitle] = useState('New Sovereign Trust');
  const [trustSeries, setTrustSeries] = useState<'98' | '61524' | 'Custom'>('98');
  const [grantor, setGrantor] = useState('');
  
  const [trustees, setTrustees] = useState<Trustee[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  // Input State
  const [newTrusteeName, setNewTrusteeName] = useState('');
  const [newTrusteeRole, setNewTrusteeRole] = useState<'Primary' | 'Successor'>('Primary');
  
  const [newBenName, setNewBenName] = useState('');
  const [newBenLapse, setNewBenLapse] = useState<'Per Stirpes' | 'Per Capita' | 'Lapse to Corpus'>('Per Stirpes');
  
  // Temporary state for adding a successor to a specific beneficiary
  const [addingSuccToBenId, setAddingSuccToBenId] = useState<string | null>(null);
  const [newSuccName, setNewSuccName] = useState('');
  const [newSuccCondition, setNewSuccCondition] = useState('If primary predeceases');

  const [newAssetName, setNewAssetName] = useState('');
  
  const [generatedDeed, setGeneratedDeed] = useState<GeneratedClause | null>(null);
  const [drafting, setDrafting] = useState(false);

  // --- Handlers ---

  const addTrustee = () => {
    if (!newTrusteeName) return;
    setTrustees([...trustees, { id: crypto.randomUUID(), name: newTrusteeName, role: newTrusteeRole }]);
    setNewTrusteeName('');
  };

  const addBeneficiary = () => {
    if (!newBenName) return;
    setBeneficiaries([...beneficiaries, {
      id: crypto.randomUUID(),
      name: newBenName,
      priorityOrder: beneficiaries.length + 1,
      successors: [],
      lapseRule: newBenLapse
    }]);
    setNewBenName('');
  };

  const addSuccessor = (benId: string) => {
    if (!newSuccName) return;
    setBeneficiaries(prev => prev.map(b => {
      if (b.id === benId) {
        return {
          ...b,
          successors: [...b.successors, { id: crypto.randomUUID(), name: newSuccName, condition: newSuccCondition }]
        };
      }
      return b;
    }));
    setNewSuccName('');
    setAddingSuccToBenId(null);
  };

  const addAsset = () => {
    if (!newAssetName) return;
    setAssets([...assets, { id: crypto.randomUUID(), description: newAssetName }]);
    setNewAssetName('');
  };

  const handleDraftDeed = async () => {
    setDrafting(true);
    const trustData: Trust = {
        id: crypto.randomUUID(),
        title: trustTitle,
        grantor,
        series: trustSeries,
        trustees,
        beneficiaries,
        assets,
        createdAt: new Date().toISOString()
    };

    try {
      const result = await geminiService.draftDeedOfTrust(trustData);
      setGeneratedDeed(result);
    } catch (e) {
      console.error(e);
      alert("Drafting failed");
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
       <header>
        <h2 className="text-3xl font-bold text-white mb-2">Trust Architect</h2>
        <p className="text-slate-400">Construct private express trusts with AI-drafted succession clauses.</p>
      </header>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('parties')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'parties' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          1. Parties & Structure
        </button>
        <button 
          onClick={() => setActiveTab('assets')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'assets' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          2. Corpus & Assets
        </button>
        <button 
          onClick={() => setActiveTab('drafting')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'drafting' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          3. Deed Drafting
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 h-full pb-12">
        
        {/* TAB 1: PARTIES */}
        {activeTab === 'parties' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Trust Info & Grantor */}
            <div className="space-y-6">
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Trust Basics</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs text-slate-500 mb-1 uppercase">Trust Name</label>
                        <input 
                        value={trustTitle} onChange={e => setTrustTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1 uppercase">Series</label>
                        <select 
                            value={trustSeries} onChange={e => setTrustSeries(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none focus:border-emerald-500"
                        >
                            <option value="98">98 Series</option>
                            <option value="61524">61524 Series</option>
                            <option value="Custom">Custom</option>
                        </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1 uppercase">Grantor / Settlor</label>
                    <input 
                      value={grantor} onChange={e => setGrantor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none focus:border-emerald-500"
                      placeholder="Full Legal Name"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Board of Trustees</h3>
                <div className="flex space-x-2 mb-4">
                  <input 
                    value={newTrusteeName} onChange={e => setNewTrusteeName(e.target.value)}
                    placeholder="Trustee Name"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none focus:border-emerald-500"
                  />
                  <select 
                    value={newTrusteeRole} onChange={e => setNewTrusteeRole(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 text-white text-sm outline-none"
                  >
                    <option value="Primary">Primary</option>
                    <option value="Successor">Successor</option>
                  </select>
                  <button onClick={addTrustee} className="bg-slate-800 hover:bg-slate-700 text-white px-3 rounded">+</button>
                </div>
                <div className="space-y-2">
                  {trustees.map(t => (
                    <div key={t.id} className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800/50">
                      <span className="text-sm text-slate-200">{t.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${t.role === 'Primary' ? 'bg-blue-900 text-blue-300' : 'bg-slate-800 text-slate-400'}`}>{t.role}</span>
                    </div>
                  ))}
                  {trustees.length === 0 && <p className="text-xs text-slate-600 italic">No trustees defined.</p>}
                </div>
              </section>
            </div>

            {/* Beneficiaries */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
              <h3 className="text-lg font-semibold text-white mb-4">Beneficiaries</h3>
              
              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 mb-6">
                <div className="grid grid-cols-2 gap-2 mb-2">
                   <input 
                      value={newBenName} onChange={e => setNewBenName(e.target.value)}
                      placeholder="Beneficiary Name"
                      className="col-span-2 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none focus:border-emerald-500"
                   />
                   <select 
                      value={newBenLapse} onChange={e => setNewBenLapse(e.target.value as any)}
                      className="col-span-2 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-xs outline-none"
                   >
                     <option value="Per Stirpes">Per Stirpes (Lineal Descendants)</option>
                     <option value="Per Capita">Per Capita (Equal Shares)</option>
                     <option value="Lapse to Corpus">Lapse to Corpus</option>
                   </select>
                </div>
                <button onClick={addBeneficiary} className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/50 py-2 rounded text-sm transition-colors">
                  Add Beneficiary Unit
                </button>
              </div>

              <div className="space-y-4">
                {beneficiaries.map((b) => (
                  <div key={b.id} className="bg-slate-950 p-4 rounded border border-slate-800">
                     <div className="flex justify-between items-start mb-2">
                       <div>
                         <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-900 text-emerald-400 flex items-center justify-center text-[10px] font-bold">{b.priorityOrder}</span>
                            <span className="text-sm font-medium text-white">{b.name}</span>
                         </div>
                         <div className="text-[10px] text-slate-500 mt-1 ml-7">Rule: {b.lapseRule}</div>
                       </div>
                       <button 
                         onClick={() => setAddingSuccToBenId(addingSuccToBenId === b.id ? null : b.id)}
                         className="text-xs text-blue-400 hover:text-blue-300"
                       >
                         + Successor
                       </button>
                     </div>

                     {/* Successor List */}
                     {(b.successors.length > 0 || addingSuccToBenId === b.id) && (
                       <div className="ml-7 mt-3 pl-3 border-l border-slate-800 space-y-2">
                         {b.successors.map(s => (
                           <div key={s.id} className="text-xs text-slate-400">
                             <span className="text-slate-300">↳ {s.name}</span> <span className="opacity-50">({s.condition})</span>
                           </div>
                         ))}
                         
                         {addingSuccToBenId === b.id && (
                           <div className="bg-slate-900 p-2 rounded mt-2 border border-slate-800">
                             <input 
                               value={newSuccName} onChange={e => setNewSuccName(e.target.value)}
                               placeholder="Successor Name"
                               className="w-full bg-transparent border-b border-slate-700 text-white text-xs py-1 mb-2 outline-none"
                             />
                             <input 
                               value={newSuccCondition} onChange={e => setNewSuccCondition(e.target.value)}
                               placeholder="Condition (e.g. Death of Primary)"
                               className="w-full bg-transparent border-b border-slate-700 text-slate-400 text-xs py-1 mb-2 outline-none"
                             />
                             <div className="flex justify-end space-x-2">
                               <button onClick={() => setAddingSuccToBenId(null)} className="text-[10px] text-slate-500">Cancel</button>
                               <button onClick={() => addSuccessor(b.id)} className="text-[10px] text-emerald-400">Confirm</button>
                             </div>
                           </div>
                         )}
                       </div>
                     )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: ASSETS */}
        {activeTab === 'assets' && (
           <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2">
             <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
               <h3 className="text-lg font-semibold text-white mb-4">Schedule A: Corpus Assets</h3>
               <div className="flex space-x-2 mb-6">
                  <input 
                    value={newAssetName} onChange={e => setNewAssetName(e.target.value)}
                    placeholder="Describe Asset (e.g. 100oz Silver, Intellectual Property #123)"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none focus:border-emerald-500"
                  />
                  <button onClick={addAsset} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded text-sm font-medium">Add to Corpus</button>
               </div>
               
               <div className="space-y-2">
                  {assets.map((a, i) => (
                    <div key={a.id} className="flex items-center space-x-4 bg-slate-950 p-4 rounded border border-slate-800">
                      <div className="text-slate-600 font-mono text-xs">#{i + 1}</div>
                      <div className="text-slate-200 text-sm">{a.description}</div>
                    </div>
                  ))}
                  {assets.length === 0 && (
                    <div className="text-center py-8 text-slate-600 border-2 border-dashed border-slate-800 rounded">
                      No assets assigned to trust corpus yet.
                    </div>
                  )}
               </div>
             </section>
           </div>
        )}

        {/* TAB 3: DRAFTING */}
        {activeTab === 'drafting' && (
           <div className="h-full flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="lg:w-1/3 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Generation Controls</h3>
                  <p className="text-slate-400 text-xs mb-6">Review your parties and assets before generating the final instrument.</p>
                  
                  <ul className="space-y-2 text-sm text-slate-300 mb-6">
                    <li className="flex justify-between"><span>Series:</span> <span className="font-mono text-emerald-400">{trustSeries}</span></li>
                    <li className="flex justify-between"><span>Trustees:</span> <span className="font-mono text-white">{trustees.length}</span></li>
                    <li className="flex justify-between"><span>Beneficiaries:</span> <span className="font-mono text-white">{beneficiaries.length}</span></li>
                    <li className="flex justify-between"><span>Assets:</span> <span className="font-mono text-white">{assets.length}</span></li>
                  </ul>

                  <button 
                    onClick={handleDraftDeed}
                    disabled={drafting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-900/20 transition-all"
                  >
                    {drafting ? 'SYNTHESIZING DEED...' : 'GENERATE DEED OF TRUST'}
                  </button>
                </div>
              </div>

              <div className="lg:w-2/3 bg-slate-900/50 border border-slate-700 rounded-xl p-8 backdrop-blur-sm overflow-y-auto min-h-[500px]">
                {!generatedDeed ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                     <svg className="w-12 h-12 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                     <p>Ready to draft.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                     {/* Clause Content */}
                     <div className="prose prose-invert max-w-none">
                       <div className="font-serif text-lg leading-relaxed whitespace-pre-wrap">
                         {generatedDeed.markdown}
                       </div>
                     </div>
      
                     {/* Rationale & Audit */}
                     <div className="border-t border-slate-800 pt-6">
                       <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Dialogic Audit Trail</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {generatedDeed.rationales.map((r, i) => (
                           <div key={i} className="bg-slate-950 p-4 rounded border border-slate-800">
                             <div className="flex justify-between items-start mb-2">
                               <span className="text-xs font-bold text-slate-300">Rationale</span>
                               <span className={`text-[10px] px-2 py-0.5 rounded ${
                                 r.riskLevel === 'Low' ? 'bg-emerald-900 text-emerald-400' : 'bg-amber-900 text-amber-400'
                               }`}>
                                 Risk: {r.riskLevel}
                               </span>
                             </div>
                             <p className="text-xs text-slate-400 mb-2">{r.summary}</p>
                             <div className="flex flex-wrap gap-1">
                               {r.citations.map(c => (
                                 <span key={c} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                   {c}
                                 </span>
                               ))}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                  </div>
                )}
              </div>
           </div>
        )}

      </div>
    </div>
  );
};