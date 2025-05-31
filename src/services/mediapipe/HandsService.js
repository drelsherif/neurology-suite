// src/services/mediapipe/HandsService.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaPipeHandLandmarker } from './MediaPipeService';

/**
 * A React Hook for real-time hand detection using MediaPipe.
 * Manages camera access, video feed, and continuous hand landmark detection.
 *
 * @returns {object} An object containing:
 * - `videoRef`: A ref to be attached to the <video> element for camera feed.
 * - `canvasRef`: A ref to be attached to the <canvas> element for drawing landmarks.
 * - `handDetectionResults`: The latest results from HandLandmarker (HandLandmarkerResult object).
 * - `isCameraReady`: Boolean indicating if the camera feed is active.
 * - `isHandLandmarkerReady`: Boolean indicating if the MediaPipe landmarker is ready.
 * - `startDetection`: Function to start camera and hand detection.
 * - `stopDetection`: Function to stop camera and hand detection.
 * - `error`: Any error encountered.
 */
export const useHandDetection = () => {
    const { isHandLandmarkerReady, handLandmarker, error: landmarkerError } = useMediaPipeHandLandmarker();

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameId = useRef(null);

    const [isCameraReady, setIsCameraReady] = useState(false);
    const [handDetectionResults, setHandDetectionResults] = useState(null);
    const [error, setError] = useState(landmarkerError); // Propagate landmarker errors

    // Function to draw landmarks on the canvas
    const drawLandmarks = useCallback((results) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video || !results || !results.handLandmarks) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Save context state before applying transformations
        ctx.save();
        // Flip canvas horizontally to mirror video for a natural user experience
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);


        results.handLandmarks.forEach((landmarks, index) => {
            const handedness = results.handedness[index]?.[0]?.categoryName; // "Left" or "Right"
            const color = handedness === "Left" ? "red" : "blue";

            // Draw points (landmarks)
            landmarks.forEach(landmark => {
                const x = landmark.x * canvas.width;
                const y = landmark.y * canvas.height;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI); // Draw circles for landmarks
                ctx.fillStyle = color;
                ctx.fill();
            });

            // Define connections between landmarks to draw the hand skeleton
            // These correspond to the 21 MediaPipe hand landmarks:
            // 0: Wrist
            // 1-4: Thumb (CMC, MCP, IP, Tip)
            // 5-8: Index (MCP, PIP, DIP, Tip)
            // 9-12: Middle (MCP, PIP, DIP, Tip)
            // 13-16: Ring (MCP, PIP, DIP, Tip)
            // 17-20: Pinky (MCP, PIP, DIP, Tip)
            const connections = [
                // Thumb
                [0, 1], [1, 2], [2, 3], [3, 4],
                // Index finger
                [0, 5], [5, 6], [6, 7], [7, 8],
                // Middle finger
                [9, 10], [10, 11], [11, 12],
                // Ring finger
                [13, 14], [14, 15], [15, 16],
                // Pinky finger
                [0, 17], [17, 18], [18, 19], [19, 20], // Wrist to Pinky MCP, then pinky segments
                // Connections across the palm (e.g., from Index MCP to Middle MCP)
                [5, 9], [9, 13], [13, 17]
            ];

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            connections.forEach(([startIdx, endIdx]) => {
                const start = landmarks[startIdx];
                const end = landmarks[endIdx];
                if (start && end) {
                    ctx.beginPath();
                    ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
                    ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
                    ctx.stroke();
                }
            });
        });
        ctx.restore(); // Restore to original transformation after drawing all hands
    }, []);

    // Main detection loop
    const detectHands = useCallback(() => {
        const video = videoRef.current;
        if (!video || !handLandmarker || video.paused || video.ended) {
            // If video is not ready or paused/ended, just keep requesting frames
            animationFrameId.current = requestAnimationFrame(detectHands);
            return;
        }

        // Only detect if MediaPipe HandLandmarker is ready
        if (isHandLandmarkerReady) {
            // `performance.now()` provides a high-resolution timestamp
            const results = handLandmarker.detectForVideo(video, performance.now());
            setHandDetectionResults(results); // Update state with latest results for other components
            drawLandmarks(results); // Draw the results directly on the canvas
        }

        // Continue the animation loop
        animationFrameId.current = requestAnimationFrame(detectHands);
    }, [handLandmarker, isHandLandmarkerReady, drawLandmarks]);

    // Function to start camera and detection
    const startDetection = useCallback(async () => {
        if (!handLandmarker) {
            setError(new Error("HandLandmarker is not initialized. Cannot start detection."));
            return;
        }
        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Once video metadata is loaded, play it and start detection
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsCameraReady(true);
                    animationFrameId.current = requestAnimationFrame(detectHands); // Start detection loop
                };
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError(new Error(`Failed to access camera: ${err.message || err}`));
            setIsCameraReady(false);
        }
    }, [handLandmarker, detectHands]);

    // Function to stop camera and detection
    const stopDetection = useCallback(() => {
        // Cancel the animation frame loop
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        // Stop all media tracks (camera)
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraReady(false);
        setHandDetectionResults(null); // Clear previous detection results
        setError(null); // Clear any existing errors

        // Clear the canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, []);

    // Effect to clean up on component unmount and propagate initial errors from MediaPipeService
    useEffect(() => {
        // If there's an error from the HandLandmarker initialization, update this hook's error state
        if (landmarkerError) {
            setError(landmarkerError);
        }
        // Return cleanup function to stop detection when the component using this hook unmounts
        return () => {
            stopDetection();
        };
    }, [landmarkerError, stopDetection]); // Dependencies: re-run if landmarkerError changes or stopDetection changes (though stopDetection is useCallback)

    return {
        videoRef,
        canvasRef,
        handDetectionResults,
        isCameraReady,
        isHandLandmarkerReady,
        startDetection,
        stopDetection,
        error
    };
};