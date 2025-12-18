import React from 'react';
// 1. IMPORT EVERYTHING HERE (Only Once)
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';

import ModulesPage from './pages/ModulesPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import { chaptersData } from './data/chapters';

function App() {
  return (
    <Router>
      <Routes>
        {/* Route 1: Home (List all modules) */}
        <Route path="/" element={<ModulesPage />} />

        {/* Route 2: The Chapter Reader 
           Matches: /modules/4/background-forwards-market 
        */}
        <Route 
          path="/modules/:moduleId/:chapterSlug" 
          element={<ModuleDetailPage />} 
        />

        {/* Route 3: Auto-Open First Chapter
           Matches: /modules/4 
        */}
        <Route 
          path="/modules/:moduleId"
          element={<NavigateToFirstChapter />}
        />

        {/* --- TYPO FIXER --- 
           If you type /module/4 (singular), this redirects you to /modules/4 (plural) 
        */}
        <Route path="/module/:moduleId" element={<RedirectToPlural />} />

      </Routes>
    </Router>
  );
}

// --- Helper 1: Fixes 'module' vs 'modules' ---
const RedirectToPlural = () => {
  const { moduleId } = useParams();
  return <Navigate to={`/modules/${moduleId}`} replace />;
};

// --- Helper 2: Opens the first chapter automatically ---
const NavigateToFirstChapter = () => {
  const { moduleId } = useParams();
  const moduleChapters = chaptersData[moduleId];

  if (moduleChapters && moduleChapters.length > 0) {
    const firstSlug = moduleChapters[0].slug;
    // Redirect to the first chapter's full URL
    return <Navigate to={`/modules/${moduleId}/${firstSlug}`} replace />;
  }
  
  return <div className="p-10">Module not found or empty.</div>;
};

export default App;