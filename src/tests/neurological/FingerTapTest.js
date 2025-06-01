import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function FingerTapTest({ onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
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
  
  // Tap detection
  const lastFingerTipY = useRef(null);
  const lastTapTime = useRef(0);
  const tapThreshold = useRef(25);
  const minTapInterval = useRef(150);

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

      // Step 1: Request camera permissions immediately
      addPreloadLog('📷 Requesting camera permissions...');
      await requestCameraPermissions();
      
      // Step 2: Load MediaPipe scripts
      addPreloadLog('📦 Loading MediaPipe scripts...');
      await loadMediaPipeScripts();
      
      // Step 3: Initialize MediaPipe (but don't start camera yet)
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
      
      // Stop the test stream - we just wanted permission
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
    
    // Wait for MediaPipe to be available
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
      // Pre-create MediaPipe instance (but don't start camera)
      handsRef.current = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      handsRef.current.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      // Set up results callback (will be used later)
      handsRef.current.onResults(onResults);

      addPreloadLog('✅ MediaPipe pre-initialized');
      return true;
    } catch (error) {
      throw new Error(`MediaPipe initialization failed: ${error.message}`);
    }
  };

  // Adjust sensitivity
  const adjustSensitivity = useCallback((sens) => {
    switch (sens) {
      case 'low':
        tapThreshold.current = 35;
        minTapInterval.current = 200;
        break;
      case 'high':
        tapThreshold.current = 15;
        minTapInterval.current = 100;
        break;
      default:
        tapThreshold.current = 25;
        minTapInterval.current = 150;
    }
  }, []);

  // Tap detection logic
  const detectTap = useCallback((landmarks) => {
    if (!isRunning) return;
    
    const indexTip = landmarks[8];
    const indexDip = landmarks[7];
    const indexPip = landmarks[6];
    
    if (!indexTip || !indexDip || !indexPip) return;

    const tipY = indexTip.y * canvasRef.current.height;
    const dipY = indexDip.y * canvasRef.current.height;
    const pipY = indexPip.y * canvasRef.current.height;
    
    const fingerCurvature = (dipY + pipY) / 2 - tipY;
    
    if (lastFingerTipY.current !== null) {
      const movement = tipY - lastFingerTipY.current;
      const currentTime = Date.now();
      
      if (movement > tapThreshold.current && 
          fingerCurvature < 40 && 
          currentTime - lastTapTime.current > minTapInterval.current) {
        
        lastTapTime.current = currentTime;
        
        console.log('👆 Tap detected!');
        setTapCount(prev => prev + 1);
        setTapTimes(prev => [...prev, currentTime]);
        
        // Visual feedback
        flashFingerTip(indexTip);
      }
    }
    
    lastFingerTipY.current = tipY;
  }, [isRunning]);

  const flashFingerTip = (indexTip) => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const x = indexTip.x * canvasRef.current.width;
    const y = indexTip.y * canvasRef.current.height;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.fill();
    ctx.restore();
  };

  // MediaPipe results handler
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

      // Detect taps
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

  // Start camera when test begins
  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...');
      
      if (!handsRef.current) {
        throw new Error('MediaPipe not ready');
      }

      if (!videoRef.current) {
        throw new Error('Video element not ready - please wait a moment and try again');
      }

      if (!canvasRef.current) {
        throw new Error('Canvas element not ready - please wait a moment and try again');
      }

      // Wait a bit for elements to be fully mounted
      await new Promise(resolve => setTimeout(resolve, 100));

      // Double-check elements are still available
      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Video/Canvas elements became unavailable');
      }

      console.log('📹 Creating camera instance...');
      
      // Create camera instance with error handling
      cameraRef.current = new window.Camera(videoRef.current, {
        onFrame: async () => {
          try {
            if (videoRef.current && handsRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          } catch (frameError) {
            console.warn('Frame processing error:', frameError);
          }
        },
        width: 640,
        height: 480,
      });

      console.log('▶️ Starting camera stream...');
      await cameraRef.current.start();
      
      setCameraReady(true);
      setMediaPipeReady(true);
      console.log('✅ Camera started successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Camera start failed:', error);
      throw new Error(`Camera failed to start: ${error.message}`);
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

  const startTest = async () => {
    try {
      console.log('🏁 Starting test...');
      
      // Check if we're in the right phase
      if (testPhase !== 'instructions') {
        console.log('Setting test phase to testing...');
        setTestPhase('testing');
      }
      
      adjustSensitivity(sensitivity);
      
      // Wait a moment for the phase transition and DOM updates
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Start camera (MediaPipe already loaded)
      console.log('📷 Attempting to start camera...');
      await startCamera();
      
      setTapCount(0);
      setTapTimes([]);
      setTimeRemaining(10);
      setIsRunning(true);
      setTestPhase('testing');
      
      lastFingerTipY.current = null;
      lastTapTime.current = 0;
      
      console.log('⏰ Test started - start tapping!');
    } catch (error) {
      console.error('❌ Test start failed:', error);
      
      // Reset states on failure
      setIsRunning(false);
      setCameraReady(false);
      setMediaPipeReady(false);
      
      // Show user-friendly error
      alert(`Test failed to start: ${error.message}\n\nTry refreshing the page if the problem persists.`);
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
    
    console.log('📊 Test results:', results);
    
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
    console.log('🔄 Resetting test...');
    
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

          {/* Preload Status */}
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

          {/* Preload Log */}
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

  // Show preload error screen
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

            <div className="space-y-4">
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
              
              <div className="text-sm text-gray-600">
                <p><strong>Common solutions:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Refresh the page and allow camera permissions</li>
                  <li>Check internet connection for MediaPipe loading</li>
                  <li>Try a different browser (Chrome recommended)</li>
                  <li>Ensure HTTPS connection for camera access</li>
                </ul>
              </div>

              {onBack && (
                <button onClick={onBack} className="text-gray-600 hover:text-gray-800 underline">
                  ← Back to Home
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal test flow starts here (setup phase)
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

          {/* Ready Status */}
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

          {/* Sensitivity Settings */}
          <div className="bg-gray-50 p-4 rounded-lg max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700 font-semibold">Sensitivity</span>
              <select 
                value={sensitivity} 
                onChange={(e) => setSensitivity(e.target.value)}
                className="bg-white border border-gray-300 px-3 py-1 rounded"
              >
                <option value="low">Low (Less sensitive)</option>
                <option value="normal">Normal (Recommended)</option>
                <option value="high">High (More sensitive)</option>
              </select>
            </div>
            <p className="text-sm text-gray-500">
              Adjust if taps aren't being detected properly
            </p>
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
              <p>• The AI will automatically count each tap</p>
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

        {/* Camera Feed */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-96 object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full"
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
          <div className="absolute top-4 left-4 bg-black/80 px-4 py-3 rounded text-white">
            <div className="text-3xl font-bold">{tapCount}</div>
            <div className="text-sm">taps detected</div>
            <div className="text-blue-400 text-sm">
              {(tapCount / Math.max(10 - timeRemaining, 1)).toFixed(1)} taps/sec
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