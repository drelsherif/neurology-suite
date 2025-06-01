import React, { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export default function EyeTrackingTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [irisOffset, setIrisOffset] = useState({ x: 0, y: 0 });
  const [gazeHistory, setGazeHistory] = useState([]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
    });

    faceMesh.setOptions({
      selfieMode: true,
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        setFaceDetected(true);
        const lm = results.multiFaceLandmarks[0];

        // Draw face mesh
        lm.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2, 0, 2 * Math.PI);
          ctx.fillStyle = 'lime';
          ctx.fill();
        });

        // Head-anchored gaze tracking
        const leftIris = lm[468];
        const leftEyeInner = lm[133];
        const leftEyeOuter = lm[33];
        const leftEyeTop = lm[159];
        const leftEyeBottom = lm[145];

        const widthNorm = Math.abs(leftEyeOuter.x - leftEyeInner.x);
        const heightNorm = Math.abs(leftEyeTop.y - leftEyeBottom.y);

        const offsetX = (leftIris.x - leftEyeInner.x) / widthNorm - 0.5;
        const offsetY = (leftIris.y - leftEyeTop.y) / heightNorm - 0.5;

        setIrisOffset({ x: offsetX, y: offsetY });
        setGazeHistory(prev => [...prev.slice(-100), { x: offsetX, y: offsetY }]);
      } else {
        setFaceDetected(false);
      }

      setLoading(false);
    });

    const camera = new Camera(video, {
      onFrame: async () => {
        await faceMesh.send({ image: video });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
    };
  }, []);

  const renderGazeGraph = () => {
    const width = 300;
    const height = 100;
    const xMid = width / 2;
    const yMid = height / 2;

    const points = gazeHistory.map((pt, i) => {
      const x = xMid + pt.x * 100;
      const y = yMid + pt.y * 50;
      return `${x},${y}`;
    }).join(' L ');

    return (
      <svg width={width} height={height} className="border border-gray-300 bg-white mt-2">
        <polyline
          fill="none"
          stroke="blue"
          strokeWidth="2"
          points={points ? `M ${points}` : ''}
        />
        <circle cx={xMid} cy={yMid} r="3" fill="red" />
      </svg>
    );
  };

  return (
    <div className="relative w-full max-w-lg mx-auto mt-6 bg-black rounded overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      />
      <div className="absolute top-2 left-2 z-20 text-white bg-black/60 text-sm px-2 py-1 rounded">
        {loading ? 'Loading FaceMesh...' : faceDetected ? 'Face ✓' : 'Face ✗'}<br />
        Offset: x={irisOffset.x.toFixed(2)} y={irisOffset.y.toFixed(2)}
      </div>
      <div className="z-30 relative flex justify-center">{renderGazeGraph()}</div>
    </div>
  );
}
