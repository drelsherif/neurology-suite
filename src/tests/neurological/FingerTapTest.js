import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Square, RotateCcw, Hand, Timer, Target, TrendingUp, Camera, CameraOff, Settings, AlertCircle } from 'lucide-react';

// HandTracker class with improved error handling and MediaPipe loading
class HandTracker {
  constructor() {
    this.hands = null;
    this.camera = null;
    this.isInitialized = false;
    this.onResultsCallback = null;
    this.lastFingerTipY = null;
    this.tapThreshold = 25;
    this.lastTapTime = 0;
    this.minTapInterval = 150;
    this.onTapDetected = null;
    this.isTracking = false;
    this.videoElement = null;
    this.canvasElement = null;
  }

  async loadMediaPipeScripts() {
    console.log('📦 Loading MediaPipe scripts...');
    
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js', 
      'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
    ];

    for (const src of scripts) {
      if (!document.querySelector(`script[src="${src}"]`)) {
        await this.loadScript(src);
        console.log(`✅ Loaded: ${src.split('/').pop()}`);
      }
    }
    
    // Wait for MediaPipe to be available
    let attempts = 0;
    while (typeof window.Hands === 'undefined' && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof window.Hands === 'undefined') {
      throw new Error('MediaPipe failed to load after timeout');
    }
    
    console.log('✅ All MediaPipe scripts loaded successfully');
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        console.log(`✅ Script loaded: ${src}`);
        resolve();
      };
      script.onerror = (error) => {
        console.error(`❌ Failed to load script: ${src}`, error);
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });
  }

  async requestCameraPermission() {
    console.log('📷 Requesting camera permission...');
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' // Front-facing camera
        } 
      });
      
      console.log('✅ Camera permission granted');
      
      // Stop the test stream - we'll create a new one in initialize
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('❌ Camera permission failed:', error);
      
      let errorMessage = 'Camera access failed: ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please ensure you have a camera connected.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported in this browser.';
      } else {
        errorMessage += error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async initialize(videoElement, canvasElement, onResults) {
    try {
      console.log('🔄 Initializing Hand Tracker...');
      
      this.videoElement = videoElement;
      this.canvasElement = canvasElement;
      this.onResultsCallback = onResults;

      // Step 1: Request camera permission first
      await this.requestCameraPermission();

      // Step 2: Load MediaPipe scripts
      await this.loadMediaPipeScripts();

      // Step 3: Initialize MediaPipe Hands
      console.log('🤖 Initializing MediaPipe Hands...');
      this.hands = new window.Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      // Configure hand detection
      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      // Set up results callback
      this.hands.onResults((results) => this.onResults(results));

      // Step 4: Initialize camera with MediaPipe
      console.log('📷 Starting camera...');
      this.camera = new window.Camera(videoElement, {
        onFrame: async () => {
          if (this.hands && this.isTracking) {
            try {
              await this.hands.send({ image: videoElement });
            } catch (error) {
              console.warn('Frame processing error:', error);
            }
          }
        },
        width: 640,
        height: 480
      });

      this.isInitialized = true;
      console.log('✅ Hand Tracker fully initialized');
      return true;

    } catch (error) {
      console.error('❌ Hand Tracker initialization failed:', error);
      throw error;
    }
  }

  async start() {
    if (!this.isInitialized) {
      throw new Error('HandTracker not initialized');
    }
    
    try {
      console.log('▶️ Starting hand tracking...');
      this.isTracking = true;
      await this.camera.start();
      console.log('✅ Hand tracking started');
    } catch (error) {
      console.error('❌ Failed to start camera:', error);
      throw new Error(`Failed to start camera: ${error.message}`);
    }
  }

  stop() {
    console.log('⏹️ Stopping hand tracking...');
    this.isTracking = false;
    
    if (this.camera) {
      this.camera.stop();
    }
    
    // Clear canvas
    if (this.canvasElement) {
      const ctx = this.canvasElement.getContext('2d');
      ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
    
    console.log('✅ Hand tracking stopped');
  }

  onResults(results) {
    if (!this.canvasElement) return;
    
    const canvasCtx = this.canvasElement.getContext('2d');
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    // Set canvas size
    this.canvasElement.width = 640;
    this.canvasElement.height = 480;
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Draw hand skeleton if MediaPipe drawing functions are available
      if (window.drawConnectors && window.HAND_CONNECTIONS) {
        window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        });
      }
      
      if (window.drawLandmarks) {
        window.drawLandmarks(canvasCtx, landmarks, {
          color: '#FF0000',
          lineWidth: 1,
          radius: 3
        });
      }

      // Highlight index finger tip
      const indexTip = landmarks[8];
      if (indexTip) {
        const x = indexTip.x * this.canvasElement.width;
        const y = indexTip.y * this.canvasElement.height;
        
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 12, 0, 2 * Math.PI);
        canvasCtx.fillStyle = '#00FFFF';
        canvasCtx.fill();
        canvasCtx.strokeStyle = '#FFFFFF';
        canvasCtx.lineWidth = 3;
        canvasCtx.stroke();
        
        canvasCtx.fillStyle = '#FFFFFF';
        canvasCtx.font = 'bold 12px Arial';
        canvasCtx.fillText('TAP HERE', x - 30, y - 20);
      }

      this.detectTap(landmarks);
      
    } else {
      // No hand detected
      canvasCtx.fillStyle = '#FFFF00';
      canvasCtx.font = 'bold 16px Arial';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText('Show your hand in the camera', this.canvasElement.width / 2, this.canvasElement.height / 2);
      canvasCtx.textAlign = 'left';
    }
    
    canvasCtx.restore();

    // Call external callback
    if (this.onResultsCallback) {
      this.onResultsCallback(results);
    }
  }

  detectTap(landmarks) {
    const indexTip = landmarks[8];
    const indexDip = landmarks[7];
    const indexPip = landmarks[6];
    
    if (!indexTip || !indexDip || !indexPip) return;

    const tipY = indexTip.y * this.canvasElement.height;
    const dipY = indexDip.y * this.canvasElement.height;
    const pipY = indexPip.y * this.canvasElement.height;
    
    const fingerCurvature = (dipY + pipY) / 2 - tipY;
    
    if (this.lastFingerTipY !== null) {
      const movement = tipY - this.lastFingerTipY;
      const currentTime = Date.now();
      
      if (movement > this.tapThreshold && 
          fingerCurvature < 40 && 
          currentTime - this.lastTapTime > this.minTapInterval) {
        
        this.lastTapTime = currentTime;
        
        if (this.onTapDetected) {
          this.onTapDetected({
            position: { x: indexTip.x, y: indexTip.y },
            timestamp: currentTime,
            force: Math.min(movement / this.tapThreshold, 3),
            fingerCurvature: fingerCurvature
          });
        }
        
        // Visual feedback
        this.flashFingerTip(indexTip);
      }
    }
    
    this.lastFingerTipY = tipY;
  }

  flashFingerTip(indexTip) {
    if (!this.canvasElement) return;
    
    const canvasCtx = this.canvasElement.getContext('2d');
    const x = indexTip.x * this.canvasElement.width;
    const y = indexTip.y * this.canvasElement.height;
    
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 20, 0, 2 * Math.PI);
    canvasCtx.fillStyle = 'rgba(255, 255, 0, 0.6)';
    canvasCtx.fill();
    canvasCtx.restore();
  }

  setTapCallback(callback) {
    this.onTapDetected = callback;
  }

  getCurrentHandData(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return null;
    }

    const landmarks = results.multiHandLandmarks[0];
    const handedness = results.multiHandedness?.[0]?.label || 'Unknown';
    
    return {
      landmarks,
      handedness,
      confidence: results.multiHandedness?.[0]?.score || 0,
      indexTip: landmarks[8],
      isVisible: true
    };
  }

  adjustSensitivity(sensitivity) {
    switch (sensitivity) {
      case 'low':
        this.tapThreshold = 35;
        this.minTapInterval = 200;
        break;
      case 'high':
        this.tapThreshold = 15;
        this.minTapInterval = 100;
        break;
      default:
        this.tapThreshold = 25;
        this.minTapInterval = 150;
    }
  }
}

// Card component
const Card = ({ title, children, className = '' }) => (
  <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
    {title && <h3 className="text-lg font-semibold text-blue-300 mb-4">{title}</h3>}
    {children}
  </div>
);

// Button component
const Button = ({ children, onClick, variant = 'primary', size = 'medium', className = '', disabled = false }) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';
  
  const variants = {
    primary: disabled 
      ? 'bg-gray-500 text-gray-300' 
      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md focus:ring-blue-500',
    secondary: disabled
      ? 'bg-gray-500 text-gray-300'
      : 'bg-slate-600 hover:bg-slate-700 text-white focus:ring-slate-500'
  };
  
  const sizes = {
    medium: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const FingerTapTest = ({ onPageChange = () => {} }) => {
  // Test states
  const [testPhase, setTestPhase] = useState('setup');
  const [isRecording, setIsRecording] = useState(false);
  const [currentHand, setCurrentHand] = useState('right');
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimes, setTapTimes] = useState([]);
  
  // MediaPipe and camera refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handTrackerRef = useRef(null);
  
  // Test data
  const [testResults, setTestResults] = useState({
    rightHand: null,
    leftHand: null
  });
  
  // MediaPipe state
  const [cameraReady, setCameraReady] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [currentHandedness, setCurrentHandedness] = useState('Unknown');
  const [mediaPipeReady, setMediaPipeReady] = useState(false);
  const [initializationError, setInitializationError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Real-time metrics
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    currentSpeed: 0,
    lastTapTime: 0,
    handStability: 'Unknown'
  });

  // Settings
  const [sensitivity, setSensitivity] = useState('normal');

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRecording && timeRemaining > 0) {
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
  }, [isRecording, timeRemaining]);

  // Initialize MediaPipe and camera
  const setupCamera = async () => {
    try {
      console.log('🚀 Starting camera setup...');
      setIsInitializing(true);
      setInitializationError(null);
      
      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Video or canvas element not ready');
      }

      // Create new HandTracker instance
      handTrackerRef.current = new HandTracker();
      
      // Set sensitivity
      handTrackerRef.current.adjustSensitivity(sensitivity);
      
      // Set up tap detection callback
      handTrackerRef.current.setTapCallback((tapData) => {
        if (isRecording) {
          const now = Date.now();
          console.log('👆 Tap detected!', tapData);
          
          setTapCount(prev => prev + 1);
          setTapTimes(prev => [...prev, now]);
          
          // Update real-time metrics
          setRealTimeMetrics(prev => ({
            ...prev,
            currentSpeed: Math.round(((tapCount + 1) / Math.max((10 - timeRemaining), 1)) * 10) / 10,
            lastTapTime: now
          }));
        }
      });

      // Initialize MediaPipe with progress tracking
      console.log('📊 Initializing MediaPipe...');
      const success = await handTrackerRef.current.initialize(
        videoRef.current,
        canvasRef.current,
        (results) => {
          // Handle MediaPipe results
          const handData = handTrackerRef.current.getCurrentHandData(results);
          
          if (handData) {
            setHandDetected(true);
            setCurrentHandedness(handData.handedness);
            setRealTimeMetrics(prev => ({
              ...prev,
              handStability: 'Good'
            }));
          } else {
            setHandDetected(false);
            setCurrentHandedness('Unknown');
          }
        }
      );

      if (success) {
        console.log('🎥 Starting camera...');
        await handTrackerRef.current.start();
        setCameraReady(true);
        setMediaPipeReady(true);
        console.log('✅ Setup complete!');
        setIsInitializing(false);
        return true;
      }
      
      throw new Error('MediaPipe initialization returned false');
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      setInitializationError(error.message);
      setIsInitializing(false);
      setCameraReady(false);
      setMediaPipeReady(false);
      return false;
    }
  };

  const startTest = async () => {
    console.log('🏁 Starting test...');
    const setupSuccess = await setupCamera();
    if (!setupSuccess) {
      console.error('❌ Cannot start test - setup failed');
      return;
    }
    
    setTestPhase('testing');
    setIsRecording(true);
    setTapCount(0);
    setTapTimes([]);
    setTimeRemaining(10);
    console.log('⏰ Test started - start tapping!');
  };

  const stopTest = () => {
    console.log('⏹️ Stopping test...');
    setIsRecording(false);
    
    // Stop hand tracking
    if (handTrackerRef.current) {
      handTrackerRef.current.stop();
    }
    
    // Calculate results
    const results = calculateResults();
    
    // Store results for current hand
    setTestResults(prev => ({
      ...prev,
      [currentHand + 'Hand']: results
    }));
    
    console.log('📊 Test results:', results);
    
    // Check if we need to test the other hand
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
    setInitializationError(null);
  };

  const resetTest = () => {
    console.log('🔄 Resetting test...');
    
    // Stop tracking
    if (handTrackerRef.current) {
      handTrackerRef.current.stop();
      handTrackerRef.current = null;
    }
    
    // Reset all state
    setTestPhase('setup');
    setCurrentHand('right');
    setTestResults({ rightHand: null, leftHand: null });
    setCameraReady(false);
    setHandDetected(false);
    setMediaPipeReady(false);
    setTimeRemaining(10);
    setTapCount(0);
    setTapTimes([]);
    setIsRecording(false);
    setCurrentHandedness('Unknown');
    setInitializationError(null);
    setIsInitializing(false);
    setRealTimeMetrics({
      currentSpeed: 0,
      lastTapTime: 0,
      handStability: 'Unknown'
    });
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (handTrackerRef.current) {
        handTrackerRef.current.stop();
      }
    };
  }, []);

  const renderSetup = () => (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-blue-900/30 rounded-full flex items-center justify-center">
        <Hand size={48} className="text-blue-400" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">AI-Powered Finger Tap Test</h2>
        <p className="text-slate-300 text-lg">
          Real-time finger tracking with MediaPipe AI technology
        </p>
      </div>

      <div className="bg-slate-800 p-6 rounded-lg text-left space-y-4">
        <h3 className="text-lg font-semibold text-blue-300">Test Features</h3>
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-center">
            <Timer size={16} className="text-blue-400 mr-2" />
            Real-time finger tracking with MediaPipe
          </li>
          <li className="flex items-center">
            <Target size={16} className="text-green-400 mr-2" />
            Automatic tap detection and counting
          </li>
          <li className="flex items-center">
            <TrendingUp size={16} className="text-purple-400 mr-2" />
            Advanced rhythm and consistency analysis
          </li>
        </ul>
      </div>

      {/* Sensitivity Settings */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Settings size={16} className="text-slate-400 mr-2" />
            <span className="text-slate-300 text-sm font-semibold">Sensitivity</span>
          </div>
          <select 
            value={sensitivity} 
            onChange={(e) => setSensitivity(e.target.value)}
            className="bg-slate-700 text-slate-300 text-sm px-2 py-1 rounded border border-slate-600"
          >
            <option value="low">Low (Less sensitive)</option>
            <option value="normal">Normal (Recommended)</option>
            <option value="high">High (More sensitive)</option>
          </select>
        </div>
        <p className="text-xs text-slate-400">
          Adjust if taps aren't being detected properly
        </p>
      </div>

      <Button onClick={() => setTestPhase('instructions')} size="lg" className="w-full">
        Begin AI Test Setup
      </Button>
    </div>
  );

  const renderInstructions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {currentHand === 'right' ? 'Right' : 'Left'} Hand Instructions
        </h2>
        <p className="text-slate-300">AI will automatically detect your finger taps</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Hand Position" className="h-full">
          <div className="space-y-3 text-sm">
            <p>• Position your {currentHand} hand clearly in the camera view</p>
            <p>• Keep your index finger visible at all times</p>
            <p>• Maintain good lighting for optimal tracking</p>
            <p>• Keep your hand steady but relaxed</p>
          </div>
        </Card>

        <Card title="Tapping Technique" className="h-full">
          <div className="space-y-3 text-sm">
            <p>• Tap with your index finger in a natural up-down motion</p>
            <p>• Make clear, deliberate tapping movements</p>
            <p>• The AI will automatically count each tap</p>
            <p>• No need to click anything - just tap naturally!</p>
          </div>
        </Card>
      </div>

      <div className="bg-blue-900/20 border border-blue-600 p-4 rounded-lg">
        <p className="text-blue-300 text-sm">
          <strong>✨ AI Magic:</strong> MediaPipe will track your hand skeleton in real-time and automatically detect finger taps. 
          You'll see a green hand outline and cyan dot on your index finger tip.
        </p>
      </div>

      <div className="flex space-x-4">
        <Button onClick={() => setTestPhase('setup')} variant="secondary" className="flex-1">
          Back
        </Button>
        <Button onClick={startTest} className="flex-1" disabled={isInitializing}>
          {isInitializing ? 'Setting up AI...' : 'Start AI Tracking Test'}
        </Button>
      </div>

      {initializationError && (
        <div className="bg-red-900/20 border border-red-600 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-red-300 font-medium text-sm mb-1">Setup Failed</div>
              <div className="text-red-200 text-sm">{initializationError}</div>
              <button 
                onClick={() => setInitializationError(null)} 
                className="text-red-400 text-sm underline mt-2"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTesting = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          AI Tracking: {currentHand === 'right' ? 'Right' : 'Left'} Hand
        </h2>
        <div className="text-4xl font-mono font-bold text-blue-400">
          {timeRemaining}s
        </div>
        <p className="text-slate-300 text-sm mt-2">
          Tap naturally - AI will detect automatically
        </p>
      </div>

      {/* Camera Feed with MediaPipe Overlay */}
      <div className="relative bg-slate-800 rounded-lg overflow-hidden">
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
        
        {/* Status indicators */}
        <div className="absolute top-4 right-4 space-y-2">
          {/* Camera status */}
          <div className="flex items-center">
            {cameraReady ? (
              <div className="flex items-center bg-green-900/70 px-2 py-1 rounded">
                <Camera size={14} className="text-green-400 mr-1" />
                <span className="text-green-300 text-xs">Camera</span>
              </div>
            ) : (
              <div className="flex items-center bg-red-900/70 px-2 py-1 rounded">
                <CameraOff size={14} className="text-red-400 mr-1" />
                <span className="text-red-300 text-xs">Loading...</span>
              </div>
            )}
          </div>
          
          {/* MediaPipe status */}
          <div className="flex items-center">
            {mediaPipeReady ? (
              <div className="flex items-center bg-blue-900/70 px-2 py-1 rounded">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                <span className="text-blue-300 text-xs">AI Ready</span>
              </div>
            ) : (
              <div className="flex items-center bg-yellow-900/70 px-2 py-1 rounded">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                <span className="text-yellow-300 text-xs">AI Loading</span>
              </div>
            )}
          </div>
        </div>

        {/* Hand detection status */}
        <div className="absolute bottom-4 right-4">
          {handDetected ? (
            <div className="bg-green-900/70 px-3 py-2 rounded">
              <div className="text-green-300 text-sm font-semibold">
                ✋ {currentHandedness} Hand Tracked
              </div>
              <div className="text-green-200 text-xs">
                Stability: {realTimeMetrics.handStability}
              </div>
            </div>
          ) : (
            <div className="bg-red-900/70 px-3 py-2 rounded">
              <div className="text-red-300 text-sm">
                🔍 Show your {currentHand} hand
              </div>
              <div className="text-red-200 text-xs">
                Position hand in camera view
              </div>
            </div>
          )}
        </div>
        
        {/* Performance overlay */}
        <div className="absolute top-4 left-4 bg-black/80 px-4 py-3 rounded">
          <div className="text-white font-bold text-xl">{tapCount}</div>
          <div className="text-slate-300 text-sm">taps detected</div>
          <div className="text-blue-400 text-sm font-mono">
            {realTimeMetrics.currentSpeed.toFixed(1)} taps/sec
          </div>
          {timeRemaining <= 3 && timeRemaining > 0 && (
            <div className="text-red-400 text-xs font-bold animate-pulse mt-1">
              🔥 Final {timeRemaining}s!
            </div>
          )}
        </div>

        {/* Instructions overlay */}
        {!handDetected && mediaPipeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white p-6 bg-black/70 rounded-lg">
              <Hand size={48} className="mx-auto mb-4 text-blue-400" />
              <p className="text-lg font-semibold mb-2">Position Your {currentHand} Hand</p>
              <p className="text-sm text-slate-300">Make sure your hand is clearly visible in the camera</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        <Button onClick={stopTest} variant="secondary" className="flex-1">
          <Square size={16} className="mr-2" />
          Stop Test
        </Button>
      </div>
    </div>
  );

  const renderSwitchHands = () => (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-green-900/30 rounded-full flex items-center justify-center">
        <Hand size={48} className="text-green-400 scale-x-[-1]" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Right Hand Complete! 🎉</h2>
        <p className="text-slate-300">
          Excellent! Now let's test your left hand with AI tracking.
        </p>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg">
        <div className="text-lg font-semibold text-blue-300 mb-2">Right Hand AI Results</div>
        {testResults.rightHand && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{testResults.rightHand.tapCount}</div>
              <div className="text-xs text-slate-400">AI Detected Taps</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{testResults.rightHand.tapsPerSecond}</div>
              <div className="text-xs text-slate-400">Taps/Second</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{testResults.rightHand.rhythmScore}%</div>
              <div className="text-xs text-slate-400">Rhythm Score</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        <Button onClick={() => setTestPhase('results')} variant="secondary" className="flex-1">
          Skip Left Hand
        </Button>
        <Button onClick={switchToLeftHand} className="flex-1">
          Test Left Hand with AI
        </Button>
      </div>
    </div>
  );

  const renderResults = () => {
    const hasLeftHand = testResults.leftHand !== null;
    const hasRightHand = testResults.rightHand !== null;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">AI Analysis Complete 🤖</h2>
          <p className="text-slate-300">Advanced MediaPipe finger tracking results</p>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasRightHand && (
            <Card title="Right Hand Analysis" className="h-full">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-800 p-3 rounded">
                    <div className="text-2xl font-bold text-blue-400">
                      {testResults.rightHand.tapCount}
                    </div>
                    <div className="text-xs text-slate-400">AI Detected</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded">
                    <div className="text-2xl font-bold text-green-400">
                      {testResults.rightHand.tapsPerSecond}
                    </div>
                    <div className="text-xs text-slate-400">Taps/Second</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-400">
                    {testResults.rightHand.consistency}
                  </div>
                  <div className="text-sm text-slate-300">
                    {testResults.rightHand.rhythmScore}% rhythm consistency
                  </div>
                  <div className="text-xs text-blue-300 mt-1">
                    {testResults.rightHand.speedClassification} • {testResults.rightHand.percentileRank}th percentile
                  </div>
                  {testResults.rightHand.detectedHandedness !== 'Unknown' && (
                    <div className="text-xs text-green-300 mt-1">
                      ✓ AI confirmed: {testResults.rightHand.detectedHandedness} hand
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {hasLeftHand && (
            <Card title="Left Hand Analysis" className="h-full">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-800 p-3 rounded">
                    <div className="text-2xl font-bold text-blue-400">
                      {testResults.leftHand.tapCount}
                    </div>
                    <div className="text-xs text-slate-400">AI Detected</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded">
                    <div className="text-2xl font-bold text-green-400">
                      {testResults.leftHand.tapsPerSecond}
                    </div>
                    <div className="text-xs text-slate-400">Taps/Second</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-400">
                    {testResults.leftHand.consistency}
                  </div>
                  <div className="text-sm text-slate-300">
                    {testResults.leftHand.rhythmScore}% rhythm consistency
                  </div>
                  <div className="text-xs text-blue-300 mt-1">
                    {testResults.leftHand.speedClassification} • {testResults.leftHand.percentileRank}th percentile
                  </div>
                  {testResults.leftHand.detectedHandedness !== 'Unknown' && (
                    <div className="text-xs text-green-300 mt-1">
                      ✓ AI confirmed: {testResults.leftHand.detectedHandedness} hand
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Comparison (if both hands tested) */}
        {hasLeftHand && hasRightHand && (
          <Card title="Hand Comparison">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-slate-400 mb-2">Speed Difference</div>
                <div className="text-lg font-bold text-yellow-400">
                  {Math.abs(testResults.rightHand.tapsPerSecond - testResults.leftHand.tapsPerSecond).toFixed(1)} taps/sec
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-2">Dominant Hand</div>
                <div className="text-lg font-bold text-blue-400">
                  {testResults.rightHand.tapsPerSecond >= testResults.leftHand.tapsPerSecond ? 'Right' : 'Left'}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-2">Symmetry</div>
                <div className="text-lg font-bold text-green-400">
                  {Math.abs(testResults.rightHand.tapsPerSecond - testResults.leftHand.tapsPerSecond) < 1 ? 'Good' : 'Asymmetric'}
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card title="Clinical Interpretation">
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              <strong className="text-blue-300">AI Technology:</strong> MediaPipe computer vision provided real-time hand tracking and automatic tap detection
            </p>
            <p>
              <strong className="text-green-300">Normal Range:</strong> Healthy adults typically achieve 4-7 taps per second with good rhythm consistency
            </p>
            {hasLeftHand && hasRightHand && (
              <p>
                <strong className="text-purple-300">Bilateral Assessment:</strong> Comparing both hands helps identify lateralized motor dysfunction
              </p>
            )}
          </div>
        </Card>

        <div className="flex space-x-4">
          <Button onClick={resetTest} variant="secondary" className="flex-1">
            <RotateCcw size={16} className="mr-2" />
            New AI Test
          </Button>
          <Button onClick={() => onPageChange('providerSuite')} className="flex-1">
            Back to Test Suite
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          onClick={() => onPageChange('providerSuite')}
          variant="secondary"
          className="mr-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Suite
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-blue-300">AI Finger Tap Speed</h1>
          <p className="text-slate-300">MediaPipe-powered motor assessment</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-slate-800 rounded-lg p-8">
        {testPhase === 'setup' && renderSetup()}
        {testPhase === 'instructions' && renderInstructions()}
        {testPhase === 'testing' && renderTesting()}
        {testPhase === 'switchHands' && renderSwitchHands()}
        {testPhase === 'results' && renderResults()}
      </div>
    </div>
  );
};

export default FingerTapTest;