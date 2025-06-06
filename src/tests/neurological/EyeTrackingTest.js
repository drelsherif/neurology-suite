import React, { useEffect, useRef, useState } from 'react';
import * as mpFace from '@mediapipe/face_mesh';

export default function EyeTrackingTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const zoomCanvasRef = useRef(null);
  const targetPosRef = useRef({ x: 0.5, y: 0.5 });

  const [faceDetected, setFaceDetected] = useState(false);
  const [trackingData, setTrackingData] = useState([]);
  const [results, setResults] = useState(null);
  const [testRunning, setTestRunning] = useState(false);

  const prevLeft = useRef({ x: 0, y: 0 });
  const prevRight = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const zoomCanvas = zoomCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const zoomCtx = zoomCanvas.getContext('2d');

    const faceMesh = new mpFace.FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
    });

    faceMesh.setOptions({
      selfieMode: true,
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.8,
    });

    faceMesh.onResults((results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      zoomCtx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);

      if (!results.multiFaceLandmarks?.length) {
        setFaceDetected(false);
        return;
      }

      setFaceDetected(true);
      const lm = results.multiFaceLandmarks[0];

      const smoothIris = (current, prev) => {
        const smooth = {
          x: 0.8 * prev.x + 0.2 * current.x,
          y: 0.8 * prev.y + 0.2 * current.y,
        };
        return smooth;
      };

      const getIris = (irisIdx, innerIdx, outerIdx, topIdx, bottomIdx, prev) => {
        const iris = lm[irisIdx];
        const inner = lm[innerIdx];
        const outer = lm[outerIdx];
        const top = lm[topIdx];
        const bottom = lm[bottomIdx];

        const width = Math.abs(outer.x - inner.x);
        const height = Math.abs(top.y - bottom.y);

        if (width < 0.01 || height < 0.01) return prev;

        const offset = {
          x: (iris.x - inner.x) / width - 0.5,
          y: (iris.y - top.y) / height - 0.5,
        };

        const smoothed = smoothIris(offset, prev);
        return smoothed;
      };

      const left = getIris(468, 133, 33, 159, 145, prevLeft.current);
      const right = getIris(473, 362, 263, 386, 374, prevRight.current);

      prevLeft.current = left;
      prevRight.current = right;

      // Midpoint
      const midX = (lm[468].x + lm[473].x) / 2;
      const midY = (lm[468].y + lm[473].y) / 2;
      const anchorX = midX * canvas.width;
      const anchorY = midY * canvas.height;

      ctx.beginPath();
      ctx.arc(anchorX, anchorY, 5, 0, 2 * Math.PI);
      ctx.strokeStyle = 'blue';
      ctx.stroke();

      if (testRunning) {
        const dotX = targetPosRef.current.x * canvas.width;
        const dotY = targetPosRef.current.y * canvas.height;

        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'yellow';
        ctx.fill();

        setTrackingData(prev => [
          ...prev,
          {
            left,
            right,
            target: { ...targetPosRef.current },
            timestamp: Date.now(),
          },
        ]);

        // Zoom box
        const lx = lm[468].x * canvas.width;
        const ly = lm[468].y * canvas.height;
        const rx = lm[473].x * canvas.width;
        const ry = lm[473].y * canvas.height;

        const centerX = (lx + rx) / 2;
        const centerY = (ly + ry) / 2;
        const boxW = Math.abs(rx - lx) + 80;
        const boxH = Math.abs(ry - ly) + 80;
        const boxX = Math.max(0, Math.min(canvas.width - boxW, centerX - boxW / 2));
        const boxY = Math.max(0, Math.min(canvas.height - boxH, centerY - boxH / 2));

        zoomCtx.drawImage(video, boxX, boxY, boxW, boxH, 0, 0, zoomCanvas.width, zoomCanvas.height);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(boxX, boxY, boxW, boxH);
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
  }, [testRunning]);

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
      angle += 0.04;
      targetPosRef.current = {
        x: 0.5 + 0.25 * Math.cos(angle),
        y: 0.5 + 0.18 * Math.sin(angle),
      };
      requestAnimationFrame(move);
    };
    move();
  };

  const analyzeResults = () => {
    const errors = trackingData.map(d => {
      const dx = (d.left.x + d.right.x) / 2 - (d.target.x - 0.5);
      const dy = (d.left.y + d.right.y) / 2 - (d.target.y - 0.5);
      return Math.sqrt(dx * dx + dy * dy);
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
      <canvas
        ref={zoomCanvasRef}
        width={200}
        height={120}
        className="absolute bottom-4 left-4 z-20 border-2 border-white bg-black"
      />
      <div className="absolute top-4 left-4 z-30 bg-white/90 text-black text-sm p-2 rounded">
        Face: {faceDetected ? '✓' : '✗'}
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
