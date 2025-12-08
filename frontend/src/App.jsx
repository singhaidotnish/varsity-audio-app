// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ModulesPage from './pages/ModulesPage';
import AdminPage from './pages/AdminPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5010';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        {/* Navbar - Matching Zerodha style */}
        <nav className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold">V</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Varsity Audio</span>
              </Link>
              
              <div className="hidden md:flex space-x-6">
                <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
                  Modules
                </Link>
                <Link to="/admin" className="text-gray-700 hover:text-blue-600 font-medium">
                  Admin
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a 
                href="https://wa.me/919999999999?text=Hi,%20I%20want%20to%20request%20audio%20for%20a%20chapter"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
              >
                📱 Request Audio
              </a>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <Routes>
            <Route path="/" element={<ModulesPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-12 py-8">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-600">© {new Date().getFullYear()} Varsity Audio</p>
                <p className="text-gray-500 text-sm mt-1">Audio companion for Zerodha Varsity</p>
              </div>
              <div className="text-gray-500 text-sm">
                <p>Audio hosted on Cloudinary • Admin panel for conversion</p>
                <p className="mt-1">For support: admin@varsityaudio.com</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;