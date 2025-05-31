import React, { useState } from 'react';
import Navigation from './components/layout/Navigation';
import HomePage from './pages/HomePage';
import ProviderSuite from './pages/ProviderSuite';
import PatientSuite from './pages/PatientSuite';
import SessionHistory from './pages/SessionHistory';
import AvatarConcept from './pages/AvatarConcept';
import FingerTapTest from './tests/neurological/FingerTapTest';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleTestSelect = (testType) => {
    // This will be used later when we create individual test components
    console.log('Selected test:', testType);
    setCurrentPage(testType);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onPageChange={setCurrentPage} />;
      case 'providerSuite':
        return <ProviderSuite onPageChange={setCurrentPage} onTestSelect={handleTestSelect} />;
      case 'patientHomeSuite':
        return <PatientSuite onPageChange={setCurrentPage} onTestSelect={handleTestSelect} />;
      case 'sessionHistory':
        return <SessionHistory onPageChange={setCurrentPage} />;
      case 'avatarConcept':
        return <AvatarConcept onPageChange={setCurrentPage} />;
      case 'fingerTapSpeed':
        return <FingerTapTest onPageChange={setCurrentPage} />;
      default:
        // For now, show a placeholder for individual tests
        return (
          <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-blue-300 mb-4">
              {currentPage.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Test
            </h1>
            <p className="text-slate-300 mb-4">
              This test component will be implemented next with MediaPipe integration.
            </p>
            <button 
              onClick={() => setCurrentPage('home')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Back to Home
            </button>
          </div>
        );
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main>
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App;