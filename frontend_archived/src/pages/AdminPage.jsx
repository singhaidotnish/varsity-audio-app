// frontend/src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5010';

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [modules, setModules] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState({ chapters: false, modules: false });
  const [converting, setConverting] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newModule, setNewModule] = useState({ name: '', description: '', color: '#4CAF50' });
  const [newChapter, setNewChapter] = useState({ 
    title: '', 
    description: '', 
    content: '', 
    moduleId: '', 
    pageUrl: '', 
    tags: '' 
  });

  // Authentication
  const adminToken = localStorage.getItem('adminToken') || import.meta.env.VITE_ADMIN_TOKEN;

  useEffect(() => {
    if (loggedIn) {
      if (activeTab === 'dashboard') {
        fetchDashboardStats();
      } else if (activeTab === 'modules') {
        fetchModules();
      } else if (activeTab === 'chapters') {
        fetchChapters();
      }
    }
  }, [loggedIn, activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    
    // Simple password check - in production, use proper authentication
    if (password === 'admin123' || password === import.meta.env.VITE_ADMIN_PASSWORD) {
      localStorage.setItem('adminToken', 'admin-token'); // Simple token
      setLoggedIn(true);
      showMessage('Login successful!', 'success');
    } else {
      showMessage('Incorrect password', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setLoggedIn(false);
    showMessage('Logged out successfully', 'success');
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // API Functions
  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      showMessage(`Error fetching stats: ${error.message}`, 'error');
    }
  };

  const fetchModules = async () => {
    setLoading({ ...loading, modules: true });
    try {
      const response = await axios.get(`${API_URL}/api/admin/modules`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (response.data.success) {
        setModules(response.data.modules);
      }
    } catch (error) {
      showMessage(`Error fetching modules: ${error.message}`, 'error');
    } finally {
      setLoading({ ...loading, modules: false });
    }
  };

  const fetchChapters = async () => {
    setLoading({ ...loading, chapters: true });
    try {
      const response = await axios.get(`${API_URL}/api/admin/chapters`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (response.data.success) {
        setChapters(response.data.chapters);
      }
    } catch (error) {
      showMessage(`Error fetching chapters: ${error.message}`, 'error');
    } finally {
      setLoading({ ...loading, chapters: false });
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/modules`,
        newModule,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      if (response.data.success) {
        showMessage('Module added successfully!', 'success');
        setShowAddModule(false);
        setNewModule({ name: '', description: '', color: '#4CAF50' });
        fetchModules();
      }
    } catch (error) {
      showMessage(`Error adding module: ${error.message}`, 'error');
    }
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    try {
      const chapterData = {
        ...newChapter,
        tags: newChapter.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await axios.post(
        `${API_URL}/api/admin/chapters`,
        chapterData,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      if (response.data.success) {
        showMessage('Chapter added successfully!', 'success');
        setShowAddChapter(false);
        setNewChapter({ 
          title: '', description: '', content: '', 
          moduleId: '', pageUrl: '', tags: '' 
        });
        fetchChapters();
      }
    } catch (error) {
      showMessage(`Error adding chapter: ${error.message}`, 'error');
    }
  };

  const handleConvertChapter = async (chapterId, chapterTitle) => {
    if (!confirm(`Convert "${chapterTitle}" to audio? This may take a few moments.`)) return;
    
    setConverting({ ...converting, [chapterId]: true });
    showMessage(`Converting "${chapterTitle}"...`, 'info');
    
    try {
      // First, get the full chapter content
      const chapterResponse = await axios.get(
        `${API_URL}/api/admin/chapters/${chapterId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      const chapter = chapterResponse.data.chapter;
      
      // Convert to audio
      const convertResponse = await axios.post(
        `${API_URL}/api/admin/chapters/${chapterId}/convert`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      if (convertResponse.data.success) {
        showMessage(`✅ "${chapterTitle}" converted successfully!`, 'success');
        fetchChapters();
      }
    } catch (error) {
      showMessage(`❌ Conversion failed: ${error.message}`, 'error');
    } finally {
      setConverting({ ...converting, [chapterId]: false });
    }
  };

  const handleDeleteChapter = async (chapterId, chapterTitle) => {
    if (!confirm(`Delete chapter "${chapterTitle}"? This action cannot be undone.`)) return;
    
    try {
      const response = await axios.delete(
        `${API_URL}/api/admin/chapters/${chapterId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      if (response.data.success) {
        showMessage(`Chapter "${chapterTitle}" deleted`, 'success');
        fetchChapters();
      }
    } catch (error) {
      showMessage(`Error deleting chapter: ${error.message}`, 'error');
    }
  };

  const handleBulkConvert = async () => {
    const pendingChapters = chapters.filter(c => c.audioStatus !== 'converted');
    if (pendingChapters.length === 0) {
      showMessage('No chapters need conversion', 'info');
      return;
    }
    
    if (!confirm(`Convert ${pendingChapters.length} chapters to audio? This may take a while.`)) return;
    
    const chapterIds = pendingChapters.map(c => c.id);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/chapters/bulk-convert`,
        { chapterIds },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      if (response.data.success) {
        showMessage(`Queued ${pendingChapters.length} chapters for conversion`, 'success');
        fetchChapters();
      }
    } catch (error) {
      showMessage(`Bulk conversion failed: ${error.message}`, 'error');
    }
  };

  // Login Screen
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Varsity Audio Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Convert Zerodha Varsity content to audio
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Admin Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign in
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Access restricted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Replace the existing header section with this */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-zerodha-blue">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage modules, chapters, and audio conversions</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Message Alert */}
      {message.text && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4`}>
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' :
            message.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {['dashboard', 'modules', 'chapters', 'audio'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-zerodha-orange text-zerodha-orange'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
            {/* Total Modules Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-zerodha-gray flex items-center justify-center">
                    <span className="text-zerodha-blue text-xl">📚</span>
                  </div>
                </div>
                <div className="ml-5">
                  <dt className="text-sm font-medium text-gray-500">Total Modules</dt>
                  <dd className="text-3xl font-bold text-gray-900">{stats.totalModules}</dd>
                </div>
              </div>
            </div>
                      
            {/* Total Chapters Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-zerodha-gray flex items-center justify-center">
                    <span className="text-zerodha-blue text-xl">📖</span>
                  </div>
                </div>
                <div className="ml-5">
                  <dt className="text-sm font-medium text-gray-500">Total Chapters</dt>
                  <dd className="text-3xl font-bold text-gray-900">{stats.totalChapters}</dd>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-zerodha-gray flex items-center justify-center">
                    <span className="text-zerodha-blue text-xl">🎵</span>
                  </div>
                </div>
                <div className="ml-5">
                  <dt className="text-sm font-medium text-gray-500">Converted Audio</dt>
                  <dd className="text-3xl font-bold text-gray-900">{stats.convertedChapters}</dd>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-zerodha-gray flex items-center justify-center">
                    <span className="text-zerodha-blue text-xl">⏳</span>
                  </div>
                </div>
                <div className="ml-5">
                  <dt className="text-sm font-medium text-gray-500">Pending</dt>
                  <dd className="text-3xl font-bold text-gray-900">{stats.pendingChapters}</dd>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === 'modules' && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Modules</h2>
              <button
                onClick={() => setShowAddModule(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add New Module
              </button>
            </div>

            {showAddModule && (
              <div className="mb-6 bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Add New Module</h3>
                <form onSubmit={handleAddModule}>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Module Name</label>
                      <input
                        type="text"
                        value={newModule.name}
                        onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={newModule.description}
                        onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Color</label>
                      <input
                        type="color"
                        value={newModule.color}
                        onChange={(e) => setNewModule({ ...newModule, color: e.target.value })}
                        className="mt-1 h-10 w-full"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save Module
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddModule(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {loading.modules ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-3">Loading modules...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {modules.map(module => (
                  <div key={module.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-zerodha-blue/50 transition-colors">
                    <div className="flex items-baseline">
                      <span className="text-xl font-bold text-zerodha-orange mr-3">#{module.id}</span>
                      <h3 className="text-lg font-medium text-gray-900 flex-grow">{module.name}</h3>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-zerodha-gray text-gray-700 rounded-full text-xs">
                          {module.chapterCount} chapters
                        </span>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: module.color || '#4CAF50' }}
                        ></div>
                      </div>
                    </div>
                    {module.description && (
                      <p className="text-gray-600 mt-3 ml-8 text-sm leading-relaxed">
                        {module.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chapters Tab */}
        {activeTab === 'chapters' && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Chapters</h2>
              <div className="flex space-x-3">
                <button
                  onClick={handleBulkConvert}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Bulk Convert Pending
                </button>
                <button
                  onClick={() => setShowAddChapter(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add New Chapter
                </button>
              </div>
            </div>

            {showAddChapter && (
              <div className="mb-6 bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Add New Chapter</h3>
                <form onSubmit={handleAddChapter}>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={newChapter.title}
                        onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        value={newChapter.description}
                        onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Content</label>
                      <textarea
                        value={newChapter.content}
                        onChange={(e) => setNewChapter({ ...newChapter, content: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        rows="5"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Module</label>
                      <select
                        value={newChapter.moduleId}
                        onChange={(e) => setNewChapter({ ...newChapter, moduleId: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select a module</option>
                        {modules.map(module => (
                          <option key={module.id} value={module.id}>
                            {module.name} (ID: {module.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Page URL (Optional)</label>
                      <input
                        type="url"
                        value={newChapter.pageUrl}
                        onChange={(e) => setNewChapter({ ...newChapter, pageUrl: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://zerodha.com/varsity/chapters/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={newChapter.tags}
                        onChange={(e) => setNewChapter({ ...newChapter, tags: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="module-12, psychology, trading"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save Chapter
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddChapter(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {loading.chapters ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-3">Loading chapters...</p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-zerodha-gray">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zerodha-blue uppercase tracking-wider">Module</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zerodha-blue uppercase tracking-wider">Chapter</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zerodha-blue uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zerodha-blue uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {chapters.map(chapter => (
                      <tr key={chapter.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{chapter.moduleName}</div>
                          <div className="text-sm text-gray-500">ID: {chapter.moduleId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{chapter.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {chapter.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            chapter.audioStatus === 'converted' ? 'bg-green-100 text-green-800' :
                            chapter.audioStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            chapter.audioStatus === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {chapter.audioStatus || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {chapter.audioStatus !== 'converted' && (
                              <button
                                onClick={() => handleConvertChapter(chapter.id, chapter.title)}
                                disabled={converting[chapter.id]}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
                              >
                                {converting[chapter.id] ? 'Converting...' : 'Convert'}
                              </button>
                            )}
                            {chapter.audioUrl && (
                              <a
                                href={chapter.audioUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                              >
                                Play
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteChapter(chapter.id, chapter.title)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Audio Management</h2>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">TTS Service Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-3 ${
                        adminToken ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span>Authentication: {adminToken ? 'Connected' : 'Not connected'}</span>
                    </div>
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-3 ${
                        API_URL ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span>API Server: {API_URL}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleBulkConvert}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-left"
                    >
                      Convert All Pending Chapters
                    </button>
                    <button
                      onClick={() => window.open(`${API_URL}/health`, '_blank')}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-left"
                    >
                      Check Server Health
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}