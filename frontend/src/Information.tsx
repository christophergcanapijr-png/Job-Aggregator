import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ProfileData {
  name?: string;
  profile_pic?: string;
  sections?: Record<string, string>;
  error?: string;
}

const Information: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('Header Info');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // Set a longer timeout in case Selenium takes a while
      const response = await axios.get('http://localhost:8000/api/profile/onlinejobsph', { timeout: 60000 });
      setProfile(response.data);
      if (response.data.sections) {
        const keys = Object.keys(response.data.sections);
        if (keys.length > 0) {
          setActiveTab(keys[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching profile', error);
      setProfile({ error: 'Failed to connect to API or timed out.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Automated Browser is Running...</h2>
        <p className="text-gray-600">Please wait while Selenium securely logs in and extracts your data (this takes about 10-20 seconds).</p>
      </div>
    );
  }

  if (profile?.error) {
    return (
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Connection Error</h2>
        <p>{profile.error}</p>
        <p className="mt-4 text-gray-600">Please make sure you have connected your account in the Integrations tab.</p>
      </div>
    );
  }

  const sections = profile?.sections || {};
  const sectionKeys = Object.keys(sections);

  return (
    <div className="bg-white p-6 rounded shadow max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 border-b pb-2">Your True Extracted Profile</h2>
      
      {profile?.name && (
        <div className="mb-8 flex items-center gap-6 bg-blue-50 p-6 rounded-lg border border-blue-100">
          {profile.profile_pic && (
            <img 
              src={profile.profile_pic} 
              alt="Profile" 
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
            />
          )}
          <div>
            <p className="text-3xl font-bold text-blue-900">{profile.name}</p>
            <p className="text-blue-700 mt-1">Verified OnlineJobs.ph Account</p>
          </div>
        </div>
      )}

      {sectionKeys.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Tabs Sidebar */}
          <div className="w-full md:w-1/4 border-r pr-4">
            <ul className="space-y-2">
              {sectionKeys.map((key) => (
                <li key={key}>
                  <button
                    onClick={() => setActiveTab(key)}
                    className={`w-full text-left px-4 py-2 rounded transition-colors ${
                      activeTab === key 
                        ? 'bg-blue-100 text-blue-700 font-bold border-l-4 border-blue-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {key}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tab Content */}
          <div className="w-full md:w-3/4">
            <div className="bg-gray-50 p-6 rounded border min-h-[300px]">
              <h3 className="text-xl font-bold mb-4 text-gray-800">{activeTab}</h3>
              <div className="font-mono text-sm text-gray-700 whitespace-pre-wrap">
                {sections[activeTab]}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No profile sections could be extracted.</p>
      )}
    </div>
  );
};

export default Information;
