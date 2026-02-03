import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Moon, Sun, Cpu, Cloud, 
  Shield, Save, Check, AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function Settings({ onClose }) {
  const [settings, setSettings] = useState({
    localOnlyMode: false,
    aiProvider: 'gemini',
    theme: 'dark',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/generate/settings`);
      if (response.ok) {
        const result = await response.json();
        setSettings(prev => ({ ...prev, ...result.data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch(`${API_URL}/generate/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Auto-save for important settings
    if (key === 'localOnlyMode' || key === 'aiProvider') {
      try {
        const response = await fetch(`${API_URL}/generate/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });
        if (response.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        }
      } catch (error) {
        console.error('Failed to auto-save settings:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg mx-4 border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-gray-400" />
            <h2 className="text-xl font-bold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Local-Only Mode */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings.localOnlyMode ? 'bg-green-900/30' : 'bg-gray-700'}`}>
                  <Shield className={`w-5 h-5 ${settings.localOnlyMode ? 'text-green-400' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-medium text-white">Local-Only Mode</h3>
                  <p className="text-xs text-gray-500">
                    Use only local AI (Ollama) - no cloud services
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('localOnlyMode', !settings.localOnlyMode)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.localOnlyMode ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.localOnlyMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {settings.localOnlyMode && (
              <div className="mt-3 p-3 bg-green-900/20 rounded-lg border border-green-800/30">
                <p className="text-xs text-green-400 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Your data stays on your device. Requires Ollama running locally.
                </p>
              </div>
            )}
          </div>

          {/* AI Provider */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="font-medium text-white mb-3">AI Provider</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateSetting('aiProvider', 'gemini')}
                disabled={settings.localOnlyMode}
                className={`p-4 rounded-lg border transition-colors ${
                  settings.aiProvider === 'gemini' && !settings.localOnlyMode
                    ? 'bg-blue-900/30 border-blue-600 text-blue-400'
                    : 'bg-gray-700/50 border-gray-600 text-gray-400'
                } ${settings.localOnlyMode ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'}`}
              >
                <Cloud className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Gemini</p>
                <p className="text-xs text-gray-500">Cloud AI</p>
              </button>
              <button
                onClick={() => updateSetting('aiProvider', 'ollama')}
                className={`p-4 rounded-lg border transition-colors ${
                  settings.aiProvider === 'ollama' || settings.localOnlyMode
                    ? 'bg-green-900/30 border-green-600 text-green-400'
                    : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                <Cpu className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Ollama</p>
                <p className="text-xs text-gray-500">Local AI</p>
              </button>
            </div>
            {settings.localOnlyMode && (
              <p className="mt-2 text-xs text-gray-500">
                Local-only mode forces Ollama usage
              </p>
            )}
          </div>

          {/* Theme (placeholder) */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="font-medium text-white mb-3">Theme</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateSetting('theme', 'dark')}
                className={`p-3 rounded-lg border flex items-center gap-2 ${
                  settings.theme === 'dark'
                    ? 'bg-gray-700 border-gray-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span className="text-sm">Dark</span>
              </button>
              <button
                onClick={() => updateSetting('theme', 'light')}
                className={`p-3 rounded-lg border flex items-center gap-2 ${
                  settings.theme === 'light'
                    ? 'bg-gray-700 border-gray-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span className="text-sm">Light</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Light theme coming soon
            </p>
          </div>

          {/* Requirements Notice */}
          <div className="flex items-start gap-2 p-3 bg-yellow-900/20 rounded-lg border border-yellow-800/30">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-400/80">
              <p className="font-medium">Requirements:</p>
              <ul className="mt-1 space-y-1 text-yellow-400/60">
                <li>• Ollama: Install from ollama.ai and run locally</li>
                <li>• Gemini: Requires GEMINI_API_KEY in .env</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
