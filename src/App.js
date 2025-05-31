// src/App.js
import React, { useState } from 'react';
import FingerTapTest from './tests/neurological/FingerTapTest';
// This is correct because from 'src/' you go into 'tests/', then 'neurological/', then 'FingerTapTest.js'

function App() {
  const [currentPage, setCurrentPage] = useState('fingerTap'); // Start directly on finger tap for easy testing

  const renderPage = () => {
    switch(currentPage) {
      case 'fingerTap':
        return <FingerTapTest onBack={() => setCurrentPage('home')} />;
      case 'home':
        // Placeholder for HomePage or a test selection page
        return (
          <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Neurology Suite</h1>
            <p style={{ fontSize: '1.1em', marginBottom: '25px' }}>Welcome! Select a test from the menu.</p>
            <button
              onClick={() => setCurrentPage('fingerTap')}
              style={{
                padding: '12px 25px',
                fontSize: '1.2em',
                cursor: 'pointer',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
            >
              Go to Finger Tap Test
            </button>
            {/* Add more test buttons here */}
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