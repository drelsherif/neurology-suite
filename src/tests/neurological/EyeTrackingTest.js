import React, { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

const MODES = {
  standard: { label: 'Standard', duration: 3000, type: 'fixed' },
  fast: { label: 'Fast', duration: 1500, type: 'fixed' },
  random: { label: 'Random Targeting', duration: 2000, type: 'random' },
};

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
  const [irisOffset, setIrisOffset] = useState({ x: 0, y: 0 });
  const [gazeData, setGazeData] = useState([]);
  const [results, setResults] = useState(null);
  const [mode, setMode] = useState('standard');
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [testRunning, setTestRunning] = useState(false);
  const [targetDot, setTargetDot] = useState(null);

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
          setGazeData(prev => [...prev, { offset, timestamp: Date.now(), prompt: currentPrompt }]);
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
  }, [testRunning]);

  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  };

  const startTest = async () => {
    setGazeData([]);
    setResults(null);
    setTestRunning(true);

    if (MODES[mode].type === 'fixed') {
      for (const dir of DIRECTIONS) {
        setCurrentPrompt(dir);
        speak(`Look ${dir}`);
        await new Promise(res => setTimeout(res, MODES[mode].duration));
      }
    } else if (MODES[mode].type === 'random') {
      const targets = [];
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * 0.4 - 0.2;
        const y = Math.random() * 0.4 - 0.2;
        targets.push({ x, y, start: Date.now() });
        setTargetDot({ x, y });
        speak('Target');
        await new Promise(res => setTimeout(res, MODES[mode].duration));
      }
    }

    setTestRunning(false);
    setCurrentPrompt(null);
    setTargetDot(null);
    summarize();
  };

  const summarize = () => {
    const summary = DIRECTIONS.map(dir => {
      const target = OFFSETS[dir];
      const samples = gazeData.filter(d => d.prompt === dir);
      const hits = samples.filter(d =>
        Math.abs(d.offset.x - target.x) < 0.15 && Math.abs(d.offset.y - target.y) < 0.15
      );
      return {
        direction: dir,
        attempts: samples.length,
        hits: hits.length,
        accuracy: samples.length ? (hits.length / samples.length * 100).toFixed(1) : '0.0'
      };
    });
    setResults(summary);
  };

  const renderRedDot = () => {
    if (!targetDot) return null;
    const cx = 640 * (0.5 + targetDot.x);
    const cy = 480 * (0.5 + targetDot.y);
    return (
      <div
        className="absolute z-30 w-4 h-4 bg-red-500 rounded-full"
        style={{ left: `${cx}px`, top: `${cy}px`, transform: 'translate(-50%, -50%)' }}
      />
    );
  };

  return (
    <div className="relative w-full max-w-lg mx-auto mt-6 bg-black rounded overflow-hidden">
      <div className="absolute top-2 left-2 z-40">
        <select value={mode} onChange={e => setMode(e.target.value)} className="p-2 rounded text-black">
          {Object.keys(MODES).map(m => <option key={m} value={m}>{MODES[m].label}</option>)}
        </select>
      </div>
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
      {renderRedDot()}
      <div className="absolute top-2 right-2 z-20 bg-black/60 text-white text-sm px-3 py-2 rounded">
        {faceDetected ? 'Face ✓' : 'Face ✗'}<br />
        Offset: x={irisOffset.x.toFixed(2)} y={irisOffset.y.toFixed(2)}
      </div>
      <div className="absolute bottom-4 left-4 z-30">
        {!testRunning && (
          <button onClick={startTest} className="bg-blue-600 text-white px-4 py-2 rounded shadow">
            Start Test
          </button>
        )}
      </div>
      {results && (
        <div className="absolute bottom-4 right-4 z-30 text-sm bg-white/90 p-3 rounded text-black">
          <strong>Results</strong>
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
