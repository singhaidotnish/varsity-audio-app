import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import AudioPlayer from '../components/AudioComponent';

// Import your data files
import { chaptersData } from '../data/chapters';
import { chapterContent } from '../data/chapterContent';

// --- Helper Component: Renders specific block types ---
const ContentBlock = ({ block }) => {
  switch (block.type) {
    case 'h1':
    case 'h2': 
      return <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800 border-b pb-2">{block.text}</h2>;
    
    case 'h3': 
      return <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-700">{block.text}</h3>;
    
    case 'h4': 
      return <h4 className="text-lg font-semibold mt-4 mb-2 text-gray-700">{block.text}</h4>;

    case 'image':
      return (
        <div className="my-8 flex flex-col items-center">
          <img 
            src={block.src} 
            alt={block.alt || 'Varsity Illustration'} 
            className="rounded-lg shadow-md max-w-full h-auto border border-gray-100"
            onError={(e) => e.target.style.display = 'none'} // Hide if link is broken
          />
          {block.alt && <span className="text-sm text-gray-500 mt-2 italic">{block.alt}</span>}
        </div>
      );

    case 'table':
      return (
        <div className="my-6 overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
          {/* Render the raw HTML table scraped from Zerodha */}
          <div 
            className="p-4 text-sm text-gray-700 [&>table]:w-full [&>table]:border-collapse [&>table>thead>tr>th]:bg-gray-100 [&>table>thead>tr>th]:p-3 [&>table>thead>tr>th]:text-left [&>table>tbody>tr>td]:p-3 [&>table>tbody>tr>td]:border-t"
            dangerouslySetInnerHTML={{ __html: block.html }} 
          />
        </div>
      );

    default: // 'p' and generic text
      return <p className="mb-4 text-gray-600 leading-relaxed text-lg">{block.text}</p>;
  }
};

// --- Main Page Component ---
const ModuleDetailPage = () => {
  const { moduleId, chapterSlug } = useParams();
// --- ADD THESE LOGS ---
  console.log("1. URL Params:", { moduleId, chapterSlug });
  console.log("2. Data Keys Available:", Object.keys(chaptersData));
  console.log("3. Module Data Found:", chaptersData[moduleId]);

  const [currentChapter, setCurrentChapter] = useState(null);
  const [contentData, setContentData] = useState(null);

  useEffect(() => {
      // 1. Find the Chapter Metadata (Title, ID) from chapters.js
      const moduleChapters = chaptersData[moduleId];
      if (moduleChapters) {
        const foundChapter = moduleChapters.find(ch => ch.slug === chapterSlug);
        setCurrentChapter(foundChapter);

        // 2. Find the Actual Content from chapterContent.js
        if (foundChapter) {
          const uniqueKey = `${moduleId}-${foundChapter.id}`;
          const data = chapterContent[uniqueKey];

          if (data) {
            // --- NEW: DEDUPLICATION LOGIC ---
            // This removes image blocks if their URL has been seen before
            const seenImages = new Set();
            const cleanContent = data.content.filter(block => {
              if (block.type === 'image') {
                if (seenImages.has(block.src)) {
                  return false; // Skip duplicate
                }
                seenImages.add(block.src); // Mark as seen
              }
              return true; // Keep text, tables, etc.
            });

            // Set the clean data
            setContentData({ ...data, content: cleanContent });
          }
        }
      }
    }, [moduleId, chapterSlug]);

  if (!currentChapter) {
    return <div className="p-10 text-center text-gray-500">Chapter not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header / Nav */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            to={`/modules/${moduleId}`} 
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            ← Back to Module
          </Link>
          <span className="text-sm text-gray-400">Varsity Audio</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 mt-8">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight">
          {contentData ? contentData.title : currentChapter.title}
        </h1>
        <p className="text-gray-400 mb-8 border-b pb-6">
           Module {moduleId} • Chapter {currentChapter.id}
        </p>

        {/* Content Renderer */}
        {contentData ? (
          <div className="bg-white p-6 md:p-10 rounded-xl shadow-sm">
            {contentData.content.map((block, index) => (
              <ContentBlock key={index} block={block} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <p className="mt-8 text-gray-400 text-sm">Loading content...</p>
              <p className="text-xs text-red-300 mt-2">(If this persists, check chapterContent.js keys)</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Audio Player Placeholder (Future Step) */}
      <AudioPlayer 
        // We look for an 'audio_url' field in your data. 
        // Since we don't have one yet, this will default to "Request Audio".
        audioUrl={contentData?.audio_url} 
        chapterTitle={currentChapter.title}
      />
    </div>
  );
};

export default ModuleDetailPage;