import React, { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

const TEST_MODES = {
  standard: { label: 'Standard (3s)', duration: 3000 },
  fast: { label: 'Fast (1.5s)', duration: 1500 },
};

const PROMPTS = ['center', 'left', 'right', 'up', 'down'];
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
  const [mode, setMode] = useState('standard');
  const [running, setRunning] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [results, setResults] = useState([]);

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

      const iris = lm[468];
      const inner = lm[133];
      const outer = lm[33];
      const top = lm[159];
      const bottom = lm[145];
      const width = Math.abs(outer.x - inner.x);
      const height = Math.abs(top.y - bottom.y);

      const offsetX = (iris.x - inner.x) / width - 0.5;
      const offsetY = (iris.y - top.y) / height - 0.5;

      const offset = { x: offsetX, y: offsetY };
      setIrisOffset(offset);

      if (running) {
        setGazeData((prev) => [
          ...prev,
          { offset, time: Date.now(), prompt: currentPrompt },
        ]);
      }

      lm.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'lime';
        ctx.fill();
      });
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
  }, [running, currentPrompt]);

  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  const startTest = async () => {
    setGazeData([]);
    setResults([]);
    setRunning(true);
    for (const dir of PROMPTS) {
      setCurrentPrompt(dir);
      speak(`Look ${dir}`);
      await new Promise((res) => setTimeout(res, TEST_MODES[mode].duration));
    }
    setRunning(false);
    setCurrentPrompt(null);
    summarize();
  };

  const summarize = () => {
    const result = PROMPTS.map((dir) => {
      const expected = OFFSETS[dir];
      const samples = gazeData.filter((d) => d.prompt === dir);
      const hits = samples.filter(
        (d) =>
          Math.abs(d.offset.x - expected.x) < 0.15 &&
          Math.abs(d.offset.y - expected.y) < 0.15
      );
      return {
        direction: dir,
        total: samples.length,
        hits: hits.length,
        accuracy: samples.length
          ? ((hits.length / samples.length) * 100).toFixed(1)
          : '0.0',
      };
    });
    setResults(result);
  };

  return (
    <div className="fixed inset-0 bg-black z-0">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
      <div className="absolute top-4 left-4 z-20 bg-white text-black rounded p-2 text-sm">
        <label>Mode:</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="ml-2"
        >
          {Object.entries(TEST_MODES).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>
      <div className="absolute top-4 right-4 z-20 text-white text-sm bg-black/60 px-3 py-2 rounded">
        Face: {faceDetected ? '✓' : '✗'}<br />
        Offset: x={irisOffset.x.toFixed(2)} y={irisOffset.y.toFixed(2)}<br />
        {currentPrompt && <div className="mt-1">Target: {currentPrompt}</div>}
      </div>
      {!running && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
          <button
            onClick={startTest}
            className="bg-blue-600 text-white px-6 py-2 rounded shadow"
          >
            Start Eye Test
          </button>
        </div>
      )}
      {results.length > 0 && (
        <div className="absolute bottom-4 right-4 z-30 bg-white text-black p-3 rounded text-sm shadow">
          <strong>Results</strong>
          <ul className="mt-1">
            {results.map((r) => (
              <li key={r.direction}>
                {r.direction}: {r.accuracy}% ({r.hits}/{r.total})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
