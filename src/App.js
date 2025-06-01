// src/App.js
import React, { useState } from 'react';
import FingerTapTest from './tests/neurological/FingerTapTest';
import EyeTrackingTest from './tests/neurological/EyeTrackingTest'; // Import your existing eye test
import HomePage from './pages/HomePage';
import ProviderSuite from './pages/ProviderSuite';
import PatientSuite from './pages/PatientSuite';
import SessionHistory from './pages/SessionHistory';

function App() {
  const [currentPage, setCurrentPage] = useState('home'); // Start with home page

  const handleTestSelect = (testType) => {
    setCurrentPage(testType);
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <HomePage onPageChange={setCurrentPage} />;
      
      case 'providerSuite':
        return <ProviderSuite onPageChange={setCurrentPage} onTestSelect={handleTestSelect} />;
      
      case 'patientHomeSuite':
        return <PatientSuite onPageChange={setCurrentPage} onTestSelect={handleTestSelect} />;
      
      case 'sessionHistory':
        return <SessionHistory onPageChange={setCurrentPage} />;
      
      // Individual Tests
      case 'fingerTapSpeed':
        return <FingerTapTest onBack={() => setCurrentPage('providerSuite')} />;
      
      case 'eyeTracking':
        return <EyeTrackingTest onBack={() => setCurrentPage('providerSuite')} />;
      
      // Add more test cases as needed
      case 'faceSymmetry':
      case 'pupilResponse':
      case 'sequentialFingerTaps':
      case 'visualTremor':
      case 'armDrift':
      case 'fingerToNose':
      case 'gaitAssessment':
      case 'speechCollection':
      case 'reactionTime':
        return (
          <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Test Coming Soon</h1>
            <p style={{ fontSize: '1.1em', marginBottom: '25px' }}>
              The {currentPage} test is under development.
            </p>
            <button
              onClick={() => setCurrentPage('providerSuite')}
              style={{
                padding: '12px 25px',
                fontSize: '1.2em',
                cursor: 'pointer',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
            >
              Back to Provider Suite
            </button>
          </div>
        );
      
      default:
        return (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <h1>Page Not Found</h1>
            <button onClick={() => setCurrentPage('home')}>Go Home</button>
          </div>
        );
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;