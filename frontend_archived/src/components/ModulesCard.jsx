import React from 'react';
import { Link } from 'react-router-dom';

const ModulesCard = ({ module }) => {
  const colorMap = {
    1: "bg-green-500", 2: "bg-blue-500", 3: "bg-yellow-400", 4: "bg-pink-400",
    5: "bg-orange-400", 6: "bg-indigo-400", 7: "bg-red-400", 8: "bg-teal-400",
    9: "bg-purple-500", 10: "bg-red-500", 11: "bg-sky-500", 12: "bg-orange-300",
    13: "bg-blue-600", 14: "bg-lime-500", 15: "bg-yellow-500", 16: "bg-green-600",
    17: "bg-blue-400",
  };

  const accentColor = colorMap[module.id] || "bg-gray-300";

  return (
    <Link to={`/module/${module.id}`} className="block h-full group">
      <div className="flex flex-col items-start h-full p-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="text-4xl font-light text-gray-800 mb-2">
          {module.id}
        </div>

        <div className={`h-1 w-full ${accentColor} mb-5 rounded-full`}></div>

        <h3 className="text-xl font-bold text-gray-900 mb-1 leading-snug group-hover:text-blue-600 transition-colors">
          {module.title}
        </h3>

        <p className="text-xs text-gray-500 font-medium mb-4 uppercase tracking-wide">
          {module.chapters}
        </p>

        <p className="text-gray-600 text-[15px] leading-relaxed mb-6 flex-grow">
          {module.description}
        </p>

        <span className="text-blue-500 text-sm font-medium hover:text-blue-700 mt-auto">
          View module
        </span>
      </div>
    </Link>
  );
};

export default ModulesCard;