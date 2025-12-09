// frontend/src/pages/ModulesPage.jsx
import React, { useState, useEffect } from 'react';
import ModulesCard from '../components/ModulesCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5010';

export default function ModulesPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await fetch(`${API_URL}/api/modules`);
      const data = await response.json();
      
      if (data.success) {
        setModules(data.modules);
      } else {
        setError(data.error || 'Failed to load modules');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading modules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-red-800 font-medium mb-2">Error loading modules</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={fetchModules}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Learn Trading with Audio
        </h1>
        <p className="text-gray-600 text-lg max-w-3xl">
          Listen to Zerodha Varsity chapters on the go. Converted to high-quality audio 
          for your convenience. Chapters with audio are marked with 🎧 icon.
        </p>
      </div>

      {/* Modules Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(module => (
            <ModulesCard key={module.id} module={module} />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h3 className="font-medium text-gray-900 mb-4">Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {modules.length}
            </div>
            <div className="text-gray-600 text-sm">Modules</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {modules.reduce((total, mod) => total + mod.chapters.length, 0)}
            </div>
            <div className="text-gray-600 text-sm">Total Chapters</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {modules.reduce((total, mod) => 
                total + mod.chapters.filter(ch => ch.hasAudio).length, 0
              )}
            </div>
            <div className="text-gray-600 text-sm">Audio Available</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <a 
              href="https://wa.me/919999999999?text=Hi,%20I%20want%20to%20request%20audio%20for%20a%20chapter"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
            >
              Request Audio
            </a>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <div className="mr-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">ℹ️</span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Chapters with 🎧 icon have audio available</li>
              <li>• Click the play button to listen directly</li>
              <li>• Click "Request Audio" to ask admin to convert a chapter</li>
              <li>• Admin converts text to audio using Google TTS</li>
              <li>• Audio files are stored on Cloudinary for fast streaming</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}