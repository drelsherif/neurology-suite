import React, { useRef, useEffect, useState } from 'react';

export default function FingerTapTest({ onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Debug states
  const [debugLog, setDebugLog] = useState([]);
  const [cameraStatus, setCameraStatus] = useState('Not started');
  const [mediaStreamReady, setMediaStreamReady] = useState(false);
  const [mediaPipeStatus, setMediaPipeStatus] = useState('Not loaded');
  const [currentStep, setCurrentStep] = useState('initial');
  
  // Test states
  const [isTestMode, setIsTestMode] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    setDebugLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Step 1: Request Camera Permission and Start Video
  const requestCameraAccess = async () => {
    try {
      addLog('🚀 Starting camera permission request...');
      setCurrentStep('requesting_camera');
      setCameraStatus('Requesting permission...');

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      addLog('📱 Camera API is supported');

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      addLog('✅ Camera permission granted!');
      setCameraStatus('Permission granted');

      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          addLog('📹 Video metadata loaded');
          videoRef.current.play();
          setMediaStreamReady(true);
          setCameraStatus('Video playing');
          addLog('🎥 Video is now playing');
          setCurrentStep('camera_ready');
        };

        videoRef.current.onerror = (error) => {
          addLog(`❌ Video error: ${error}`);
          setCameraStatus('Video error');
        };
      }

    } catch (error) {
      addLog(`❌ Camera access failed: ${error.message}`);
      setCameraStatus(`Failed: ${error.message}`);
      
      if (error.name === 'NotAllowedError') {
        addLog('🚫 Permission denied - please allow camera access');
      } else if (error.name === 'NotFoundError') {
        addLog('📷 No camera found');
      } else if (error.name === 'NotSupportedError') {
        addLog('🚫 Camera not supported');
      }
      setCurrentStep('camera_failed');
    }
  };

  // Step 2: Load MediaPipe Scripts
  const loadMediaPipeScripts = async () => {
    try {
      addLog('📦 Loading MediaPipe scripts...');
      setCurrentStep('loading_mediapipe');
      setMediaPipeStatus('Loading scripts...');

      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
      ];

      for (const src of scripts) {
        if (!document.querySelector(`script[src="${src}"]`)) {
          addLog(`⬇️ Loading: ${src.split('/').pop()}`);
          await loadScript(src);
          addLog(`✅ Loaded: ${src.split('/').pop()}`);
        } else {
          addLog(`♻️ Already loaded: ${src.split('/').pop()}`);
        }
      }

      // Wait for MediaPipe to be available
      let attempts = 0;
      while (typeof window.Hands === 'undefined' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (attempts % 10 === 0) {
          addLog(`⏳ Waiting for MediaPipe... (${attempts}/30)`);
        }
      }

      if (typeof window.Hands !== 'undefined') {
        addLog('✅ MediaPipe loaded successfully!');
        setMediaPipeStatus('Ready');
        setCurrentStep('mediapipe_ready');
        return true;
      } else {
        throw new Error('MediaPipe failed to load after timeout');
      }

    } catch (error) {
      addLog(`❌ MediaPipe loading failed: ${error.message}`);
      setMediaPipeStatus(`Failed: ${error.message}`);
      setCurrentStep('mediapipe_failed');
      return false;
    }
  };

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  // Step 3: Initialize MediaPipe Hands
  const initializeMediaPipeHands = async () => {
    try {
      addLog('🤖 Initializing MediaPipe Hands...');
      setCurrentStep('initializing_hands');

      const hands = new window.Hands({
        locateFile: (file) => {
          const url = `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          addLog(`📁 Loading file: ${file}`);
          return url;
        }
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      hands.onResults((results) => {
        drawResults(results);
      });

      addLog('✅ MediaPipe Hands initialized');

      // Initialize camera
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });

      addLog('📹 Camera processor initialized');
      await camera.start();
      addLog('🎬 Camera processing started');
      
      setCurrentStep('fully_ready');
      setIsTestMode(true);

    } catch (error) {
      addLog(`❌ MediaPipe Hands initialization failed: ${error.message}`);
      setCurrentStep('hands_failed');
    }
  };

  // Draw MediaPipe results
  const drawResults = (results) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 640;
    canvas.height = 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Draw hand skeleton
      if (window.drawConnectors && window.HAND_CONNECTIONS) {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        });
      }

      if (window.drawLandmarks) {
        window.drawLandmarks(ctx, landmarks, {
          color: '#FF0000',
          lineWidth: 1,
          radius: 3
        });
      }

      // Highlight index finger tip
      const indexTip = landmarks[8];
      if (indexTip) {
        const x = indexTip.x * canvas.width;
        const y = indexTip.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 15, 0, 2 * Math.PI);
        ctx.fillStyle = '#00FFFF';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('TAP HERE', x - 35, y - 25);
      }
    }
  };

  // Simple tap test
  const startSimpleTest = () => {
    setIsRunning(true);
    setTapCount(0);
    setTimeRemaining(10);
    addLog('🏁 Simple test started - click anywhere to count taps');
  };

  const handleTap = () => {
    if (isRunning) {
      setTapCount(prev => prev + 1);
      addLog(`👆 Tap #${tapCount + 1} detected`);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            addLog(`🏁 Test completed! Total taps: ${tapCount}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, tapCount]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🐛 Debug Finger Tap Test</h1>
      
      {/* Status Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Camera Status</h3>
          <p className="text-sm text-blue-600">{cameraStatus}</p>
          <div className={`w-3 h-3 rounded-full mt-2 ${mediaStreamReady ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">MediaPipe Status</h3>
          <p className="text-sm text-purple-600">{mediaPipeStatus}</p>
          <div className={`w-3 h-3 rounded-full mt-2 ${currentStep === 'fully_ready' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        </div>
        
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Current Step</h3>
          <p className="text-sm text-green-600">{currentStep.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        {currentStep === 'initial' && (
          <button
            onClick={requestCameraAccess}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            1. Request Camera Access
          </button>
        )}
        
        {currentStep === 'camera_ready' && (
          <button
            onClick={loadMediaPipeScripts}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            2. Load MediaPipe
          </button>
        )}
        
        {currentStep === 'mediapipe_ready' && (
          <button
            onClick={initializeMediaPipeHands}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            3. Initialize Hand Tracking
          </button>
        )}
        
        {isTestMode && !isRunning && timeRemaining === 10 && (
          <button
            onClick={startSimpleTest}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Start Simple Test (Click to Count)
          </button>
        )}

        <button
          onClick={() => setDebugLog([])}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Log
        </button>
      </div>

      {/* Test Area */}
      {isRunning && (
        <div className="mb-6 text-center">
          <div className="text-4xl font-bold text-red-600 mb-2">{timeRemaining}s</div>
          <div className="text-2xl font-bold text-blue-600">Taps: {tapCount}</div>
          <button
            onClick={handleTap}
            className="mt-4 px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg text-xl"
          >
            TAP HERE! 👆
          </button>
        </div>
      )}

      {/* Video and Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Video Feed</h3>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!mediaStreamReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <p className="text-white">No video stream</p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">MediaPipe Overlay</h3>
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-64 object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        </div>
      </div>

      {/* Debug Log */}
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        <h3 className="text-white font-semibold mb-2">Debug Log:</h3>
        {debugLog.length === 0 ? (
          <p className="text-gray-500">No log entries yet...</p>
        ) : (
          debugLog.map((entry, index) => (
            <div key={index} className="mb-1">{entry}</div>
          ))
        )}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="mt-6 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Back to Home
        </button>
      )}
    </div>
  );
}