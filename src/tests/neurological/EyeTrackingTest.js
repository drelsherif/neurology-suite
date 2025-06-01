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

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');

    const faceMesh = getFaceMesh();
    faceMeshRef.current = faceMesh;

    faceMesh.onResults((results) => {
      if (!canvasElement || !results.multiFaceLandmarks) {
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

    getOrCreateCamera(videoElement, async () => {
      await faceMesh.send({ image: videoElement });
    });

    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-video bg-black rounded-lg overflow-hidden">
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
</div>

    </div>
  );
}