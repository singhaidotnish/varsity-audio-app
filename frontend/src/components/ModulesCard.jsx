// frontend/src/components/ModuleCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ModuleCard({ module }) {
  const [showAll, setShowAll] = useState(false);
  
  const audioCount = module.chapters.filter(ch => ch.hasAudio).length;
  const totalChapters = module.chapters.length;
  
  // Show first 5 chapters, or all if showAll is true
  const displayChapters = showAll 
    ? module.chapters 
    : module.chapters.slice(0, 5);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {module.name}
            </h3>
            {module.description && (
              <p className="text-gray-600 text-sm">{module.description}</p>
            )}
          </div>
          <div className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
            {audioCount}/{totalChapters} audio
          </div>
        </div>
        
        {/* Chapters List */}
        <div className="space-y-3 mb-4">
          {displayChapters.map(chapter => (
            <div 
              key={chapter.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center">
                <div className="mr-3">
                  {chapter.hasAudio ? (
                    <span className="text-green-600" title="Audio available">🎧</span>
                  ) : (
                    <span className="text-gray-400" title="No audio yet">📖</span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">
                    {chapter.title}
                  </h4>
                  {chapter.description && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                      {chapter.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {chapter.hasAudio ? (
                  <button
                    onClick={() => window.open(chapter.audioUrl, '_blank')}
                    className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    Play
                  </button>
                ) : (
                  <a
                    href={`https://wa.me/919999999999?text=Hi,%20I%20want%20to%20request%20audio%20for:%20${encodeURIComponent(chapter.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                  >
                    Request
                  </a>
                )}
                
                <a
                  href={chapter.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs"
                  title="View on Zerodha Varsity"
                >
                  ↗
                </a>
              </div>
            </div>
          ))}
        </div>
        
        {/* Show More/Less */}
        {module.chapters.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium w-full text-center py-2 border-t border-gray-100"
          >
            {showAll ? 'Show Less' : `Show All (${module.chapters.length} chapters)`}
          </button>
        )}
        
        {/* Module Actions */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <div className="text-gray-500 text-xs">
            {audioCount} audio files available
          </div>
          <Link
            to={`/module/${module.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}