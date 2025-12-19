import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ModulesPage from './pages/ModulesPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import ChapterPage from './pages/ChapterPage'; // Import the new page
import './index.css';
import { AuthProvider } from './context/AuthContext'; // <--- IMPORT THIS
import LoginPage from './pages/LoginPage';     // <--- IMPORT THIS

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ModulesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/module/:id" element={<ModuleDetailPage />} />
          {/* NEW ROUTE: Matches /module/7/chapter/1 */}
          <Route path="/module/:moduleId/chapter/:chapterId" element={<ChapterPage />} />
          
        </Routes>
      </Router>
    </AuthProvider>  
  );
}

export default App;