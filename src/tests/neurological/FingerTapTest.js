// src/tests/neurological/FingerTapTest.js
import React, { useEffect } from 'react';
import TestWrapper from '../TestWrapper';
// This is correct because from 'src/tests/neurological/' you go UP one level ('../') to 'src/tests/', then find 'TestWrapper.js'
import { useHandDetection } from '../../services/mediapipe/HandsService';

/**
 * Finger Tapping Test Component.
 * Displays camera feed and MediaPipe hand landmarks.
 * Initial version focuses on getting detection visible.
 */
export default function FingerTapTest({ onBack }) {
    const {
        videoRef,
        canvasRef,
        handDetectionResults, // We'll use this for tap detection later
        isCameraReady,
        isHandLandmarkerReady,
        startDetection,
        stopDetection,
        error
    } = useHandDetection();

    useEffect(() => {
        // Start camera and detection once MediaPipe HandLandmarker is ready
        if (isHandLandmarkerReady) {
            startDetection();
        }
        // Cleanup: stop detection when the component unmounts
        return () => {
            stopDetection();
        };
    }, [isHandLandmarkerReady, startDetection, stopDetection]); // Dependencies to re-run effect

    return (
        <TestWrapper title="Finger Tapping Test" onBack={onBack}>
            <div style={{
                position: 'relative',
                width: '640px', // Fixed width
                height: '480px', // Fixed height
                margin: '20px auto',
                border: '1px solid #ccc',
                overflow: 'hidden' // Ensure content doesn't overflow
            }}>
                {error && <p style={{ color: 'red', position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>Error: {error.message}</p>}
                {!isHandLandmarkerReady && <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>Loading MediaPipe HandLandmarker...</p>}
                {!isCameraReady && isHandLandmarkerReady && <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>Waiting for camera...</p>}

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover', // Cover the container, might crop
                        display: isCameraReady ? 'block' : 'none',
                        // Mirror the video feed horizontally for a natural user experience
                        transform: 'scaleX(-1)'
                    }}
                />
                <canvas
                    ref={canvasRef}
                    // Canvas dimensions will be set programmatically in HandsService to match video
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: isCameraReady ? 'block' : 'none',
                    }}
                />
            </div>
            {/* Display simple feedback about detected hands */}
            {handDetectionResults && handDetectionResults.handLandmarks?.length > 0 && (
                <p>Hands Detected: {handDetectionResults.handLandmarks.length}</p>
            )}
            {handDetectionResults && handDetectionResults.handedness?.map((h, idx) => (
                <p key={idx}>Hand {idx + 1}: {h[0]?.categoryName} (Confidence: {h[0]?.score.toFixed(2)})</p>
            ))}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button onClick={startDetection} disabled={isCameraReady || !isHandLandmarkerReady} style={{ margin: '5px', padding: '10px 20px', cursor: 'pointer' }}>
                    Start Camera
                </button>
                <button onClick={stopDetection} disabled={!isCameraReady} style={{ margin: '5px', padding: '10px 20px', cursor: 'pointer' }}>
                    Stop Camera
                </button>
            </div>
        </TestWrapper>
    );
}