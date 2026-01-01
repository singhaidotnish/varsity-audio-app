import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { chaptersData } from '../data/chapters';

const ModuleDetailPage = () => {
  // 1. Matches "/module/:id" in App.jsx
  const { id } = useParams();
  const moduleId = id; // Rename for clarity

  const moduleChapters = chaptersData[moduleId];

  if (!moduleChapters) {
    return <div className="p-10 text-center">Module {moduleId} not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navbar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/" className="text-blue-600 font-medium hover:underline">
            ← Back to All Modules
          </Link>
        </div>
      </div>

      {/* Chapter List */}
      <div className="max-w-3xl mx-auto px-4 mt-8">
        <h1 className="text-3xl font-bold mb-2">Module {moduleId}</h1>
        <p className="text-gray-500 mb-6">{moduleChapters.length} Chapters</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {moduleChapters.map((chapter) => (
            <Link 
              key={chapter.id}
              // 2. IMPORTANT: This Link constructs the URL for the NEXT page
              // Matches "/module/:moduleId/chapter/:chapterId" in App.jsx
              to={`/module/${moduleId}/chapter/${chapter.id}`}
              className="block px-6 py-4 border-b last:border-0 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">
                  {chapter.id}. {chapter.title}
                </span>
                <span className="text-blue-500 text-sm">Read →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuleDetailPage;