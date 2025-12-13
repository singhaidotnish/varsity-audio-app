import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { modules } from '../data/modulesData';
import { chaptersData } from '../data/chapters';

const ModuleDetailPage = () => {
  const { id } = useParams();
  const module = modules.find((m) => m.id === parseInt(id));
  const chapters = chaptersData[id] || [];

  // Re-using the color map logic for consistency
  const colorMap = {
    1: "bg-green-500", 2: "bg-blue-500", 3: "bg-yellow-400", 4: "bg-pink-400",
    5: "bg-orange-400", 6: "bg-indigo-400", 7: "bg-red-400", 8: "bg-teal-400",
    9: "bg-purple-500", 10: "bg-red-500", 11: "bg-sky-500", 12: "bg-orange-300",
    13: "bg-blue-600", 14: "bg-lime-500", 15: "bg-yellow-500", 16: "bg-green-600",
    17: "bg-blue-400",
  };
  
  // Default to gray if not found
  const accentColor = colorMap[id] || "bg-gray-300";

  if (!module) return <div className="p-10">Module not found</div>;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navbar Placeholder */}
      <nav className="border-b border-gray-100 mb-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
             <Link to="/" className="text-gray-500 hover:text-blue-600 text-sm">
               ← Back to Modules
             </Link>
             <div className="font-bold text-gray-800">VARSITY</div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        {/* Header Section */}
        <div className="mb-16">
          <div className="text-6xl font-light text-gray-800 mb-4">
            {module.id}
          </div>
          <div className={`h-1 w-24 ${accentColor} mb-6`}></div>
          <h1 className="text-3xl font-bold text-gray-900">
            {module.title}
          </h1>
        </div>

        {/* Chapters List */}
        <div className="space-y-12">
          {chapters.length > 0 ? (
            chapters.map((chapter, index) => (
            // We use index + 1 as the chapter ID for simplicity
            <Link 
                to={`/module/${module.id}/chapter/${index + 1}`} 
                key={index} 
                className="block group"
            >
                <div className="mb-8"> {/* Added container for spacing */}
                    <h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {chapter.title}
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                    {chapter.description}
                    </p>
                </div>
            </Link>
            ))
          ) : (
            <p className="text-gray-500 italic">No chapters available for this module yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleDetailPage;