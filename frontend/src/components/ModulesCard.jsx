import React from 'react';

const ModulesCard = ({ module, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div 
              className="w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: module.color || '#4CAF50' }}
            ></div>
            <h3 className="text-xl font-bold text-gray-900">{module.name}</h3>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">{module.description}</p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-500">
                📚 {module.chapterCount || module.chapters?.length || 0} chapters
              </span>
              
              {module.convertedChapters !== undefined && (
                <span className="text-gray-500">
                  🎵 {module.convertedChapters} with audio
                </span>
              )}
            </div>
            
            {module.conversionPercentage !== undefined && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                module.conversionPercentage === 100 
                  ? 'bg-green-100 text-green-800' 
                  : module.conversionPercentage > 50 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {module.conversionPercentage}% audio
              </div>
            )}
          </div>
        </div>
        
        <div className="ml-4 text-right">
          <span className="text-2xl font-bold text-gray-300">#{module.id}</span>
        </div>
      </div>
    </div>
  );
};

export default ModulesCard;
