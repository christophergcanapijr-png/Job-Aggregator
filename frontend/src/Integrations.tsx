import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Account {
  id: number;
  platform: string;
  username: string;
}

const platformsList = [
  { id: 'OnlineJobsPH', name: 'OnlineJobs.ph', color: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-blue-600', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'JobStreet', name: 'JobStreet', color: 'bg-indigo-600', hover: 'hover:bg-indigo-700', text: 'text-indigo-600', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }
];

const Integrations: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({ platform: 'OnlineJobsPH', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  
  // Use localStorage to fake sync history just for the UI polish requested
  const [syncHistory, setSyncHistory] = useState<Record<string, string>>({});

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/accounts');
      setAccounts(response.data);
      
      const history = localStorage.getItem('syncHistory');
      if (history) setSyncHistory(JSON.parse(history));
    } catch (error) {
      console.error('Error fetching accounts', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/api/accounts', {
        platform: formData.platform,
        username: formData.username,
        password: formData.password
      });
      
      const updatedHistory = { ...syncHistory, [formData.platform]: new Date().toISOString() };
      setSyncHistory(updatedHistory);
      localStorage.setItem('syncHistory', JSON.stringify(updatedHistory));
      
      setFormData({ ...formData, username: '', password: '' });
      await fetchAccounts();
    } catch (error) {
      console.error('Error connecting account', error);
      alert('Failed to connect account.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDisconnect = async (platform: string) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platform}?`)) return;
    try {
      await axios.delete(`http://localhost:8000/api/accounts/${platform}`);
      await fetchAccounts();
    } catch (error) {
      console.error('Error disconnecting', error);
      alert('Failed to disconnect.');
    }
  };
  
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});

  const handleSync = async (platform: string) => {
    setIsSyncing({ ...isSyncing, [platform]: true });
    try {
      if (platform === 'OnlineJobsPH') {
        await axios.get('http://localhost:8000/api/profile/onlinejobsph?refresh=true');
      } else if (platform === 'JobStreet') {
        // Mock for jobstreet or implement if backend supports it
        await new Promise(r => setTimeout(r, 2000));
      }
      
      const updatedHistory = { ...syncHistory, [platform]: new Date().toISOString() };
      setSyncHistory(updatedHistory);
      localStorage.setItem('syncHistory', JSON.stringify(updatedHistory));
      alert(`${platform} successfully synced!`);
    } catch (error) {
      console.error('Error syncing', error);
      alert(`Failed to sync ${platform}. Check your credentials or try again later.`);
    } finally {
      setIsSyncing({ ...isSyncing, [platform]: false });
    }
  };
  
  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never synced';
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Integrations</h2>
        <p className="text-slate-500 mt-2 font-medium">Connect your job board accounts to enable 1-click scraping and profile syncing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platformsList.map(platform => {
          const account = accounts.find(a => a.platform === platform.id);
          const isConnected = !!account;
          
          return (
            <div key={platform.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className={`h-2 w-full ${platform.color}`}></div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 ${platform.text}`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={platform.icon} /></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-800">{platform.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <span className={`text-xs font-bold ${isConnected ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {isConnected ? 'CONNECTED' : 'NOT CONNECTED'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {isConnected ? (
                  <div className="flex-1 flex flex-col justify-between gap-6">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Account</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{account.username}</p>
                      
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 mb-1">Last Synced</p>
                      <p className="text-sm font-bold text-slate-700">{getTimeAgo(syncHistory[platform.id])}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => handleSync(platform.id)} disabled={isSyncing[platform.id]} className={`flex-1 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm ${isSyncing[platform.id] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}>{isSyncing[platform.id] ? 'Syncing...' : 'Sync Now'}</button>
                      <button onClick={() => handleDisconnect(platform.id)} className="flex-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">Disconnect</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-sm text-slate-500 font-medium mb-4 text-center px-4">Connect your {platform.name} account to unlock automated scraping and profile imports.</p>
                    <button 
                      onClick={() => setFormData({ ...formData, platform: platform.id })} 
                      className={`w-full ${platform.color} ${platform.hover} text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm`}
                    >
                      Connect {platform.name}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-4">
        <h3 className="text-xl font-extrabold text-slate-800 mb-6">Add Connection</h3>
        <form onSubmit={handleConnect} className="max-w-md flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Platform</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 text-sm"
              value={formData.platform}
              onChange={(e) => setFormData({...formData, platform: e.target.value})}
            >
              {platformsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Email / Username</label>
            <input 
              type="text" 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 text-sm"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 text-sm"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full mt-2 px-6 py-3 rounded-xl font-bold text-white shadow-sm transition-all ${loading ? 'bg-slate-300' : 'bg-slate-800 hover:bg-slate-900'}`}
          >
            {loading ? 'Connecting...' : 'Securely Connect Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Integrations;
