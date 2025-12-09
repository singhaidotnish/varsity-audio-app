import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ModulesPage from './pages/ModulesPage';
import AdminPage from './pages/AdminPage';

// Import Tailwind directly
import 'tailwindcss/tailwind.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<ModulesPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
