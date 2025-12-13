import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { chapterContent } from '../data/chapterContent';

const ChapterPage = () => {
  const { moduleId, chapterId } = useParams();
  const chapterKey = `${moduleId}-${chapterId}`;
  const data = chapterContent[chapterKey];

  if (!data) return <div className="p-10">Chapter content not found.</div>;

  return (
    <div className="min-h-screen bg-white font-serif text-gray-900 pb-32">
      {/* Top Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
             <Link to={`/module/${moduleId}`} className="text-gray-500 hover:text-blue-600 text-sm font-sans">
               ← Back to Module
             </Link>
             <div className="font-bold text-gray-800 font-sans">VARSITY</div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 mt-10">
        {/* Chapter Header */}
        <div className="mb-8">
            <span className="text-blue-600 text-sm font-bold uppercase tracking-wide font-sans">
                {data.moduleName}
            </span>
            <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-6 leading-tight">
                {data.title}
            </h1>
        </div>

        {/* Text Content */}
        <article className="prose prose-lg text-gray-700 leading-loose">
            {data.content.map((block, index) => {
                if (block.type === 'h3') {
                    return <h3 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{block.text}</h3>;
                }
                return <p key={index} className="mb-6">{block.text}</p>;
            })}
        </article>
      </div>

      {/* Sticky Audio Player Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
            <div className="hidden sm:block">
                <p className="text-xs text-gray-500 font-sans">Now Playing</p>
                <p className="text-sm font-bold text-gray-800 truncate w-48 font-sans">{data.title}</p>
            </div>
            
            {/* HTML5 Audio Player */}
            <audio controls className="w-full h-10 bg-gray-50 rounded">
                <source src={data.audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
            </audio>
        </div>
      </div>
    </div>
  );
};

export default ChapterPage;