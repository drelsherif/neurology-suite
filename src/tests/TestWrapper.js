// src/tests/TestWrapper.js
import React from 'react';

export default function TestWrapper({ title, onBack, children }) {
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' }}>
            <button
                onClick={onBack}
                style={{
                    marginBottom: '15px',
                    padding: '8px 15px',
                    cursor: 'pointer',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '1em'
                }}
            >
                &larr; Back to Tests
            </button>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>{title}</h2>
            {children}
        </div>
    );
}