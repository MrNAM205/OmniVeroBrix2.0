import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ViewState } from './types';
import { DashboardModule } from './modules/Dashboard';
import { IdentityModule } from './modules/Identity';
import { JarvisModule } from './modules/Jarvis';
import { TrustBuilderModule } from './modules/TrustBuilder';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    // Check if user has seen disclaimer
    const hasSeen = localStorage.getItem('omni_disclaimer_accepted');
    if (!hasSeen) setShowDisclaimer(true);
  }, []);

  const acceptDisclaimer = () => {
    localStorage.setItem('omni_disclaimer_accepted', 'true');
    setShowDisclaimer(false);
  };

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <DashboardModule />;
      case 'identity': return <IdentityModule />;
      case 'jarvis': return <JarvisModule />;
      case 'trust': return <TrustBuilderModule />;
      default: return <DashboardModule />;
    }
  };

  return (
    <>
      <Layout currentView={view} setView={setView}>
        {renderView()}
      </Layout>

      {/* Legal Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full p-8 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-bold text-red-500 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              DISCLAIMER
            </h2>
            <div className="prose prose-invert prose-sm mb-6 text-slate-300">
              <p>
                <strong>OmniVeroBrix is a software tool, not a lawyer.</strong>
              </p>
              <p>
                The information, drafts, and analyses provided by this system are for educational and organizational purposes only. They do not constitute legal advice. Commercial law, trust law, and estate planning are highly jurisdiction-specific.
              </p>
              <p>
                You are solely responsible for verifying all outputs with qualified legal counsel before taking any action, filing any instrument, or executing any deed.
              </p>
            </div>
            <button 
              onClick={acceptDisclaimer}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded transition-colors"
            >
              I UNDERSTAND AND ACCEPT LIABILITY
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default App;