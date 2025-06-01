import React, { useRef, useEffect, useState } from 'react';
import { getOrCreateCamera, stopCamera } from '../../services/mediapipe/MediaPipeService';
import { getFaceMesh } from '../../services/mediapipe/FaceMeshService';

export default function EyeTrackingTest({ onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const faceMeshRef = useRef(null);

  const [gazeDirection, setGazeDirection] = useState('center');
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debugLog, setDebugLog] = useState([]);

  const log = (msg) => {
    console.log(msg);
    setDebugLog(prev => [...prev.slice(-10), msg]);
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');

    const waitForVideoReady = () => {
      return new Promise((resolve, reject) => {
        const check = () => {
          if (videoElement && videoElement.videoWidth > 0) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });
    };

    const initialize = async () => {
      log('[🟡] Initializing MediaPipe and camera...');

      const faceMesh = getFaceMesh();
      faceMeshRef.current = faceMesh;

      faceMesh.onResults((results) => {
        setLoading(false);
        log('[🟢] MediaPipe received results');
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          setFaceDetected(false);
          return;
        }

        setFaceDetected(true);
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.strokeStyle = '#00FF00';
        canvasCtx.lineWidth = 1;

        results.multiFaceLandmarks.forEach((landmarks) => {
          for (let i = 0; i < landmarks.length; i++) {
            const pt = landmarks[i];
            const x = pt.x * canvasElement.width;
            const y = pt.y * canvasElement.height;
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 2, 0, 2 * Math.PI);
            canvasCtx.stroke();
          }
        });

        canvasCtx.restore();
      });

      await waitForVideoReady();
      log('[📷] Video is ready. Starting frame stream to MediaPipe.');

      getOrCreateCamera(videoElement, async () => {
        log('[📸] Sending frame to MediaPipe...');
        await faceMesh.send({ image: videoElement });
      });
    };

    initialize();

    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="relative w-full h-[50vh] mx-auto bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10"
        width={640}
        height={480}
      />
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full z-20 pointer-events-none"
        width={640}
        height={480}
      />
      <div className="absolute top-2 left-2 z-30 bg-black bg-opacity-60 text-white p-2 rounded shadow text-sm leading-snug">
        <p>Face detected: {faceDetected ? '✓' : 'X'}</p>
        <p>Gaze: {gazeDirection}</p>
        <p>Blink: {blinkDetected ? 'Yes' : 'No'}</p>
        {loading && <p className="text-yellow-400">Loading MediaPipe...</p>}
      </div>
      <div className="absolute bottom-2 left-2 z-40 w-[90%] max-h-[30%] overflow-y-auto text-xs bg-white/80 text-black p-1 rounded">
        {debugLog.map((msg, i) => <div key={i}>{msg}</div>)}
      </div>
    </div>
  );
}
