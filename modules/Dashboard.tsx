import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const data = [
  { name: 'Jan', risk: 40, secure: 24 },
  { name: 'Feb', risk: 30, secure: 13 },
  { name: 'Mar', risk: 20, secure: 58 },
  { name: 'Apr', risk: 27, secure: 39 },
  { name: 'May', risk: 18, secure: 48 },
  { name: 'Jun', risk: 23, secure: 38 },
  { name: 'Jul', risk: 34, secure: 43 },
];

const instrumentData = [
  { name: 'Notices', value: 12 },
  { name: 'Bills', value: 8 },
  { name: 'Affidavits', value: 4 },
  { name: 'Trusts', value: 2 },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export const DashboardModule: React.FC = () => {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Cockpit</h2>
        <p className="text-slate-400">System overview and telemetry.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-slate-500 text-xs font-mono uppercase mb-1">Active Instruments</div>
          <div className="text-3xl font-bold text-white">24</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-slate-500 text-xs font-mono uppercase mb-1">Risk Exposure</div>
          <div className="text-3xl font-bold text-emerald-400">Low</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-slate-500 text-xs font-mono uppercase mb-1">Secured Assets</div>
          <div className="text-3xl font-bold text-blue-400">8</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl backdrop-blur-sm h-80">
          <h3 className="text-lg font-semibold text-white mb-6">Remedy Timeline</h3>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSecure" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} />
              <YAxis stroke="#64748b" tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area type="monotone" dataKey="secure" stroke="#10b981" fillOpacity={1} fill="url(#colorSecure)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl backdrop-blur-sm h-80">
           <h3 className="text-lg font-semibold text-white mb-6">Instrument Type Distribution</h3>
           <ResponsiveContainer width="100%" height="80%">
             <BarChart data={instrumentData}>
               <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
               <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} />
               <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
               />
               <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                 {instrumentData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};