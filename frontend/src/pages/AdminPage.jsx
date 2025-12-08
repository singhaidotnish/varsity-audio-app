// frontend/src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5010';

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState({});
  const [message, setMessage] = useState('');

  // Simple password check (for demo)
  const handleLogin = (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    if (password === 'admin123' || password === process.env.ADMIN_PASSWORD) {
      setLoggedIn(true);
      fetchChapters();
    } else {
      alert('Incorrect password');
    }
  };

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/chapters`);
      const data = await response.json();
      if (data.success) {
        setChapters(data.chapters);
      }
    } catch (error) {
      setMessage('Error loading chapters: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (chapter) => {
    if (!confirm(`Convert "${chapter.title}" to audio?`)) return;
    
    setConverting({ ...converting, [chapter.id]: true });
    setMessage(`Converting "${chapter.title}"...`);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token' // In production, use real token
        },
        body: JSON.stringify({
          chapterId: chapter.id,
          title: chapter.title,
          text: 'Chapter content here...', // In real app, get from database
          moduleId: chapter.moduleId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ "${chapter.title}" converted! Audio URL: ${data.audioUrl}`);
        fetchChapters(); // Refresh list
      } else {
        setMessage(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setConverting({ ...converting, [chapter.id]: false });
    }
  };

  if (!loggedIn) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Login</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Admin Password
              </label>
              <input
                type="password"
                name="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter admin password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Login
            </button>
          </form>
          <p className="text-gray-500 text-sm mt-6">
            Contact system administrator for access
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Convert text to audio and manage content</p>
        </div>
        <button
          onClick={() => setLoggedIn(false)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Logout
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Chapters</h3>
          <p className="text-gray-600 text-sm mt-1">
            Convert text to audio using Google TTS. Audio files are uploaded to Cloudinary.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-3">Loading chapters...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chapter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chapters.map(chapter => (
                  <tr key={chapter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{chapter.moduleName}</div>
                      <div className="text-xs text-gray-500">ID: {chapter.moduleId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{chapter.title}</div>
                      <div className="text-xs text-gray-500">
                        {chapter.contentLength > 0 
                          ? `${chapter.contentLength} chars` 
                          : 'No content'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {chapter.hasAudio ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Converted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⏳ Pending
                        </span>
                      )}
                      {chapter.audioUrl && (
                        <a 
                          href={chapter.audioUrl} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                        >
                          (link)
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!chapter.hasAudio ? (
                        <button
                          onClick={() => handleConvert(chapter)}
                          disabled={converting[chapter.id]}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {converting[chapter.id] ? 'Converting...' : 'Convert to Audio'}
                        </button>
                      ) : (
                        <button
                          onClick={() => window.open(chapter.audioUrl, '_blank')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Play Audio
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-medium text-blue-900 mb-2">Total Chapters</h4>
          <div className="text-3xl font-bold text-blue-700">{chapters.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h4 className="font-medium text-green-900 mb-2">Converted</h4>
          <div className="text-3xl font-bold text-green-700">
            {chapters.filter(c => c.hasAudio).length}
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h4 className="font-medium text-yellow-900 mb-2">Pending</h4>
          <div className="text-3xl font-bold text-yellow-700">
            {chapters.filter(c => !c.hasAudio).length}
          </div>
        </div>
      </div>
    </div>
  );
}