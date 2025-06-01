import React, { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

const DIRECTIONS = ['center', 'left', 'right', 'up', 'down'];
const OFFSETS = {
  center: { x: 0, y: 0 },
  left: { x: -0.2, y: 0 },
  right: { x: 0.2, y: 0 },
  up: { x: 0, y: -0.2 },
  down: { x: 0, y: 0.2 },
};

export default function EyeTrackingTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [irisOffset, setIrisOffset] = useState({ x: 0, y: 0 });
  const [gazeData, setGazeData] = useState([]);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [testRunning, setTestRunning] = useState(false);
  const [results, setResults] = useState(null);

  const PHASE_DURATION = 3000;

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

      if (results.multiFaceLandmarks?.length) {
        setFaceDetected(true);
        const lm = results.multiFaceLandmarks[0];

        const iris = lm[468];
        const eyeInner = lm[133];
        const eyeOuter = lm[33];
        const eyeTop = lm[159];
        const eyeBottom = lm[145];

        const width = Math.abs(eyeOuter.x - eyeInner.x);
        const height = Math.abs(eyeTop.y - eyeBottom.y);

        const offsetX = (iris.x - eyeInner.x) / width - 0.5;
        const offsetY = (iris.y - eyeTop.y) / height - 0.5;

        const offset = { x: offsetX, y: offsetY };
        setIrisOffset(offset);

        if (testRunning) {
          setGazeData(prev => [...prev, { offset, timestamp: Date.now(), direction: DIRECTIONS[currentPhase] }]);
        }

        lm.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2, 0, 2 * Math.PI);
          ctx.fillStyle = 'lime';
          ctx.fill();
        });
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
    return () => camera.stop();
  }, [testRunning, currentPhase]);

  const runTest = async () => {
    setGazeData([]);
    setResults(null);
    setTestRunning(true);
    for (let i = 0; i < DIRECTIONS.length; i++) {
      setCurrentPhase(i);
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(DIRECTIONS[i]));
      await new Promise(res => setTimeout(res, PHASE_DURATION));
    }
    setTestRunning(false);
    calculateResults();
  };

  const calculateResults = () => {
    const summary = DIRECTIONS.map(dir => {
      const target = OFFSETS[dir];
      const samples = gazeData.filter(d => d.direction === dir);
      const withinThreshold = samples.filter(d =>
        Math.abs(d.offset.x - target.x) < 0.15 && Math.abs(d.offset.y - target.y) < 0.15
      );
      return {
        direction: dir,
        attempts: samples.length,
        hits: withinThreshold.length,
        accuracy: samples.length ? (withinThreshold.length / samples.length * 100).toFixed(1) : '0.0'
      };
    });
    setResults(summary);
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
      <div className="absolute top-2 left-2 z-20 bg-black/60 text-white text-sm px-3 py-2 rounded">
        {loading ? 'Loading...' : faceDetected ? 'Face ✓' : 'Face ✗'}<br />
        Offset: x={irisOffset.x.toFixed(2)} y={irisOffset.y.toFixed(2)}<br />
        {testRunning && }
      </div>
      <div className="absolute bottom-4 left-4 z-30">
        {!testRunning && (
          <button onClick={runTest} className="bg-blue-600 text-white px-4 py-2 rounded shadow">
            Start Eye Test
          </button>
        )}
      </div>
      {results && (
        <div className="absolute bottom-4 right-4 z-30 text-sm bg-white/90 p-3 rounded text-black">
          <strong>Test Results</strong>
          <ul>
            {results.map(r => (
              <li key={r.direction}>
                {r.direction}: {r.accuracy}% ({r.hits}/{r.attempts})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
