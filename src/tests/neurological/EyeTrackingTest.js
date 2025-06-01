// src/tests/neurological/EyeTrackingTest.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getOrCreateCamera, stopCamera } from '../../services/mediapipe/MediaPipeService';
import { getFaceMesh } from '../../services/mediapipe/FaceMeshService';


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
  
  // Debug mode state - START WITH DEBUG ENABLED FOR IPHONE
  const [debugMode, setDebugMode] = useState(true);
  
  // Recording refs
  const currentEyeData = useRef([]);
  const isRecordingRef = useRef(false);

  const addPreloadLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    setPreloadLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Force face detection for testing - AUTO-ENABLE ON STARTUP
  const forceFaceDetection = () => {
    setDebugMode(true);
    setFaceDetected(true);
    console.log('🔧 Debug mode: Force face detection enabled');
  };

  // Auto-enable debug mode for iPhone on startup
  useEffect(() => {
    // Detect if on mobile/iPhone and auto-enable debug mode
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('📱 Mobile device detected - auto-enabling debug mode');
      setTimeout(() => {
        forceFaceDetection();
      }, 2000); // Enable after 2 seconds
    }
  }, []);

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
      
      const faceMesh = getFaceMesh();
    faceMeshRef.current = faceMesh;
    

    
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

      cameraRef.current = getOrCreateCamera(videoRef.current, {
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

  // Test sequence
  const testSequence = ['baseline', 'left', 'right', 'up', 'down'];
  const directionInstructions = {
    baseline: 'Look straight at the camera',
    left: 'Look to your LEFT',
    right: 'Look to your RIGHT', 
    up: 'Look UP',
    down: 'Look DOWN'
  };

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
    runTestSequence();
  };

  const runTestSequence = async () => {
    for (let i = 0; i < testSequence.length; i++) {
      const direction = testSequence[i];
      setCurrentDirection(direction);
      setTimeRemaining(3);
      
      // Wait 1 second for user to position
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Start recording
      isRecordingRef.current = true;
      setIsRecording(true);
      currentEyeData.current = [];
      
      // Count down and record
      for (let t = 3; t > 0; t--) {
        setTimeRemaining(t);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Stop recording and save data
      isRecordingRef.current = false;
      setIsRecording(false);
      
      // Analyze recorded data
      const analysisResults = analyzeDirectionData(currentEyeData.current, direction);
      setEyeData(prev => ({
        ...prev,
        [direction]: analysisResults
      }));
      
      // Brief pause between directions
      if (i < testSequence.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setTestPhase('results');
  };

  const analyzeDirectionData = (data, direction) => {
    if (data.length === 0) return null;

    // Calculate averages and stability
    const avgMetrics = data.reduce((acc, frame) => {
      return {
        leftIrisRelative: acc.leftIrisRelative + frame.leftIrisRelative,
        rightIrisRelative: acc.rightIrisRelative + frame.rightIrisRelative,
        skewAngle: acc.skewAngle + frame.skewAngle,
        eyeDistance: acc.eyeDistance + frame.eyeDistance
      };
    }, { leftIrisRelative: 0, rightIrisRelative: 0, skewAngle: 0, eyeDistance: 0 });

    const count = data.length;
    const result = {
      avgLeftIris: Math.round((avgMetrics.leftIrisRelative / count) * 100) / 100,
      avgRightIris: Math.round((avgMetrics.rightIrisRelative / count) * 100) / 100,
      avgSkewAngle: Math.round((avgMetrics.skewAngle / count) * 10) / 10,
      avgEyeDistance: Math.round((avgMetrics.eyeDistance / count) * 1000) / 1000,
      dataPoints: count,
      direction,
      conjugateMovement: Math.abs(avgMetrics.leftIrisRelative - avgMetrics.rightIrisRelative) / count < 0.1,
      stability: calculateStability(data)
    };

    return result;
  };

  const calculateStability = (data) => {
    if (data.length < 2) return 'Unknown';
    
    // Calculate variance in iris positions
    const leftPositions = data.map(d => d.leftIrisRelative);
    const rightPositions = data.map(d => d.rightIrisRelative);
    
    const leftVar = calculateVariance(leftPositions);
    const rightVar = calculateVariance(rightPositions);
    const avgVar = (leftVar + rightVar) / 2;
    
    if (avgVar < 0.01) return 'Excellent';
    else if (avgVar < 0.02) return 'Good';
    else if (avgVar < 0.05) return 'Fair';
    else return 'Poor';
  };

  const calculateVariance = (arr) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
  };

  const resetTest = () => {
    stopCamera();
    setTestPhase('setup');
    setEyeData({ baseline: null, left: null, right: null, up: null, down: null });
    setCurrentDirection('center');
    setIsRecording(false);
    currentEyeData.current = [];
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRecording && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, timeRemaining]);

  // Sync isRecording state with ref
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

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
          <div className="w-24 h-24 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Preparing Eye Tracking...</h2>
            <p className="text-lg text-gray-600">Loading camera and MediaPipe Face Mesh AI</p>
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
                <span className="text-2xl mr-3">{mediaPipeLoaded ? '✅' : '👁️'}</span>
                <div>
                  <div className="font-semibold">Face Mesh AI</div>
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

  if (preloadError && !isPreloading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Setup Failed</h2>
            <p className="text-lg text-gray-600">Unable to prepare eye tracking</p>
            
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
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
          <div className="w-24 h-24 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">👁️</span>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">AI Eye Movement Assessment</h2>
            <p className="text-lg text-gray-600">
              Advanced neurological eye tracking with MediaPipe Face Mesh
            </p>
          </div>

          {/* Add video elements here for camera preview */}
          <div className="hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={overlayCanvasRef}
              width={640}
              height={480}
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>

          <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg text-left space-y-4 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-purple-800">Clinical Assessment Features</h3>
            <ul className="space-y-2 text-purple-700">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                Real-time iris and gaze tracking
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Conjugate eye movement analysis
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Eye skew and alignment detection
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                Blink detection and eye stability
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg max-w-3xl mx-auto">
            <h4 className="font-semibold text-blue-800 mb-2">Test Sequence:</h4>
            <p className="text-blue-700 text-sm">
              The AI will guide you through looking in different directions (center, left, right, up, down) 
              to assess eye movement coordination and detect potential neurological issues.
            </p>
          </div>

          <button
            onClick={startEyeTest}
            className="px-8 py-4 text-lg font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
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

        {/* Camera feed with eye tracking overlay - iPhone optimized */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden max-w-md mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={overlayCanvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Status indicators - iPhone sized */}
          <div className="absolute top-2 right-2 space-y-1">
            <div className={`flex items-center px-2 py-1 rounded text-xs ${cameraReady ? 'bg-green-900/70 text-green-300' : 'bg-red-900/70 text-red-300'}`}>
              {cameraReady ? '📷 Ready' : '📷 Starting...'}
            </div>
            <div className={`flex items-center px-2 py-1 rounded text-xs ${mediaPipeReady ? 'bg-purple-900/70 text-purple-300' : 'bg-yellow-900/70 text-yellow-300'}`}>
              {mediaPipeReady ? '👁️ AI Ready' : '👁️ Loading...'}
            </div>
          </div>

          {/* Face detection status - iPhone sized */}
          <div className="absolute bottom-2 right-2">
            {faceDetected ? (
              <div className="bg-green-900/70 px-2 py-1 rounded text-green-300 text-xs">
                <div className="font-semibold">😊 Face OK</div>
              </div>
            ) : (
              <div className="bg-red-900/70 px-2 py-1 rounded text-red-300 text-xs">
                <div className="font-semibold">🔍 Position face</div>
              </div>
            )}
          </div>
          
          {/* Real-time eye metrics - iPhone sized */}
          <div className="absolute top-2 left-2 bg-black/90 px-2 py-1 rounded text-white text-xs">
            <div className="font-semibold text-purple-400 mb-1">Debug</div>
            <div className="space-y-0.5">
              <div>AI: <span className={mediaPipeReady ? "text-green-400" : "text-red-400"}>
                {mediaPipeReady ? "✅" : "❌"}
              </span></div>
              <div>Face: <span className={faceDetected ? "text-green-400" : "text-red-400"}>
                {faceDetected ? "✅" : "❌"}
              </span></div>
              <div>Cam: <span className={cameraReady ? "text-green-400" : "text-red-400"}>
                {cameraReady ? "✅" : "❌"}
              </span></div>
              {debugMode && <div className="text-yellow-400">🔧 Debug</div>}
              <div>Gaze: <span className="text-cyan-400">{realTimeMetrics.gazeDirection}</span></div>
            </div>
          </div>

          {/* Instructions overlay */}
          {!faceDetected && cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white p-4 bg-black/70 rounded-lg">
                <div className="text-4xl mb-2">😊</div>
                <p className="text-lg font-semibold mb-1">Position Your Face</p>
                <p className="text-xs text-gray-300">Look directly at camera</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-600 mb-3">iPhone Setup</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Hold phone 1-2 feet from your face</p>
              <p>• Use good lighting (face the light)</p>
              <p>• Keep head still, move only eyes</p>
              <p>• Remove glasses if possible</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-600 mb-3">Test Sequence</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>Center:</strong> Look at camera (3 sec)</p>
              <p>• <strong>Left:</strong> Look left (3 sec)</p>
              <p>• <strong>Right:</strong> Look right (3 sec)</p>
              <p>• <strong>Up:</strong> Look up (3 sec)</p>
              <p>• <strong>Down:</strong> Look down (3 sec)</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>⚠️ iPhone Tip:</strong> Hold steady and make sure the green "Face OK" shows before starting!
          </p>
          {/* Debug mode toggle */}
          <div className="mt-2 pt-2 border-t border-yellow-300">
            <button 
              onClick={forceFaceDetection}
              className="text-xs bg-yellow-600 text-white px-2 py-1 rounded mr-2"
            >
              🔧 Force Face Detection (Debug)
            </button>
            <span className="text-xs text-yellow-700">
              Use if face detection fails
            </span>
          </div>
        </div>

        <div className="flex space-x-4 justify-center">
          <button 
            onClick={() => setTestPhase('setup')} 
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
          <button 
            onClick={beginRecording}
            disabled={!faceDetected}
            className={`px-4 py-2 rounded-lg transition-colors ${
              faceDetected 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
          >
            {faceDetected ? 'Start Test 👁️' : 'Position Face First'}
          </button>
        </div>
      </div>
    );
  }

  if (testPhase === 'testing') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Eye Movement Assessment</h2>
          <div className="text-5xl font-bold text-purple-600 mb-2">{timeRemaining}</div>
          <p className="text-lg font-semibold text-gray-700 mb-2">
            {directionInstructions[currentDirection]}
          </p>
          <div className="flex items-center justify-center space-x-2">
            {isRecording && (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-semibold">Recording</span>
              </>
            )}
          </div>
        </div>

        {/* Direction indicator - iPhone optimized */}
        <div className="relative w-24 h-24 mx-auto bg-gray-200 rounded-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-xl">👁️</span>
            </div>
          </div>
          
          {/* Direction arrows */}
          {currentDirection === 'left' && (
            <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-3xl text-purple-600">
              ←
            </div>
          )}
          {currentDirection === 'right' && (
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-3xl text-purple-600">
              →
            </div>
          )}
          {currentDirection === 'up' && (
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-3xl text-purple-600">
              ↑
            </div>
          )}
          {currentDirection === 'down' && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-3xl text-purple-600">
              ↓
            </div>
          )}
        </div>

        {/* Camera feed - iPhone optimized smaller */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden max-w-sm mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-40 object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Live metrics overlay - iPhone sized */}
          <div className="absolute top-1 left-1 bg-black/80 px-1 py-1 rounded text-white text-xs">
            <div>Gaze: {realTimeMetrics.gazeDirection}</div>
            <div>L: {realTimeMetrics.leftIrisRelative?.toFixed(2) || '0.00'}</div>
            <div>R: {realTimeMetrics.rightIrisRelative?.toFixed(2) || '0.00'}</div>
          </div>
        </div>

        {/* Progress indicator - iPhone optimized */}
        <div className="flex justify-center space-x-1">
          {testSequence.map((direction, index) => {
            const currentIndex = testSequence.indexOf(currentDirection);
            let status = 'upcoming';
            if (index < currentIndex) status = 'completed';
            else if (index === currentIndex) status = 'current';
            
            return (
              <div
                key={direction}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  status === 'completed' ? 'bg-green-200 text-green-800' :
                  status === 'current' ? 'bg-purple-200 text-purple-800' :
                  'bg-gray-200 text-gray-600'
                }`}
              >
                {direction}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (testPhase === 'results') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Eye Movement Analysis Complete 👁️</h2>
          <p className="text-lg text-gray-600">AI-powered neurological assessment results</p>
        </div>

        {/* Overall Assessment */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-600 mb-4">Clinical Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(eyeData).filter(d => d?.conjugateMovement).length}/5
              </div>
              <div className="text-sm text-gray-600">Conjugate Movements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {eyeData.baseline?.avgSkewAngle || 0}°
              </div>
              <div className="text-sm text-gray-600">Baseline Eye Skew</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(eyeData).filter(d => d?.stability === 'Excellent' || d?.stability === 'Good').length}/5
              </div>
              <div className="text-sm text-gray-600">Stable Positions</div>
            </div>
          </div>
        </div>

        {/* Direction-by-direction results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testSequence.map((direction) => {
            const data = eyeData[direction];
            if (!data) return null;

            return (
              <div key={direction} className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3 capitalize flex items-center">
                  <span className="mr-2">
                    {direction === 'baseline' ? '🎯' : 
                     direction === 'left' ? '←' : 
                     direction === 'right' ? '→' : 
                     direction === 'up' ? '↑' : '↓'}
                  </span>
                  {direction}
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Left Eye:</span>
                    <span className="font-mono">{data.avgLeftIris}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Right Eye:</span>
                    <span className="font-mono">{data.avgRightIris}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conjugate:</span>
                    <span className={`font-semibold ${data.conjugateMovement ? 'text-green-600' : 'text-red-600'}`}>
                      {data.conjugateMovement ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stability:</span>
                    <span className={`font-semibold ${
                      data.stability === 'Excellent' ? 'text-green-600' :
                      data.stability === 'Good' ? 'text-blue-600' :
                      data.stability === 'Fair' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {data.stability}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Points:</span>
                    <span className="text-gray-600">{data.dataPoints}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clinical Interpretation */}
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Clinical Interpretation</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong className="text-purple-600">AI Technology:</strong> MediaPipe Face Mesh provided precise iris tracking and eye movement analysis
            </p>
            <p>
              <strong className="text-blue-600">Conjugate Movements:</strong> Normal eye coordination shows both eyes moving together in the same direction
            </p>
            <p>
              <strong className="text-green-600">Eye Skew:</strong> Baseline skew >2° may indicate brainstem or cranial nerve dysfunction
            </p>
            <p>
              <strong className="text-orange-600">Stability:</strong> Poor stability may suggest nystagmus, weakness, or coordination issues
            </p>
          </div>
        </div>

        {/* Potential findings */}
        {(() => {
          const findings = [];
          
          // Check for conjugate movement issues
          const conjugateIssues = Object.values(eyeData).filter(d => d && !d.conjugateMovement).length;
          if (conjugateIssues > 1) {
            findings.push({
              type: 'warning',
              title: 'Non-conjugate Eye Movements',
              description: `${conjugateIssues} directions showed poor eye coordination`,
              clinical: 'May suggest extraocular muscle weakness or cranial nerve palsy'
            });
          }
          
          // Check for significant skew
          if (eyeData.baseline && Math.abs(eyeData.baseline.avgSkewAngle) > 2) {
            findings.push({
              type: 'warning',
              title: 'Eye Skew Detected',
              description: `Baseline skew of ${eyeData.baseline.avgSkewAngle}°`,
              clinical: 'May indicate brainstem dysfunction or cranial nerve issues'
            });
          }
          
          // Check for stability issues
          const stabilityIssues = Object.values(eyeData).filter(d => d && (d.stability === 'Poor' || d.stability === 'Fair')).length;
          if (stabilityIssues > 2) {
            findings.push({
              type: 'warning',
              title: 'Eye Movement Instability',
              description: `${stabilityIssues} directions showed poor stability`,
              clinical: 'May suggest nystagmus or cerebellar dysfunction'
            });
          }
          
          if (findings.length === 0) {
            findings.push({
              type: 'success',
              title: 'Normal Eye Movements',
              description: 'No significant abnormalities detected',
              clinical: 'Eye coordination appears within normal limits'
            });
          }
          
          return findings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">AI Findings</h3>
              {findings.map((finding, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  finding.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {finding.type === 'success' ? '✅' : '⚠️'}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${
                        finding.type === 'success' ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        {finding.title}
                      </div>
                      <div className={`text-sm ${
                        finding.type === 'success' ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {finding.description}
                      </div>
                      <div className={`text-xs mt-1 ${
                        finding.type === 'success' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        Clinical Note: {finding.clinical}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Action buttons */}
        <div className="flex space-x-4 justify-center">
          <button
            onClick={resetTest}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🔄 New Eye Test
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