import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

// Import your existing data and components
import { chapterContent } from '../data/chapterContent';
import { chaptersData } from '../data/chapters';
import AudioPlayer from '../components/AudioPlayer';

// --- Helper: Renders Text, Images, Tables ---
const ContentBlock = ({ block }) => {
  switch (block.type) {
    case 'h1':
    case 'h2': 
      return <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800 border-b pb-2">{block.text}</h2>;
    case 'h3': 
      return <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-700">{block.text}</h3>;
    case 'image':
      return (
        <div className="my-8 flex flex-col items-center">
          <img 
            src={block.src} 
            alt={block.alt || 'Varsity Illustration'} 
            className="rounded-lg shadow-md max-w-full h-auto border border-gray-100"
            onError={(e) => e.target.style.display = 'none'} 
          />
        </div>
      );
    case 'table':
      return (
        <div className="my-6 overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
          <div 
            className="p-4 text-sm text-gray-700"
            dangerouslySetInnerHTML={{ __html: block.html }} 
          />
        </div>
      );
    default: 
      return <p className="mb-4 text-gray-600 leading-relaxed text-lg">{block.text}</p>;
  }
};

const ChapterPage = () => {
  // 1. Matches "/module/:moduleId/chapter/:chapterId" in App.jsx
  const { moduleId, chapterId } = useParams();
  
  const [contentData, setContentData] = useState(null);
  const [chapterTitle, setChapterTitle] = useState("");

  useEffect(() => {
    // A. Find Title from list
    const moduleList = chaptersData[moduleId];
    if (moduleList) {
      const meta = moduleList.find(ch => String(ch.id) === String(chapterId));
      if (meta) setChapterTitle(meta.title);
    }

    // B. Find Content using the key "ModuleID-ChapterID" (e.g., "4-1")
    const uniqueKey = `${moduleId}-${chapterId}`;
    const data = chapterContent[uniqueKey];

    if (data) {
       // Deduplication Logic (Keeps images clean)
       const seenImages = new Set();
       const cleanContent = data.content.filter(block => {
         if (block.type === 'image') {
           if (seenImages.has(block.src)) return false;
           seenImages.add(block.src);
         }
         return true;
       });
       setContentData({ ...data, content: cleanContent });
    }
  }, [moduleId, chapterId]);

  if (!contentData) {
    return <div className="p-10 text-center">Loading content for Chapter {chapterId}...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navbar with Back Button */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Link goes back to the LIST page */}
          <Link to={`/module/${moduleId}`} className="text-blue-600 font-medium flex items-center">
            ← Back to Module {moduleId}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 mt-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight">
          {contentData.title || chapterTitle}
        </h1>
        
        <div className="bg-white p-6 md:p-10 rounded-xl shadow-sm mt-6">
          {contentData.content.map((block, index) => (
            <ContentBlock key={index} block={block} />
          ))}
        </div>
      </div>

      {/* Audio Player */}
      <AudioPlayer 
        audioUrl={contentData?.audio_url} 
        chapterTitle={contentData.title || chapterTitle}
      />
    </div>
  );
};

export default ChapterPage;