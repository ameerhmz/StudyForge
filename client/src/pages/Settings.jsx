import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Zap, 
  Cloud, 
  HardDrive,
  Info,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Settings() {
  const [settings, setSettings] = useState({
    aiProvider: 'groq',
    localOnlyMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState('checking');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
    checkOllamaStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/generate/settings`);
      setSettings(response.data.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        setOllamaStatus('available');
      } else {
        setOllamaStatus('unavailable');
      }
    } catch (error) {
      setOllamaStatus('unavailable');
    }
  };

  const saveSettings = async (newSettings) => {
    setSaving(true);
    setMessage(null);
    try {
      await axios.post(`${API_URL}/api/generate/settings`, newSettings);
      setSettings(newSettings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleProviderChange = (provider) => {
    const newSettings = { ...settings, aiProvider: provider };
    saveSettings(newSettings);
  };

  const handleLocalOnlyToggle = () => {
    const newSettings = { 
      ...settings, 
      localOnlyMode: !settings.localOnlyMode,
      aiProvider: !settings.localOnlyMode ? 'ollama' : settings.aiProvider
    };
    saveSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-400">Configure AI provider and privacy options</p>
            </div>
          </div>
        </motion.div>

        {/* Success/Error Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl border ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="space-y-6">
          {/* AI Provider Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">AI Provider</h2>
            </div>

            <p className="text-gray-400 mb-6">
              Choose which AI model to use for generating content
            </p>

            <div className="space-y-4">
              {/* Groq Option */}
              <button
                onClick={() => handleProviderChange('groq')}
                disabled={saving || settings.localOnlyMode}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  settings.aiProvider === 'groq' && !settings.localOnlyMode
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                } ${settings.localOnlyMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-orange-400 mt-1" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        Groq (Cloud) - Recommended
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        Ultra-fast inference with Llama 3.3 70B. Best speed and quality.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                          ✓ Always Available
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          ⚡ Ultra Fast
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          🦙 Llama 3.3 70B
                        </span>
                      </div>
                    </div>
                  </div>
                  {settings.aiProvider === 'groq' && !settings.localOnlyMode && (
                    <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Gemini Option */}
              <button
                onClick={() => handleProviderChange('gemini')}
                disabled={saving || settings.localOnlyMode}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  settings.aiProvider === 'gemini' && !settings.localOnlyMode
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                } ${settings.localOnlyMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Cloud className="w-6 h-6 text-blue-400 mt-1" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        Google Gemini (Cloud)
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        Fast, powerful, and reliable. Recommended for best results.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                          ✓ Always Available
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          ⚡ Fastest
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          ☁️ Requires Internet
                        </span>
                      </div>
                    </div>
                  </div>
                  {settings.aiProvider === 'gemini' && !settings.localOnlyMode && (
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Ollama Option */}
              <button
                onClick={() => handleProviderChange('ollama')}
                disabled={saving || settings.localOnlyMode || ollamaStatus === 'unavailable'}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  settings.aiProvider === 'ollama' || settings.localOnlyMode
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                } ${ollamaStatus === 'unavailable' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <HardDrive className="w-6 h-6 text-green-400 mt-1" />
                    <div>
                      <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                        Ollama (Local)
                        {ollamaStatus === 'checking' && (
                          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                        )}
                        {ollamaStatus === 'unavailable' && (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        {ollamaStatus === 'available'
                          ? '100% private - all processing happens on your device.'
                          : 'Ollama not detected. Install from ollama.com'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ollamaStatus === 'available' ? (
                          <>
                            <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                              🔒 100% Private
                            </span>
                            <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              💻 Works Offline
                            </span>
                            <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              🚀 No API Costs
                            </span>
                          </>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            ⚠️ Not Installed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {(settings.aiProvider === 'ollama' || settings.localOnlyMode) && 
                   ollamaStatus === 'available' && (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            </div>
          </motion.div>

          {/* Privacy Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold text-white">Privacy Mode</h2>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-2">Local-Only Mode</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Forces all AI processing to happen locally on your device. Your study materials never leave your computer.
                </p>
                {settings.localOnlyMode && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Shield className="w-4 h-4" />
                    <span>Privacy mode active - all data stays on your device</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLocalOnlyToggle}
                disabled={saving || ollamaStatus === 'unavailable'}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  settings.localOnlyMode ? 'bg-green-500' : 'bg-gray-600'
                } ${ollamaStatus === 'unavailable' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.localOnlyMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {ollamaStatus === 'unavailable' && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-sm text-yellow-400">
                  ⚠️ Local-only mode requires Ollama to be installed and running. Visit{' '}
                  <a 
                    href="https://ollama.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-yellow-300"
                  >
                    ollama.com
                  </a>
                  {' '}to install.
                </p>
              </div>
            )}
          </motion.div>

          {/* Data Privacy Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-2">Data Privacy Information</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div>
                    <p className="font-medium text-blue-300 mb-1">📤 What Data Leaves Your Device?</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Groq (Cloud):</strong> Your PDF content and questions are sent to Groq servers (ultra-fast Llama inference).</li>
                      <li><strong>Gemini (Cloud):</strong> Your PDF content, questions, and generated responses are sent to Google servers.</li>
                      <li><strong>Ollama (Local):</strong> Nothing. All processing happens on your device.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium text-blue-300 mb-1">💾 What Data is Stored Locally?</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Uploaded PDF files and extracted text</li>
                      <li>Generated syllabi, quizzes, and flashcards</li>
                      <li>Your study progress and quiz scores</li>
                      <li>Chat history with AI</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium text-green-300 mb-1">🔒 Privacy Recommendations</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Use <strong>Local-Only Mode</strong> for sensitive study materials</li>
                      <li>Groq/Gemini are fine for public/non-sensitive content</li>
                      <li>All data stays in your browser's storage</li>
                      <li>Clear your browser data to remove all information</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Current Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/30 border border-gray-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Current Configuration:</span>
              <div className="flex items-center gap-2">
                {settings.localOnlyMode ? (
                  <>
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium">Local-Only Mode Active</span>
                  </>
                ) : settings.aiProvider === 'ollama' ? (
                  <>
                    <HardDrive className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium">Using Local AI</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 font-medium">Using Cloud AI</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
