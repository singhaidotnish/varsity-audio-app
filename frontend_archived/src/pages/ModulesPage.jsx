import React from 'react';
import ModulesCard from '../components/ModulesCard';
// FIX: Ensure this path matches your file name (modules.js) and the import matches the constant name ({ modules })
import { modules } from '../data/modulesData'; 

const ModulesPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header / Navbar */}
      <header className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3 select-none cursor-pointer">
           <div className="h-10 w-10 bg-blue-100 rounded text-blue-700 flex items-center justify-center font-serif font-bold text-2xl">
             V
           </div>
           <div>
             <span className="block text-xs text-gray-400 font-bold tracking-widest">ZERODHA</span>
             <span className="block text-xl font-bold text-gray-800 tracking-wide">VARSITY</span>
           </div>
        </div>
        
        <nav>
          <a href="#" className="text-blue-600 font-medium text-sm hover:underline">Modules</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-24">
        <h1 className="text-[42px] font-bold text-gray-900 mt-8 mb-16">
          Modules
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          {/* FIX: Ensure you are mapping over 'modules', not 'modulesData' */}
          {modules.map((module) => (
            <ModulesCard key={module.id} module={module} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default ModulesPage;