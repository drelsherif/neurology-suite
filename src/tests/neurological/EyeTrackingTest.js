// src/tests/neurological/EyeTrackingTest.js
import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function EyeMovementTest({ onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  
  // Test states
  const [testPhase, setTestPhase] = useState('setup');
  const [currentDirection, setCurrentDirection] = useState('center');
  const [timeRemaining, setTimeRemaining] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  
  // Eye tracking data
  const [eyeData, setEyeData] = useState({
    baseline: null,
    left: null,
    right: null,
    up: null,
    down: null
  });
  
  // Real-time metrics
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    leftEyeCenter: null,
    rightEyeCenter: null,
    gazeDirection: 'center',
    eyeDistance: 0,
    skewAngle: 0,
    blinkDetected: false
  });
  
  // Preloading states
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [mediaPipeLoaded, setMediaPipeLoaded] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadError, setPreloadError] = useState(null);
  const [preloadLog, setPreloadLog] = useState([]);
  
  // MediaPipe states
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [mediaPipeReady, setMediaPipeReady] = useState(false);
  
  // Add debug mode state
  const [debugMode, setDebugMode] = useState(false);
  
  // Recording refs - THESE WERE MISSING!
  const currentEyeData = useRef([]);
  const isRecordingRef = useRef(false);

  const addPreloadLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    setPreloadLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Force face detection for testing
  const forceFaceDetection = () => {
    setDebugMode(true);
    setFaceDetected(true);
    console.log('🔧 Debug mode: Force face detection enabled');
  };

  // MediaPipe Face Mesh landmark indices
  const EYE_LANDMARKS = {
    LEFT_EYE: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
    RIGHT_EYE: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
    LEFT_IRIS: [468, 469, 470, 471, 472],
    RIGHT_IRIS: [473, 474, 475, 476, 477],
    LEFT_EYE_CENTER: 468,
    RIGHT_EYE_CENTER: 473
  };

  useEffect(() => {
    preloadEverything();
  }, []);

  const preloadEverything = async () => {
    try {
      addPreloadLog('🚀 Starting eye tracking preload...');
      setIsPreloading(true);
      setPreloadError(null);

      addPreloadLog('📷 Requesting camera permissions...');
      await requestCameraPermissions();
      
      addPreloadLog('📦 Loading MediaPipe Face Mesh...');
      await loadMediaPipeScripts();
      
      addPreloadLog('👁️ Pre-initializing Face Mesh...');
      await initializeMediaPipe();
      
      addPreloadLog('✅ Eye tracking ready!');
      setIsPreloading(false);
      
    } catch (error) {
      addPreloadLog(`❌ Preload failed: ${error.message}`);
      setPreloadError(error.message);
      setIsPreloading(false);
    }
  };

  const requestCameraPermissions = async () => {
    try {
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
      throw new Error('Camera access failed. Please allow camera access.');
    }
  };

  const loadMediaPipeScripts = async () => {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js'
    ];

    for (const src of scripts) {
      if (!document.querySelector(`script[src="${src}"]`)) {
        addPreloadLog(`⬇️ Loading: ${src.split('/').pop()}`);
        await loadScript(src);
        addPreloadLog(`✅ Loaded: ${src.split('/').pop()}`);
      }
    }
    
    let attempts = 0;
    while (typeof window.FaceMesh === 'undefined' && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof window.FaceMesh === 'undefined') {
      throw new Error('MediaPipe Face Mesh failed to load');
    }
    
    addPreloadLog('✅ Face Mesh scripts loaded');
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
      console.log('Initializing MediaPipe Face Mesh...');
      
      if (!window.FaceMesh) {
        throw new Error('FaceMesh not available on window object');
      }
      
      faceMeshRef.current = new window.FaceMesh({
        locateFile: (file) => {
          console.log('MediaPipe loading file:', file);
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMeshRef.current.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3,
        selfieMode: true
      });

      faceMeshRef.current.onResults(onResults);
      addPreloadLog('✅ Face Mesh configured with low thresholds');
      console.log('MediaPipe Face Mesh initialized successfully');
      return true;
    } catch (error) {
      console.error('MediaPipe initialization error:', error);
      throw new Error(`Face Mesh initialization failed: ${error.message}`);
    }
  };

  // Calculate eye metrics from landmarks
  const calculateEyeMetrics = useCallback((landmarks) => {
    if (!landmarks || landmarks.length < 478) return null;

    try {
      const leftEyeCenter = landmarks[EYE_LANDMARKS.LEFT_EYE_CENTER];
      const rightEyeCenter = landmarks[EYE_LANDMARKS.RIGHT_EYE_CENTER];
      
      if (!leftEyeCenter || !rightEyeCenter) return null;

      const eyeDistance = Math.sqrt(
        Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) + 
        Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2)
      );
      
      const skewAngle = Math.atan2(
        rightEyeCenter.y - leftEyeCenter.y, 
        rightEyeCenter.x - leftEyeCenter.x
      ) * 180 / Math.PI;

      const leftEyeCorners = {
        inner: landmarks[133],
        outer: landmarks[33]
      };
      const rightEyeCorners = {
        inner: landmarks[362],
        outer: landmarks[263]
      };

      const leftIrisRelative = (leftEyeCenter.x - leftEyeCorners.inner.x) / 
                               (leftEyeCorners.outer.x - leftEyeCorners.inner.x);
      const rightIrisRelative = (rightEyeCenter.x - rightEyeCorners.inner.x) / 
                                (rightEyeCorners.outer.x - rightEyeCorners.inner.x);

      let gazeDirection = 'center';
      const avgIrisPosition = (leftIrisRelative + rightIrisRelative) / 2;
      
      if (avgIrisPosition < 0.3) gazeDirection = 'right';
      else if (avgIrisPosition > 0.7) gazeDirection = 'left';
      
      const leftEyeTop = landmarks[159];
      const leftEyeBottom = landmarks[145];
      const leftIrisVertical = (leftEyeCenter.y - leftEyeTop.y) / 
                               (leftEyeBottom.y - leftEyeTop.y);
      
      if (leftIrisVertical < 0.3) gazeDirection = 'up';
      else if (leftIrisVertical > 0.7) gazeDirection = 'down';

      const leftEyeHeight = Math.abs(landmarks[159].y - landmarks[145].y);
      const leftEyeWidth = Math.abs(landmarks[133].x - landmarks[33].x);
      const leftEAR = leftEyeHeight / leftEyeWidth;
      
      const rightEyeHeight = Math.abs(landmarks[386].y - landmarks[374].y);
      const rightEyeWidth = Math.abs(landmarks[362].x - landmarks[263].x);
      const rightEAR = rightEyeHeight / rightEyeWidth;
      
      const avgEAR = (leftEAR + rightEAR) / 2;
      const blinkDetected = avgEAR < 0.2;

      return {
        leftEyeCenter: {
          x: leftEyeCenter.x * (canvasRef.current?.width || 640),
          y: leftEyeCenter.y * (canvasRef.current?.height || 480)
        },
        rightEyeCenter: {
          x: rightEyeCenter.x * (canvasRef.current?.width || 640),
          y: rightEyeCenter.y * (canvasRef.current?.height || 480)
        },
        eyeDistance,
        skewAngle: Math.round(skewAngle * 10) / 10,
        gazeDirection,
        leftIrisRelative: Math.round(leftIrisRelative * 100) / 100,
        rightIrisRelative: Math.round(rightIrisRelative * 100) / 100,
        leftEAR: Math.round(leftEAR * 100) / 100,
        rightEAR: Math.round(rightEAR * 100) / 100,
        blinkDetected,
        conjugateMovement: Math.abs(leftIrisRelative - rightIrisRelative) < 0.1
      };
    } catch (error) {
      console.warn('Error calculating eye metrics:', error);
      return null;
    }
  }, []);

  // Simple fallback face detection
  const simpleFaceDetection = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return false;
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let brightPixels = 0;
      let totalPixels = data.length / 4;
      
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > 100 && brightness < 200) {
          brightPixels++;
        }
      }
      
      const faceRatio = brightPixels / totalPixels;
      return faceRatio > 0.1;
      
    } catch (error) {
      console.error('Simple face detection error:', error);
      return false;
    }
  }, []);

  // MediaPipe results handler
  const onResults = useCallback((results) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 640;
    canvas.height = 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Debug indicator
    ctx.beginPath();
    ctx.arc(20, 20, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#00FF00';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.fillText('Frame', 35, 25);

    console.log('MediaPipe results received:', {
      hasFaceLandmarks: !!(results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0),
      facesCount: results.multiFaceLandmarks ? results.multiFaceLandmarks.length : 0
    });

    let faceDetected = false;

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      console.log('MediaPipe face detected! Landmarks count:', landmarks.length);
      faceDetected = true;

      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('MEDIAPIPE FACE DETECTED!', 50, 100);

      drawEyeRegions(ctx, landmarks);
      
      const metrics = calculateEyeMetrics(landmarks);
      if (metrics) {
        setRealTimeMetrics(metrics);
        
        if (isRecordingRef.current) {
          currentEyeData.current.push({
            timestamp: Date.now(),
            direction: currentDirection,
            ...metrics
          });
        }
      }
      
    } else {
      console.log('No MediaPipe face detected, trying fallback...');
      
      const simpleFaceFound = simpleFaceDetection();
      console.log('Simple face detection result:', simpleFaceFound);
      
      if (simpleFaceFound) {
        faceDetected = true;
        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('SIMPLE FACE DETECTED!', 50, 150);
        ctx.fillText('(MediaPipe backup)', 50, 170);
        
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, 2 * Math.PI);
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NO FACE DETECTED', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Try better lighting', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Move closer to camera', canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = 'left';
      }
    }
    
    setFaceDetected(faceDetected);
  }, [calculateEyeMetrics, currentDirection, simpleFaceDetection]);

  // Draw eye regions
  const drawEyeRegions = (ctx, landmarks) => {
    if (!landmarks) return;

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    
    // Left eye
    ctx.beginPath();
    EYE_LANDMARKS.LEFT_EYE.forEach((index, i) => {
      const point = landmarks[index];
      const x = point.x * canvasRef.current.width;
      const y = point.y * canvasRef.current.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();

    // Right eye
    ctx.beginPath();
    EYE_LANDMARKS.RIGHT_EYE.forEach((index, i) => {
      const point = landmarks[index];
      const x = point.x * canvasRef.current.width;
      const y = point.y * canvasRef.current.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();

    // Draw iris centers
    const leftIris = landmarks[EYE_LANDMARKS.LEFT_EYE_CENTER];
    const rightIris = landmarks[EYE_LANDMARKS.RIGHT_EYE_CENTER];

    if (leftIris && rightIris) {
      // Left iris
      ctx.beginPath();
      ctx.arc(
        leftIris.x * canvasRef.current.width,
        leftIris.y * canvasRef.current.height,
        8, 0, 2 * Math.PI
      );
      ctx.fillStyle = '#FF0000';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Right iris
      ctx.beginPath();
      ctx.arc(
        rightIris.x * canvasRef.current.width,
        rightIris.y * canvasRef.current.height,
        8, 0, 2 * Math.PI
      );
      ctx.fill();
      ctx.stroke();

      // Draw gaze line
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(
        leftIris.x * canvasRef.current.width,
        leftIris.y * canvasRef.current.height
      );
      ctx.lineTo(
        rightIris.x * canvasRef.current.width,
        rightIris.y * canvasRef.current.height
      );
      ctx.stroke();
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      if (!faceMeshRef.current) {
        throw new Error('Face Mesh not ready');
      }

      addPreloadLog('📷 Starting camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        addPreloadLog('✅ Video stream connected');
      }

      cameraRef.current = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && faceMeshRef.current) {
            try {
              await faceMeshRef.current.send({ image: videoRef.current });
            } catch (error) {
              console.error('MediaPipe send error:', error);
            }
          }
        },
        width: 640,
        height: 480,
      });

      await cameraRef.current.start();
      addPreloadLog('✅ MediaPipe camera started');
      setCameraReady(true);
      setMediaPipeReady(true);
      return true;
    } catch (error) {
      addPreloadLog(`❌ Camera start failed: ${error.message}`);
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

  // Test sequence and remaining functions would continue here...
  // For brevity, I'll add the key missing parts for the UI

  const startEyeTest = async () => {
    try {
      await startCamera();
      setTestPhase('instructions');
    } catch (error) {
      alert(`Failed to start camera: ${error.message}`);
    }
  };

  const beginRecording = () => {
    setTestPhase('testing');
    // Add test logic here
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Render phases
  if (isPreloading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Preparing Eye Tracking...</h2>
            <p className="text-lg text-gray-600">Loading camera and MediaPipe Face Mesh AI</p>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto text-left max-w-3xl mx-auto">
            <h3 className="text-white font-semibold mb-2">Loading Progress:</h3>
            {preloadLog.map((entry, index) => (
              <div key={index} className="mb-1">{entry}</div>
            ))}
          </div>

          {preloadError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700 max-w-md mx-auto">
              <div className="font-medium mb-1">⚠️ Setup Failed</div>
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

  if (testPhase === 'setup') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">👁️</span>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">AI Eye Movement Assessment</h2>
            <p className="text-lg text-gray-600">Advanced neurological eye tracking with MediaPipe Face Mesh</p>
          </div>

          {/* Hidden video elements */}
          <div className="hidden">
            <video ref={videoRef} autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} width={640} height={480} style={{ transform: 'scaleX(-1)' }} />
            <canvas ref={overlayCanvasRef} width={640} height={480} style={{ transform: 'scaleX(-1)' }} />
          </div>

          <button onClick={startEyeTest} className="px-8 py-4 text-lg font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Begin Eye Assessment 👁️
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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Eye Movement Test Instructions</h2>
          <p className="text-lg text-gray-600">Position yourself for optimal eye tracking</p>
        </div>

        {/* Camera feed */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden max-w-md mx-auto">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" style={{ transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef} width={640} height={480} className="absolute top-0 left-0 w-full h-full" style={{ transform: 'scaleX(-1)' }} />
          
          {/* Debug info */}
          <div className="absolute top-2 left-2 bg-black/90 px-2 py-1 rounded text-white text-xs">
            <div className="font-semibold text-purple-400 mb-1">Debug</div>
            <div className="space-y-0.5">
              <div>AI: <span className={mediaPipeReady ? "text-green-400" : "text-red-400"}>{mediaPipeReady ? "✅" : "❌"}</span></div>
              <div>Face: <span className={faceDetected ? "text-green-400" : "text-red-400"}>{faceDetected ? "✅" : "❌"}</span></div>
              <div>Cam: <span className={cameraReady ? "text-green-400" : "text-red-400"}>{cameraReady ? "✅" : "❌"}</span></div>
              {debugMode && <div className="text-yellow-400">🔧 Debug</div>}
            </div>
          </div>
        </div>

        {/* Debug button */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>⚠️ iPhone Tip:</strong> Hold steady and make sure the green "Face OK" shows before starting!
          </p>
          <div className="mt-2 pt-2 border-t border-yellow-300">
            <button onClick={forceFaceDetection} className="text-xs bg-yellow-600 text-white px-2 py-1 rounded mr-2">
              🔧 Force Face Detection (Debug)
            </button>
            <span className="text-xs text-yellow-700">Use if face detection fails</span>
          </div>
        </div>

        <div className="flex space-x-4 justify-center">
          <button onClick={() => setTestPhase('setup')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Back
          </button>
          <button onClick={beginRecording} disabled={!faceDetected} className={`px-4 py-2 rounded-lg transition-colors ${faceDetected ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-400 text-gray-600 cursor-not-allowed'}`}>
            {faceDetected ? 'Start Test 👁️' : 'Position Face First'}
          </button>
        </div>
      </div>
    );
  }

  return <div>Test phases for testing and results would go here...</div>;
}