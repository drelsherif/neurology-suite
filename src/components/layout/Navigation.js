import React from 'react';
import { Home, FlaskConical, Users, ClipboardList, User } from 'lucide-react';

const Navigation = ({ currentPage, onPageChange }) => {
  const menuItems = [
    { 
      name: 'Home', 
      icon: Home, 
      page: 'home',
      description: 'Main dashboard'
    },
    { 
      name: 'Provider Suite', 
      icon: FlaskConical, 
      page: 'providerSuite',
      description: 'Professional tests'
    },
    { 
      name: 'Patient Home Suite', 
      icon: Users, 
      page: 'patientHomeSuite',
      description: 'Home testing'
    },
    { 
      name: 'Session History', 
      icon: ClipboardList, 
      page: 'sessionHistory',
      description: 'Past results'
    },
    { 
      name: 'Avatar Concept', 
      icon: User, 
      page: 'avatarConcept',
      description: 'Twin Avatar info'
    },
  ];

  return (
    <nav className="bg-slate-800 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <FlaskConical className="text-blue-400 mr-2" size={24} />
            <span className="text-xl font-bold text-white">NeuroExam</span>
          </div>
          
          {/* Navigation Items */}
          <div className="hidden md:flex space-x-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              
              return (
                <button
                  key={item.name}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                  onClick={() => onPageChange(item.page)}
                  title={item.description}
                >
                  <Icon size={18} />
                  <span className="hidden lg:inline">{item.name}</span>
                </button>
              );
            })}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-slate-300 hover:text-white p-2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu (you can expand this later) */}
      <div className="md:hidden border-t border-slate-700">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            
            return (
              <button
                key={item.name}
                className={`
                  flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                `}
                onClick={() => onPageChange(item.page)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;