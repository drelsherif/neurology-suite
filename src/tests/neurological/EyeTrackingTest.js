import React, { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';

export default function EyeTrackingTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [leftIris, setLeftIris] = useState({ x: 0, y: 0 });
  const [rightIris, setRightIris] = useState({ x: 0, y: 0 });
  const [faceDetected, setFaceDetected] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 0.5, y: 0.5 });
  const [trackingData, setTrackingData] = useState([]);
  const [results, setResults] = useState(null);
  const [testRunning, setTestRunning] = useState(false);

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

      if (!results.multiFaceLandmarks?.length) {
        setFaceDetected(false);
        return;
      }

      setFaceDetected(true);
      const lm = results.multiFaceLandmarks[0];

      const getIrisOffset = (irisIndex, innerIndex, outerIndex, topIndex, bottomIndex) => {
        const iris = lm[irisIndex];
        const inner = lm[innerIndex];
        const outer = lm[outerIndex];
        const top = lm[topIndex];
        const bottom = lm[bottomIndex];
        const width = Math.abs(outer.x - inner.x);
        const height = Math.abs(top.y - bottom.y);
        return {
          x: (iris.x - inner.x) / width - 0.5,
          y: (iris.y - top.y) / height - 0.5,
        };
      };

      const leftOffset = getIrisOffset(468, 133, 33, 159, 145);
      const rightOffset = getIrisOffset(473, 362, 263, 386, 374);
      setLeftIris(leftOffset);
      setRightIris(rightOffset);

      ctx.beginPath();
      ctx.arc(lm[468].x * canvas.width, lm[468].y * canvas.height, 4, 0, 2 * Math.PI);
      ctx.strokeStyle = 'red';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(lm[473].x * canvas.width, lm[473].y * canvas.height, 4, 0, 2 * Math.PI);
      ctx.strokeStyle = 'blue';
      ctx.stroke();

      // Draw moving target
      if (testRunning) {
        const dotX = targetPos.x * canvas.width;
        const dotY = targetPos.y * canvas.height;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'yellow';
        ctx.fill();

        // Record tracking data
        setTrackingData(prev => [...prev, {
          left: leftOffset,
          right: rightOffset,
          target: { ...targetPos },
          timestamp: Date.now()
        }]);
      }
    });

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          const detect = async () => {
            await faceMesh.send({ image: video });
            requestAnimationFrame(detect);
          };
          detect();
        };
      } catch (err) {
        console.error('Camera error:', err);
      }
    };

    startCamera();
  }, [targetPos, testRunning]);

  const runTest = () => {
    setTrackingData([]);
    setResults(null);
    setTestRunning(true);

    let angle = 0;
    const start = Date.now();
    const duration = 10000;

    const move = () => {
      const now = Date.now();
      if (now - start > duration) {
        setTestRunning(false);
        analyzeResults();
        return;
      }
      angle += 0.05;
      setTargetPos({
        x: 0.5 + 0.3 * Math.cos(angle),
        y: 0.5 + 0.2 * Math.sin(angle),
      });
      requestAnimationFrame(move);
    };
    move();
  };

  const analyzeResults = () => {
    const errors = trackingData.map(d => {
      const dx = (d.left.x + d.right.x) / 2 - (d.target.x - 0.5);
      const dy = (d.left.y + d.right.y) / 2 - (d.target.y - 0.5);
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist;
    });
    const avgError = (errors.reduce((a, b) => a + b, 0) / errors.length).toFixed(3);
    const maxError = Math.max(...errors).toFixed(3);
    const minError = Math.min(...errors).toFixed(3);
    setResults({ avgError, minError, maxError });
  };

  return (
    <div className="fixed inset-0 bg-black z-0">
      <video
        ref={videoRef}
        width={640}
        height={480}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
      />
      <div className="absolute top-4 left-4 z-20 bg-white/90 text-black text-sm p-2 rounded">
        Face: {faceDetected ? '✓' : '✗'}<br />
        L x: {leftIris.x.toFixed(2)}, y: {leftIris.y.toFixed(2)}<br />
        R x: {rightIris.x.toFixed(2)}, y: {rightIris.y.toFixed(2)}
      </div>
      {!testRunning && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
          <button onClick={runTest} className="bg-blue-600 text-white px-6 py-2 rounded shadow">
            Start Test
          </button>
        </div>
      )}
      {results && (
        <div className="absolute bottom-6 right-4 z-30 bg-white text-black p-3 rounded shadow text-sm">
          <strong>Tracking Results</strong><br />
          Avg error: {results.avgError}<br />
          Min error: {results.minError}<br />
          Max error: {results.maxError}
        </div>
      )}
    </div>
  );
}
