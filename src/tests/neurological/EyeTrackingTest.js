import React, { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';

export default function EyeTrackingTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gazeDirection, setGazeDirection] = useState('center');
  const [gazeHistory, setGazeHistory] = useState([]);

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      selfieMode: true,
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        setFaceDetected(true);

        const landmarks = results.multiFaceLandmarks[0];

        for (let i = 0; i < landmarks.length; i++) {
          const pt = landmarks[i];
          canvasCtx.beginPath();
          canvasCtx.arc(pt.x * canvasElement.width, pt.y * canvasElement.height, 2, 0, 2 * Math.PI);
          canvasCtx.fillStyle = 'lime';
          canvasCtx.fill();
        }

        const leftEye = landmarks[468];
        const rightEye = landmarks[473];
        const eyeMidX = (leftEye.x + rightEye.x) / 2;

        let direction = 'center';
        if (eyeMidX < 0.45) direction = 'right';
        else if (eyeMidX > 0.55) direction = 'left';

        setGazeDirection(direction);
        setGazeHistory(prev => [...prev.slice(-100), direction]); // store last 100

      } else {
        setFaceDetected(false);
      }

      canvasCtx.restore();
      setLoading(false);
    });

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
        });
        videoElement.srcObject = stream;

        videoElement.onloadedmetadata = () => {
          videoElement.play();

          const detectFrame = async () => {
            await faceMesh.send({ image: videoElement });
            requestAnimationFrame(detectFrame);
          };

          detectFrame();
        };
      } catch (err) {
        console.error('Camera initialization failed:', err);
      }
    };

    startCamera();

    return () => {
      const tracks = videoElement?.srcObject?.getTracks();
      tracks?.forEach((track) => track.stop());
    };
  }, []);

  const renderGazeGraph = () => {
    const width = 300;
    const height = 100;
    const padding = 10;
    const xStep = (width - 2 * padding) / (gazeHistory.length || 1);

    const path = gazeHistory.map((dir, i) => {
      const y = dir === 'left' ? 20 : dir === 'center' ? 50 : 80;
      const x = padding + i * xStep;
      return `${x},${y}`;
    }).join(' L ');

    return (
      <svg width={width} height={height} className="mt-2 border border-gray-400 bg-white">
        <polyline
          fill="none"
          stroke="blue"
          strokeWidth="2"
          points={path ? `M ${path}` : ''}
        />
        <text x="5" y="15" fontSize="10">Left</text>
        <text x="5" y="50" fontSize="10">Center</text>
        <text x="5" y="85" fontSize="10">Right</text>
      </svg>
    );
  };

  return (
    <div className="relative w-full max-w-lg mx-auto mt-6 aspect-video bg-black rounded overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        width={640}
        height={480}
      />
      <div className="absolute top-2 left-2 z-20 text-white text-sm bg-black/60 px-2 py-1 rounded">
        {loading ? 'Loading FaceMesh...' : faceDetected ? 'Face Detected ✓' : 'Face Not Detected ✗'}<br />
        Gaze: {gazeDirection}
      </div>
      <div className="absolute bottom-[-110px] left-0 right-0 z-30 flex justify-center">
        {renderGazeGraph()}
      </div>
    </div>
  );
}
