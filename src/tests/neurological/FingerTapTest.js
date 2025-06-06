import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function FingerTapTest({ onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null); // Separate canvas for flash effects
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  
  // Test states
  const [testPhase, setTestPhase] = useState('setup');
  const [currentHand, setCurrentHand] = useState('right');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimes, setTapTimes] = useState([]);
  
  // Test results
  const [testResults, setTestResults] = useState({
    rightHand: null,
    leftHand: null
  });
  
  // Preloading states
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [mediaPipeLoaded, setMediaPipeLoaded] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadError, setPreloadError] = useState(null);
  const [preloadLog, setPreloadLog] = useState([]);
  
  // MediaPipe states
  const [cameraReady, setCameraReady] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [currentHandedness, setCurrentHandedness] = useState('Unknown');
  const [mediaPipeReady, setMediaPipeReady] = useState(false);
  
  // Settings
  const [sensitivity, setSensitivity] = useState('normal');
  
  // Tap detection refs - stable across re-renders
  const lastFingerTipY = useRef(null);
  const lastTapTime = useRef(0);
  const tapCountRef = useRef(0);
  const isRunningRef = useRef(false);

  const addPreloadLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    setPreloadLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Preload everything on component mount
  useEffect(() => {
    preloadEverything();
  }, []);

  const preloadEverything = async () => {
    try {
      addPreloadLog('🚀 Starting preload process...');
      setIsPreloading(true);
      setPreloadError(null);

      addPreloadLog('📷 Requesting camera permissions...');
      await requestCameraPermissions();
      
      addPreloadLog('📦 Loading MediaPipe scripts...');
      await loadMediaPipeScripts();
      
      addPreloadLog('🤖 Pre-initializing MediaPipe...');
      await initializeMediaPipe();
      
      addPreloadLog('✅ Preload complete - ready for testing!');
      setIsPreloading(false);
      
    } catch (error) {
      addPreloadLog(`❌ Preload failed: ${error.message}`);
      setPreloadError(error.message);
      setIsPreloading(false);
    }
  };

  const requestCameraPermissions = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' 
        } 
      });
      
      addPreloadLog('✅ Camera permission granted');
      setCameraPermissionGranted(true);
      
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      let errorMessage = 'Camera access failed: ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Permission denied. Please allow camera access and refresh.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found.';
      } else {
        errorMessage += error.message;
      }
      throw new Error(errorMessage);
    }
  };

  const loadMediaPipeScripts = async () => {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
    ];

    for (const src of scripts) {
      if (!document.querySelector(`script[src="${src}"]`)) {
        addPreloadLog(`⬇️ Loading: ${src.split('/').pop()}`);
        await loadScript(src);
        addPreloadLog(`✅ Loaded: ${src.split('/').pop()}`);
      } else {
        addPreloadLog(`♻️ Already loaded: ${src.split('/').pop()}`);
      }
    }
    
    let attempts = 0;
    while (typeof window.Hands === 'undefined' && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      if (attempts % 10 === 0) {
        addPreloadLog(`⏳ Waiting for MediaPipe... (${attempts}/50)`);
      }
    }
    
    if (typeof window.Hands === 'undefined') {
      throw new Error('MediaPipe failed to load after timeout');
    }
    
    addPreloadLog('✅ MediaPipe scripts loaded successfully');
    setMediaPipeLoaded(true);
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

  const initializeMediaPipe = async () => {
    try {
      handsRef.current = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      handsRef.current.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      handsRef.current.onResults(onResults);

      addPreloadLog('✅ MediaPipe pre-initialized');
      return true;
    } catch (error) {
      throw new Error(`MediaPipe initialization failed: ${error.message}`);
    }
  };

  // PERFECT tap detection - no interference with MediaPipe
  const detectTap = useCallback((landmarks) => {
    if (!isRunningRef.current) return;
    
    const indexTip = landmarks[8];
    if (!indexTip || !canvasRef.current) return;

    const tipY = indexTip.y * canvasRef.current.height;
    
    if (lastFingerTipY.current !== null) {
      const movement = Math.abs(tipY - lastFingerTipY.current);
      
      // Perfect threshold for iPhone
      if (movement > 30) {
        const currentTime = Date.now();
        
        if (currentTime - lastTapTime.current > 300) { // Prevent double-counting
          lastTapTime.current = currentTime;
          tapCountRef.current++;
          
          console.log(`🎉 TAP ${tapCountRef.current}! Movement: ${movement.toFixed(1)}px`);
          
          // Update state without breaking MediaPipe
          setTapCount(tapCountRef.current);
          setTapTimes(prev => [...prev, currentTime]);
          
          // Non-interfering visual feedback
          showFlashEffect(indexTip);
        }
      }
    }
    
    lastFingerTipY.current = tipY;
  }, []); // Zero dependencies = stable callback

  // Non-interfering flash effect using separate canvas
  const showFlashEffect = (indexTip) => {
    if (!overlayCanvasRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const x = indexTip.x * canvas.width;
    const y = indexTip.y * canvas.height;
    
    // Clear previous flash
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw flash
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
    
    // Auto-clear flash
    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 200);
  };

  // MediaPipe results handler - clean and minimal
  const onResults = useCallback((results) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 640;
    canvas.height = 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      setHandDetected(true);
      const handedness = results.multiHandedness?.[0]?.label || 'Unknown';
      setCurrentHandedness(handedness);

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

      // Detect taps without interfering with rendering
      detectTap(landmarks);
      
    } else {
      setHandDetected(false);
      setCurrentHandedness('Unknown');
      
      ctx.fillStyle = '#FFFF00';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Show your hand in the camera', canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
    }
  }, [detectTap]);

  // Start camera
  const startCamera = async () => {
    try {
      if (!handsRef.current) {
        throw new Error('MediaPipe not ready');
      }

      cameraRef.current = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && handsRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });

      await cameraRef.current.start();
      setCameraReady(true);
      setMediaPipeReady(true);
      return true;
    } catch (error) {
      console.error('❌ Camera start failed:', error);
      throw error;
    }
  };

  const stopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      setCameraReady(false);
      setMediaPipeReady(false);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  // Sync isRunning state with ref
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const startTest = async () => {
    try {
      console.log('🏁 Starting test...');
      
      await startCamera();
      
      // Reset everything
      lastFingerTipY.current = null;
      lastTapTime.current = 0;
      tapCountRef.current = 0;
      
      setTapCount(0);
      setTapTimes([]);
      setTimeRemaining(10);
      setTestPhase('testing');
      setIsRunning(true);
      
      console.log('⏰ Test started - tap detection active!');
    } catch (error) {
      console.error('❌ Test start failed:', error);
      alert(`Test failed to start: ${error.message}`);
    }
  };

  const stopTest = () => {
    console.log('⏹️ Stopping test...');
    setIsRunning(false);
    stopCamera();
    
    const results = calculateResults();
    setTestResults(prev => ({
      ...prev,
      [currentHand + 'Hand']: results
    }));
    
    if (currentHand === 'right' && !testResults.leftHand) {
      setTestPhase('switchHands');
    } else {
      setTestPhase('results');
    }
  };

  const calculateResults = () => {
    if (tapTimes.length < 2) {
      return {
        tapCount: 0,
        tapsPerSecond: 0,
        testTime: 10,
        hand: currentHand,
        rhythmScore: 0,
        consistency: 'Insufficient data'
      };
    }
    
    const totalTime = 10;
    const tapsPerSecond = Math.round((tapCount / totalTime) * 10) / 10;
    
    // Calculate rhythm metrics
    const intervals = [];
    for (let i = 1; i < tapTimes.length; i++) {
      intervals.push(tapTimes[i] - tapTimes[i - 1]);
    }

    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, interval) => {
      return acc + Math.pow(interval - meanInterval, 2);
    }, 0) / intervals.length;
    
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / meanInterval) * 100;
    const rhythmScore = Math.max(0, Math.round(100 - coefficientOfVariation));
    
    let consistency;
    if (coefficientOfVariation < 15) consistency = 'Excellent';
    else if (coefficientOfVariation < 25) consistency = 'Good';
    else if (coefficientOfVariation < 40) consistency = 'Fair';
    else consistency = 'Poor';
    
    let speedClassification;
    if (tapsPerSecond >= 6) speedClassification = 'Excellent';
    else if (tapsPerSecond >= 4.5) speedClassification = 'Good';
    else if (tapsPerSecond >= 3) speedClassification = 'Fair';
    else if (tapsPerSecond >= 2) speedClassification = 'Below Normal';
    else speedClassification = 'Significantly Impaired';
    
    return {
      tapCount,
      tapsPerSecond,
      rhythmScore,
      avgInterval: Math.round(meanInterval),
      consistency,
      speedClassification,
      coefficientOfVariation: Math.round(coefficientOfVariation * 10) / 10,
      detectedHandedness: currentHandedness,
      testTime: totalTime,
      hand: currentHand,
      percentileRank: Math.min(100, Math.round((tapsPerSecond / 7) * 100))
    };
  };

  const switchToLeftHand = () => {
    setCurrentHand('left');
    setTestPhase('instructions');
    setHandDetected(false);
    setCameraReady(false);
    setMediaPipeReady(false);
  };

  const resetTest = () => {
    stopCamera();
    
    setTestPhase('setup');
    setCurrentHand('right');
    setTestResults({ rightHand: null, leftHand: null });
    setCameraReady(false);
    setHandDetected(false);
    setMediaPipeReady(false);
    setTimeRemaining(10);
    setTapCount(0);
    setTapTimes([]);
    setIsRunning(false);
    setCurrentHandedness('Unknown');
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Show preloading screen
  if (isPreloading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Preparing AI Test...</h2>
            <p className="text-lg text-gray-600">
              Loading camera permissions and MediaPipe AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className={`p-4 rounded-lg border ${cameraPermissionGranted ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center">
                <span className="text-2xl mr-3">{cameraPermissionGranted ? '✅' : '📷'}</span>
                <div>
                  <div className="font-semibold">Camera Permissions</div>
                  <div className="text-sm">{cameraPermissionGranted ? 'Granted' : 'Requesting...'}</div>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${mediaPipeLoaded ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center">
                <span className="text-2xl mr-3">{mediaPipeLoaded ? '✅' : '🤖'}</span>
                <div>
                  <div className="font-semibold">MediaPipe AI</div>
                  <div className="text-sm">{mediaPipeLoaded ? 'Loaded' : 'Loading...'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto text-left max-w-3xl mx-auto">
            <h3 className="text-white font-semibold mb-2">Loading Progress:</h3>
            {preloadLog.map((entry, index) => (
              <div key={index} className="mb-1">{entry}</div>
            ))}
          </div>

          {preloadError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700 max-w-md mx-auto">
              <div className="font-medium mb-1">⚠️ Preload Failed</div>
              <div className="text-sm mb-3">{preloadError}</div>
              <button 
                onClick={() => {
                  setPreloadError(null);
                  setPreloadLog([]);
                  preloadEverything();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {onBack && (
            <button onClick={onBack} className="text-gray-600 hover:text-gray-800 underline">
              ← Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  if (preloadError && !isPreloading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Setup Failed</h2>
            <p className="text-lg text-gray-600 mb-4">
              Unable to prepare the AI test environment
            </p>
            
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700 max-w-md mx-auto mb-6">
              <div className="font-medium mb-1">Error Details:</div>
              <div className="text-sm">{preloadError}</div>
            </div>

            <button 
              onClick={() => {
                setPreloadError(null);
                setPreloadLog([]);
                setIsPreloading(true);
                preloadEverything();
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Try Again
            </button>

            {onBack && (
              <button onClick={onBack} className="block mx-auto mt-4 text-gray-600 hover:text-gray-800 underline">
                ← Back to Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (testPhase === 'setup') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎉</span>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">AI Test Ready!</h2>
            <p className="text-lg text-gray-600">
              Camera permissions granted, MediaPipe AI loaded
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="p-4 rounded-lg border bg-green-50 border-green-200">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <div className="font-semibold text-green-800">Camera Ready</div>
                  <div className="text-sm text-green-600">Permissions granted</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border bg-green-50 border-green-200">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <div className="font-semibold text-green-800">MediaPipe AI</div>
                  <div className="text-sm text-green-600">Fully loaded</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-left space-y-4 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-800">Test Features</h3>
            <ul className="space-y-2 text-blue-700">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Real-time finger tracking with MediaPipe
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Automatic tap detection and counting
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                Advanced rhythm and consistency analysis
              </li>
            </ul>
          </div>

          <button
            onClick={() => setTestPhase('instructions')}
            className="px-8 py-4 text-lg font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Begin AI Test ⚡
          </button>

          {onBack && (
            <button onClick={onBack} className="block mx-auto mt-4 text-gray-600 hover:text-gray-800 underline">
              ← Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  if (testPhase === 'instructions') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {currentHand === 'right' ? 'Right' : 'Left'} Hand Instructions
          </h2>
          <p className="text-lg text-gray-600">AI will automatically detect your finger taps</p>
        </div>

        {/* Video and Canvas on instructions screen */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {/* MediaPipe canvas */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full"
            style={{ transform: 'scaleX(-1)' }}
          />
          {/* Separate flash effect canvas */}
          <canvas
            ref={overlayCanvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white p-6">
              <div className="text-4xl mb-4">📹</div>
              <p className="text-lg font-semibold mb-2">Camera Preview</p>
              <p className="text-sm text-gray-300">Position your {currentHand} hand here</p>
              {cameraReady && (
                <div className="text-green-400 text-sm mt-2">✅ Camera Ready</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-600 mb-4">Hand Position</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>• Position your {currentHand} hand clearly in the camera view</p>
              <p>• Keep your index finger visible at all times</p>
              <p>• Maintain good lighting for optimal tracking</p>
              <p>• Keep your hand steady but relaxed</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-600 mb-4">Tapping Technique</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>• Tap with your index finger in a natural up-down motion</p>
              <p>• Make clear, deliberate tapping movements</p>
              <p>• No need to click anything - just tap naturally!</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg max-w-3xl mx-auto">
          <p className="text-blue-800 text-sm">
            <strong>✨ AI Magic:</strong> MediaPipe will track your hand skeleton in real-time and automatically detect finger taps. 
            You'll see a green hand outline and cyan dot on your index finger tip.
          </p>
        </div>

        <div className="flex space-x-4 justify-center">
          <button 
            onClick={() => setTestPhase('setup')} 
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
          <button 
            onClick={startTest}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start AI Tracking Test ⚡
          </button>
        </div>
      </div>
    );
  }

  if (testPhase === 'testing') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            AI Tracking: {currentHand === 'right' ? 'Right' : 'Left'} Hand
          </h2>
          <div className="text-6xl font-bold text-blue-600 mb-2">{timeRemaining}s</div>
          <p className="text-lg text-gray-600">Tap naturally - AI will detect automatically</p>
        </div>

        {/* Camera Feed - Reuse same elements */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-96 object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {/* MediaPipe canvas */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full"
            style={{ transform: 'scaleX(-1)' }}
          />
          {/* Flash effect overlay canvas */}
          <canvas
            ref={overlayCanvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Status indicators */}
          <div className="absolute top-4 right-4 space-y-2">
            <div className={`flex items-center px-3 py-1 rounded text-sm ${cameraReady ? 'bg-green-900/70 text-green-300' : 'bg-red-900/70 text-red-300'}`}>
              {cameraReady ? '📷 Camera Ready' : '📷 Starting...'}
            </div>
            <div className={`flex items-center px-3 py-1 rounded text-sm ${mediaPipeReady ? 'bg-blue-900/70 text-blue-300' : 'bg-yellow-900/70 text-yellow-300'}`}>
              {mediaPipeReady ? '🤖 AI Ready' : '🤖 AI Starting'}
            </div>
          </div>

          {/* Hand detection status */}
          <div className="absolute bottom-4 right-4">
            {handDetected ? (
              <div className="bg-green-900/70 px-3 py-2 rounded text-green-300">
                <div className="font-semibold">✋ {currentHandedness} Hand Tracked</div>
                <div className="text-sm">Ready for tapping</div>
              </div>
            ) : (
              <div className="bg-red-900/70 px-3 py-2 rounded text-red-300">
                <div className="font-semibold">🔍 Show your {currentHand} hand</div>
                <div className="text-sm">Position hand in camera view</div>
              </div>
            )}
          </div>
          
          {/* Performance overlay */}
          <div className="absolute top-4 left-4 bg-black/90 px-4 py-3 rounded text-white">
            <div className="text-3xl font-bold text-yellow-400">{tapCount}</div>
            <div className="text-sm">taps detected</div>
            <div className="text-blue-400 text-sm">
              {(tapCount / Math.max(10 - timeRemaining, 1)).toFixed(1)} taps/sec
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Running: {isRunning ? '✅ YES' : '❌ NO'}
            </div>
            {timeRemaining <= 3 && timeRemaining > 0 && (
              <div className="text-red-400 text-xs font-bold animate-pulse mt-1">
                🔥 Final {timeRemaining}s!
              </div>
            )}
          </div>

          {/* Instructions overlay */}
          {!handDetected && cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white p-6 bg-black/70 rounded-lg">
                <div className="text-6xl mb-4">🤚</div>
                <p className="text-xl font-semibold mb-2">Position Your {currentHand} Hand</p>
                <p className="text-sm text-gray-300">Make sure your hand is clearly visible in the camera</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={stopTest}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            ⏹️ Stop Test
          </button>
        </div>
      </div>
    );
  }

  if (testPhase === 'switchHands') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎉</span>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Right Hand Complete!</h2>
            <p className="text-lg text-gray-600">
              Excellent! Now let's test your left hand with AI tracking.
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-lg max-w-md mx-auto">
            <div className="text-lg font-semibold text-blue-600 mb-3">Right Hand AI Results</div>
            {testResults.rightHand && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-800">{testResults.rightHand.tapCount}</div>
                  <div className="text-xs text-gray-500">AI Detected Taps</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{testResults.rightHand.tapsPerSecond}</div>
                  <div className="text-xs text-gray-500">Taps/Second</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{testResults.rightHand.rhythmScore}%</div>
                  <div className="text-xs text-gray-500">Rhythm Score</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-4 justify-center">
            <button 
              onClick={() => setTestPhase('results')} 
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Skip Left Hand
            </button>
            <button 
              onClick={switchToLeftHand} 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Left Hand with AI
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (testPhase === 'results') {
    const hasLeftHand = testResults.leftHand !== null;
    const hasRightHand = testResults.rightHand !== null;
    
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">AI Analysis Complete 🤖</h2>
          <p className="text-lg text-gray-600">Advanced MediaPipe finger tracking results</p>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasRightHand && (
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-600 mb-4">Right Hand Analysis</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {testResults.rightHand.tapCount}
                    </div>
                    <div className="text-xs text-gray-500">AI Detected</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {testResults.rightHand.tapsPerSecond}
                    </div>
                    <div className="text-xs text-gray-500">Taps/Second</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {testResults.rightHand.consistency}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testResults.rightHand.rhythmScore}% rhythm consistency
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {testResults.rightHand.speedClassification} • {testResults.rightHand.percentileRank}th percentile
                  </div>
                  {testResults.rightHand.detectedHandedness !== 'Unknown' && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ AI confirmed: {testResults.rightHand.detectedHandedness} hand
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {hasLeftHand && (
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-600 mb-4">Left Hand Analysis</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {testResults.leftHand.tapCount}
                    </div>
                    <div className="text-xs text-gray-500">AI Detected</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {testResults.leftHand.tapsPerSecond}
                    </div>
                    <div className="text-xs text-gray-500">Taps/Second</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {testResults.leftHand.consistency}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testResults.leftHand.rhythmScore}% rhythm consistency
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {testResults.leftHand.speedClassification} • {testResults.leftHand.percentileRank}th percentile
                  </div>
                  {testResults.leftHand.detectedHandedness !== 'Unknown' && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ AI confirmed: {testResults.leftHand.detectedHandedness} hand
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comparison (if both hands tested) */}
        {hasLeftHand && hasRightHand && (
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-600 mb-4">Hand Comparison</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500 mb-2">Speed Difference</div>
                <div className="text-lg font-bold text-yellow-600">
                  {Math.abs(testResults.rightHand.tapsPerSecond - testResults.leftHand.tapsPerSecond).toFixed(1)} taps/sec
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">Dominant Hand</div>
                <div className="text-lg font-bold text-blue-600">
                  {testResults.rightHand.tapsPerSecond >= testResults.leftHand.tapsPerSecond ? 'Right' : 'Left'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">Symmetry</div>
                <div className="text-lg font-bold text-green-600">
                  {Math.abs(testResults.rightHand.tapsPerSecond - testResults.leftHand.tapsPerSecond) < 1 ? 'Good' : 'Asymmetric'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clinical Interpretation */}
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Clinical Interpretation</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong className="text-blue-600">AI Technology:</strong> MediaPipe computer vision provided real-time hand tracking and automatic tap detection
            </p>
            <p>
              <strong className="text-green-600">Normal Range:</strong> Healthy adults typically achieve 4-7 taps per second with good rhythm consistency
            </p>
            {hasLeftHand && hasRightHand && (
              <p>
                <strong className="text-purple-600">Bilateral Assessment:</strong> Comparing both hands helps identify lateralized motor dysfunction
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 justify-center">
          <button
            onClick={resetTest}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 New AI Test
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}