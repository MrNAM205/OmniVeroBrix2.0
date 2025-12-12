import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Instrument, InstrumentExtraction, MemoryNode } from '../types';
import { geminiService } from '../services/geminiService';
import { cryptoService } from '../services/cryptoService';

export const JarvisModule: React.FC = () => {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Instrument | null>(null);
  const [file, setFile] = useState<{ name: string, data: string, mimeType: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History & Archives
  const [history, setHistory] = useState<Instrument[]>([]);
  const [navTab, setNavTab] = useState<'scanner' | 'archives'>('scanner');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('All');

  // Memory State
  const [memory, setMemory] = useState<MemoryNode[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'risk' | 'strategy'>('summary');

  useEffect(() => {
    const storedMem = localStorage.getItem('omni_memory');
    if (storedMem) setMemory(JSON.parse(storedMem));
    
    const storedHistory = localStorage.getItem('omni_history');
    if (storedHistory) setHistory(JSON.parse(storedHistory));
  }, []);

  const saveHistory = (newHistory: Instrument[]) => {
      setHistory(newHistory);
      localStorage.setItem('omni_history', JSON.stringify(newHistory));
  };

  const processFile = (fileToProcess: File) => {
    if (!fileToProcess) return;
    
    // Basic validation
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(fileToProcess.type)) {
        alert('Supported formats: PDF, PNG, JPG, WEBP');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      // Handle potential prefix issues if multiple commas exist (rare but possible), usually split(',')[1] is safe for DataURLs
      const base64Data = base64String.split(',')[1];
      setFile({
        name: fileToProcess.name,
        data: base64Data,
        mimeType: fileToProcess.type
      });
    };
    reader.readAsDataURL(fileToProcess);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim() && !file) return;
    setAnalyzing(true);
    
    try {
      const contentToHash = file ? file.data : text;
      const hash = await cryptoService.sha256(contentToHash);
      
      // Pass memory to AI for contextual analysis
      const extraction = await geminiService.parseInstrument({
        text: text,
        file: file ? { mimeType: file.mimeType, data: file.data } : undefined,
        memoryContext: memory
      });
      
      const instrument: Instrument = {
        id: crypto.randomUUID(),
        rawText: text,
        fileData: file || undefined,
        extraction,
        hash,
        timestamp: new Date().toISOString()
      };
      
      setResult(instrument);
      saveHistory([instrument, ...history]);
    } catch (e) {
      console.error(e);
      alert('Error parsing instrument');
    } finally {
      setAnalyzing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const commitToMemory = (type: 'Entity' | 'Fact', value: string) => {
    if (memory.some(m => m.value === value)) return;
    const newNode: MemoryNode = {
      id: crypto.randomUUID(),
      type,
      value,
      confidence: 1.0,
      timestamp: new Date().toISOString()
    };
    const updated = [...memory, newNode];
    setMemory(updated);
    localStorage.setItem('omni_memory', JSON.stringify(updated));
  };

  const clearMemory = () => {
    if(window.confirm("Purge all sovereign memory nodes?")) {
        setMemory([]);
        localStorage.removeItem('omni_memory');
    }
  };

  const groupedMemory = useMemo(() => {
    return memory.reduce((acc, node) => {
        (acc[node.type] = acc[node.type] || []).push(node);
        return acc;
    }, {} as Record<string, MemoryNode[]>);
  }, [memory]);

  const filteredHistory = useMemo(() => {
      return history.filter(h => {
          const matchSearch = (h.extraction?.creditor || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (h.extraction?.executiveSummary || '').toLowerCase().includes(searchQuery.toLowerCase());
          const matchRisk = filterRisk === 'All' || h.extraction?.violationRisk === filterRisk;
          return matchSearch && matchRisk;
      });
  }, [history, searchQuery, filterRisk]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">JARVIS <span className="text-emerald-500 text-sm font-normal uppercase tracking-widest ml-2">Instrument Parser</span></h2>
          <p className="text-slate-400 text-sm">Ingest commercial instruments. The system learns from previous extractions.</p>
        </div>
        <div className="flex space-x-2">
            <span className="text-xs font-mono text-slate-500 self-center">MEM_NODES: {memory.length}</span>
            <button onClick={clearMemory} className="text-xs text-red-900 hover:text-red-500 uppercase tracking-wider">Purge</button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* LEFT: Input/Archives Zone (3 Columns) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col space-y-0 h-full">
          {/* Tabs for Left Column */}
          <div className="flex border-b border-slate-800 mb-4">
              <button 
                  onClick={() => setNavTab('scanner')} 
                  className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wide transition-colors ${navTab === 'scanner' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  Scanner
              </button>
              <button 
                  onClick={() => setNavTab('archives')} 
                  className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wide transition-colors ${navTab === 'archives' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  Archives
              </button>
          </div>

          {navTab === 'scanner' ? (
              <div className="flex flex-col space-y-4 flex-1">
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all duration-200 ${
                    isDragging 
                      ? 'border-emerald-400 bg-emerald-900/30 scale-[1.02]' 
                      : file 
                        ? 'border-emerald-500 bg-emerald-950/20' 
                        : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
                  }`}
                >
                    <input type="file" accept=".pdf,image/png,image/jpeg" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                    
                    {!file ? (
                        <div className="text-center cursor-pointer w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                          {isDragging ? (
                              <>
                                <svg className="w-10 h-10 text-emerald-400 mx-auto mb-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm text-emerald-300 font-bold">DROP TO UPLOAD</p>
                              </>
                          ) : (
                              <>
                                <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <p className="text-xs text-slate-300 font-medium">Click or Drag File</p>
                                <p className="text-[10px] text-slate-500 mt-1">PDF, PNG, JPG</p>
                              </>
                          )}
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center">
                        <div className="p-2 bg-emerald-900/50 rounded mb-2">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-xs text-white truncate max-w-[150px]">{file.name}</span>
                        <button onClick={clearFile} className="text-[10px] text-red-400 mt-2 hover:underline">REMOVE</button>
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg flex-1 flex flex-col min-h-[150px]">
                    <textarea 
                    className="flex-1 bg-transparent p-3 text-xs font-mono text-slate-300 focus:outline-none resize-none"
                    placeholder="Paste raw text..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    />
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={analyzing || (!text && !file)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-900/20 transition-all text-sm tracking-wide"
                >
                    {analyzing ? 'ANALYZING...' : 'RUN PARSER'}
                </button>
              </div>
          ) : (
              <div className="flex flex-col space-y-4 flex-1 min-h-0">
                  <div className="space-y-2">
                      <input 
                          type="text" 
                          placeholder="Search creditor or content..." 
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <select 
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                          value={filterRisk}
                          onChange={(e) => setFilterRisk(e.target.value)}
                      >
                          <option value="All">All Risks</option>
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Low">Low</option>
                          <option value="None">None</option>
                      </select>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {filteredHistory.length === 0 ? (
                          <div className="text-center text-slate-600 text-xs py-4">No archives found.</div>
                      ) : (
                          filteredHistory.map((inst) => (
                              <div 
                                  key={inst.id} 
                                  onClick={() => setResult(inst)}
                                  className="bg-slate-900 border border-slate-800 p-3 rounded cursor-pointer hover:border-emerald-500/50 transition-colors group"
                              >
                                  <div className="flex justify-between items-start mb-1">
                                      <span className="font-bold text-xs text-white truncate max-w-[120px]">{inst.extraction?.creditor || 'Unknown'}</span>
                                      <span className={`text-[9px] px-1 rounded uppercase ${
                                          inst.extraction?.violationRisk === 'Critical' ? 'bg-red-900 text-red-300' :
                                          inst.extraction?.violationRisk === 'High' ? 'bg-orange-900 text-orange-300' :
                                          'bg-emerald-900 text-emerald-300'
                                      }`}>{inst.extraction?.violationRisk}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 mb-1">{new Date(inst.timestamp).toLocaleDateString()}</div>
                                  <div className="text-[10px] text-slate-400 truncate">{inst.extraction?.executiveSummary}</div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          )}
        </div>

        {/* CENTER: Output Analysis (6 Columns) */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900/50 border border-slate-700 rounded-lg backdrop-blur-sm flex flex-col overflow-hidden">
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
              <div className="w-16 h-16 border-2 border-slate-800 rounded-full flex items-center justify-center mb-4">
                <div className="w-2 h-2 bg-slate-700 rounded-full animate-ping"></div>
              </div>
              <p className="text-xs font-mono uppercase tracking-widest">Awaiting Signal</p>
            </div>
          ) : (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
               {/* Result Header */}
               <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-start">
                 <div>
                    <h3 className="text-white font-bold">{result.extraction?.creditor || 'Unknown Entity'}</h3>
                    <div className="flex items-center space-x-2 text-xs mt-1">
                        <span className="text-slate-400">Hash: {result.hash.slice(0, 8)}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-emerald-500">${result.extraction?.amount?.toFixed(2)}</span>
                    </div>
                 </div>
                 <div className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                    result.extraction?.violationRisk === 'Critical' ? 'bg-red-500 text-white animate-pulse' :
                    result.extraction?.violationRisk === 'High' ? 'bg-orange-600 text-white' :
                    result.extraction?.violationRisk === 'Low' ? 'bg-amber-600 text-white' :
                    'bg-emerald-600 text-white'
                 }`}>
                    {result.extraction?.violationRisk} RISK
                 </div>
               </div>

               {/* Tabs */}
               <div className="flex border-b border-slate-800 bg-slate-950/30">
                  <button onClick={() => setActiveTab('summary')} className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider ${activeTab === 'summary' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}>Executive</button>
                  <button onClick={() => setActiveTab('risk')} className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider ${activeTab === 'risk' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}>Risk Analysis</button>
                  <button onClick={() => setActiveTab('strategy')} className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider ${activeTab === 'strategy' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}>Strategy</button>
               </div>

               {/* Tab Content */}
               <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'summary' && (
                      <div className="space-y-6">
                          <div>
                              <h4 className="text-slate-500 text-[10px] uppercase font-bold mb-2">Executive Summary</h4>
                              <p className="text-slate-200 text-sm leading-relaxed">{result.extraction?.executiveSummary}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                  <div className="text-slate-500 text-[10px] uppercase">Account Number</div>
                                  <div className="text-white font-mono text-sm">{result.extraction?.accountNumber || 'N/A'}</div>
                              </div>
                              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                  <div className="text-slate-500 text-[10px] uppercase">Statement Date</div>
                                  <div className="text-white font-mono text-sm">{result.extraction?.date || 'N/A'}</div>
                              </div>
                          </div>

                          <div>
                              <h4 className="text-slate-500 text-[10px] uppercase font-bold mb-2">Entities Detected</h4>
                              <div className="flex flex-wrap gap-2">
                                  {result.extraction?.identifiedEntities?.map((ent, i) => (
                                      <div key={i} className="flex items-center bg-slate-800 rounded px-2 py-1 border border-slate-700">
                                          <span className="text-xs text-white mr-2">{ent}</span>
                                          <button 
                                            onClick={() => commitToMemory('Entity', ent)}
                                            className="text-[10px] text-emerald-500 hover:text-emerald-300 border-l border-slate-600 pl-2"
                                            title="Add to Memory Rail"
                                          >
                                            +MEM
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'risk' && (
                      <div className="space-y-4">
                          <h4 className="text-slate-500 text-[10px] uppercase font-bold">Detected Vulnerabilities</h4>
                          {result.extraction?.riskFactors?.length ? (
                              <ul className="space-y-2">
                                  {result.extraction.riskFactors.map((factor, i) => (
                                      <li key={i} className="flex items-start space-x-3 bg-red-950/20 p-3 rounded border border-red-900/30">
                                          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                          </svg>
                                          <span className="text-sm text-red-200">{factor}</span>
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <div className="text-center text-slate-500 text-sm py-8">No specific statutory risks detected.</div>
                          )}
                      </div>
                  )}

                  {activeTab === 'strategy' && (
                      <div className="space-y-4">
                          <div className="bg-emerald-950/20 p-4 rounded border border-emerald-900/30">
                              <h4 className="text-emerald-400 text-xs font-bold uppercase mb-2">Recommended Remedy</h4>
                              <p className="text-emerald-100 text-sm leading-relaxed">{result.extraction?.strategicAction}</p>
                          </div>
                          <div className="text-xs text-slate-500">
                              *Disclaimer: This strategic output is algorithmic and does not constitute legal counsel. Verify all claims independently.
                          </div>
                      </div>
                  )}
               </div>
            </div>
          )}
        </div>

        {/* RIGHT: Memory Rail (3 Columns) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
           <div className="p-3 bg-slate-900 border-b border-slate-800">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Memory Context</h3>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {memory.length === 0 ? (
                  <div className="text-center mt-10 opacity-30">
                      <svg className="w-10 h-10 mx-auto text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <span className="text-xs text-slate-500">NO ENGRAMS</span>
                  </div>
              ) : (
                Object.entries(groupedMemory).map(([type, nodes]) => (
                    <div key={type} className="animate-in fade-in slide-in-from-right-4">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1 border-l-2 border-slate-800">{type}s</div>
                        <div className="space-y-2">
                            {nodes.map((mem) => (
                                <div key={mem.id} className="group relative bg-slate-900 border border-slate-800 rounded p-2 hover:border-slate-600 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="text-xs text-slate-300 font-medium truncate w-[90%]" title={mem.value}>{mem.value}</div>
                                        <button 
                                            onClick={() => {
                                                const updated = memory.filter(m => m.id !== mem.id);
                                                setMemory(updated);
                                                localStorage.setItem('omni_memory', JSON.stringify(updated));
                                            }}
                                            className="text-slate-600 hover:text-red-400 ml-1"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                    <div className="mt-1 flex justify-between items-center">
                                         <span className="text-[9px] text-slate-600 font-mono">{new Date(mem.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
              )}
           </div>
        </div>

      </div>
    </div>
  );
};