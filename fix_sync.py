import os
import re

file_path = "frontend/src/Integrations.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_sync = r"""  const handleSync = \(platform: string\) => \{
    const updatedHistory = \{ \.\.\.syncHistory, \[platform\]: new Date\(\)\.toISOString\(\) \};
    setSyncHistory\(updatedHistory\);
    localStorage\.setItem\('syncHistory', JSON\.stringify\(updatedHistory\)\);
  \};"""

new_sync = """  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});

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
  };"""

content = re.sub(old_sync, new_sync, content)

# update the sync button UI to show loading state
old_button = r"""<button onClick=\{\(\) => handleSync\(platform\.id\)\} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">Sync Now</button>"""
new_button = """<button onClick={() => handleSync(platform.id)} disabled={isSyncing[platform.id]} className={`flex-1 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm ${isSyncing[platform.id] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}>{isSyncing[platform.id] ? 'Syncing...' : 'Sync Now'}</button>"""

content = re.sub(old_button, new_button, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed handleSync")
