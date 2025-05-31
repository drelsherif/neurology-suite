// src/services/mediapipe/MediaPipeService.js
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useState, useEffect, useRef } from 'react';

// --- IMPORTANT: Define the MediaPipe version here ---
// We'll keep the NPM package version for installation.
const MEDIAPIPE_VERSION = "0.10.21";
// ----------------------------------------------------

// Use the jsDelivr CDN for the WASM files (this usually works well)
const MEDIAPIPE_WASM_PATH = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;

// *** CRITICAL CHANGE HERE: Use Google's official CDN for the model file ***
const HAND_LANDMARKER_MODEL_PATH = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
// Note: This specific URL (for float16/1 version) is stable and commonly used.
// It does not depend on the NPM package version number directly in its path.


/**
 * A React Hook for initializing and providing the MediaPipe HandLandmarker instance.
 * Handles loading of the necessary WASM files and the model.
 *
 * @returns {object} An object containing:
 * - `isHandLandmarkerReady`: A boolean indicating if the HandLandmarker is loaded and ready.
 * - `handLandmarker`: The initialized HandLandmarker instance (or null if not ready).
 * - `error`: Any error that occurred during initialization.
 */
export const useMediaPipeHandLandmarker = () => {
    const [isHandLandmarkerReady, setIsHandLandmarkerReady] = useState(false);
    const [error, setError] = useState(null);
    const handLandmarkerRef = useRef(null); // Use ref to hold the mutable HandLandmarker instance

    useEffect(() => {
        const initializeHandLandmarker = async () => {
            try {
                console.log(`Initializing MediaPipe HandLandmarker v${MEDIAPIPE_VERSION}...`);
                // FilesetResolver uses the WASM path
                const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
                const landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: HAND_LANDMARKER_MODEL_PATH, // Model path is now direct Google CDN
                        delegate: 'GPU' // Try 'GPU' for performance, fallback to 'CPU' if issues
                    },
                    runningMode: 'VIDEO', // Set to VIDEO for processing video streams
                    numHands: 2, // Detect up to two hands
                });

                handLandmarkerRef.current = landmarker;
                setIsHandLandmarkerReady(true);
                console.log(`MediaPipe HandLandmarker v${MEDIAPIPE_VERSION} initialized successfully.`);
            } catch (err) {
                console.error(`Failed to initialize MediaPipe HandLandmarker v${MEDIAPIPE_VERSION}:`, err);
                // Also log the URL that failed for clearer debugging
                console.error(`Attempted model URL: ${HAND_LANDMARKER_MODEL_PATH}`);
                setError(err);
                setIsHandLandmarkerReady(false);
            }
        };

        initializeHandLandmarker();

        // Cleanup: close the landmarker when the component unmounts
        return () => {
            if (handLandmarkerRef.current) {
                handLandmarkerRef.current.close();
                console.log("MediaPipe HandLandmarker closed.");
            }
        };
    }, []); // Empty dependency array means this effect runs once on mount

    return {
        isHandLandmarkerReady,
        handLandmarker: handLandmarkerRef.current,
        error
    };
};