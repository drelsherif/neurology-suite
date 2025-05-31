import React, { useState, useRef, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import HandTracker, { HandAnalytics } from '../../utils/mediaPipeUtils';
import { ArrowLeft, Square, RotateCcw, Hand, Timer, Target, TrendingUp, Camera, CameraOff, Settings } from 'lucide-react';

const FingerTapTest = ({ onPageChange }) => {
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
      console.log('Setting up camera and MediaPipe...');
      
      if (!videoRef.current || !canvasRef.current) {
        console.error('Video or canvas ref not available');
        return false;
      }

      // Initialize HandTracker
      handTrackerRef.current = new HandTracker();
      
      // Set sensitivity
      handTrackerRef.current.adjustSensitivity(sensitivity);
      
      // Set up tap detection callback
      handTrackerRef.current.setTapCallback((tapData) => {
        if (isRecording) {
          const now = Date.now();
          console.log('Tap detected!', tapData);
          
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

      // Initialize MediaPipe
      console.log('Initializing MediaPipe...');
      const success = await handTrackerRef.current.initialize(
        videoRef.current,
        canvasRef.current,
        (results) => {
          // Handle MediaPipe results
          const handData = handTrackerRef.current.getCurrentHandData(results);
          
          if (handData) {
            setHandDetected(true);
            setCurrentHandedness(handData.handedness);
            
            // Calculate real-time metrics
            const metrics = handTrackerRef.current.calculateHandMetrics(
              handData.landmarks,
              640, // canvas width
              480  // canvas height
            );
            
            if (metrics) {
              setRealTimeMetrics(prev => ({
                ...prev,
                handStability: metrics.stability
              }));
            }
          } else {
            setHandDetected(false);
            setCurrentHandedness('Unknown');
          }
        }
      );

      if (success) {
        console.log('Starting hand tracking...');
        await handTrackerRef.current.start();
        setCameraReady(true);
        setMediaPipeReady(true);
        console.log('MediaPipe setup complete!');
        return true;
      }
      
      console.error('MediaPipe initialization failed');
      return false;
    } catch (error) {
      console.error('Camera/MediaPipe setup failed:', error);
      // Fallback message
      alert(`Setup failed: ${error.message}\n\nPlease ensure:\n- Camera permissions are granted\n- You're using HTTPS or localhost\n- MediaPipe libraries are loaded`);
      return false;
    }
  };

  const startTest = async () => {
    console.log('Starting test...');
    const setupSuccess = await setupCamera();
    if (!setupSuccess) {
      console.error('Camera setup failed, cannot start test');
      return;
    }
    
    setTestPhase('testing');
    setIsRecording(true);
    setTapCount(0);
    setTapTimes([]);
    setTimeRemaining(10);
    console.log('Test started - start tapping!');
  };

  const stopTest = () => {
    console.log('Stopping test...');
    setIsRecording(false);
    
    // Stop hand tracking
    if (handTrackerRef.current) {
      handTrackerRef.current.stop();
    }
    
    // Calculate enhanced results
    const results = calculateResults();
    
    // Store results for current hand
    setTestResults(prev => ({
      ...prev,
      [currentHand + 'Hand']: results
    }));
    
    console.log('Test results:', results);
    
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
    
    // Use enhanced analytics
    const speedMetrics = HandAnalytics.calculateSpeedMetrics(tapCount, totalTime);
    const rhythmMetrics = HandAnalytics.calculateRhythmMetrics(tapTimes);
    
    return {
      tapCount,
      tapsPerSecond: speedMetrics.tapsPerSecond,
      rhythmScore: rhythmMetrics ? rhythmMetrics.rhythmScore : 0,
      avgInterval: rhythmMetrics ? rhythmMetrics.meanInterval : 0,
      consistency: rhythmMetrics ? rhythmMetrics.consistency : 'Unknown',
      speedClassification: speedMetrics.classification,
      coefficientOfVariation: rhythmMetrics ? rhythmMetrics.coefficientOfVariation : 0,
      detectedHandedness: currentHandedness,
      testTime: totalTime,
      hand: currentHand,
      percentileRank: speedMetrics.percentileRank
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
    console.log('Resetting test...');
    
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
        <Button onClick={startTest} className="flex-1">
          Start AI Tracking Test
        </Button>
      </div>
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

        {/* Advanced AI Analysis (if both hands tested) */}
        {hasLeftHand && hasRightHand && (
          <Card title="🤖 AI Clinical Analysis">
            <div className="space-y-4">
              {(() => {
                const analysis = HandAnalytics.detectMotorAbnormalities(
                  testResults.leftHand,
                  testResults.rightHand
                );
                
                if (analysis && analysis.hasAbnormalities) {
                  return (
                    <div className="space-y-4">
                      <div className="text-sm font-semibold text-yellow-400 mb-3">
                        🔍 AI Findings: {analysis.summary}
                      </div>
                      
                      {analysis.findings.map((finding, index) => (
                        <div key={index} className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <div className="text-2xl">
                              {finding.severity === 'significant' ? '⚠️' : 'ℹ️'}
                            </div>
                            <div className="flex-1">
                              <div className="text-yellow-300 font-medium text-sm">
                                {finding.description}
                              </div>
                              <div className="text-yellow-200 text-xs mt-1">
                                Clinical Note: {finding.clinicalNote}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="bg-blue-900/20 border border-blue-600 p-4 rounded-lg">
                        <div className="text-sm font-semibold text-blue-400 mb-2">🎯 AI Recommendations:</div>
                        <ul className="text-sm text-blue-300 space-y-1">
                          {analysis.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2 mt-2"></span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-green-900/20 border border-green-600 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">✅</div>
                        <div>
                          <div className="text-green-300 font-medium">Normal Motor Function Detected</div>
                          <div className="text-green-200 text-sm mt-1">
                            AI analysis shows no significant motor abnormalities. Hand coordination appears within normal limits.
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </Card>
        )}

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
    <div className="max-w-4xl mx-auto p-6">
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
      <div className="bg-slate-900 rounded-lg p-8">
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