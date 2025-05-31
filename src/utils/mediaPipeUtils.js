// src/utils/mediaPipeUtils.js

// Remove the ES6 imports and use global MediaPipe instead
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
  }

  async initialize(videoElement, canvasElement, onResults) {
    try {
      console.log('🔄 Initializing MediaPipe Hand Tracker...');
      this.onResultsCallback = onResults;

      // Check if MediaPipe is loaded globally
      if (typeof window.Hands === 'undefined') {
        console.error('❌ MediaPipe not found. Loading from CDN...');
        
        // Try to load MediaPipe dynamically
        await this.loadMediaPipeScripts();
        
        // Wait a bit for scripts to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (typeof window.Hands === 'undefined') {
          throw new Error('MediaPipe failed to load from CDN');
        }
      }

      console.log('✅ MediaPipe found, initializing Hands...');

      // Initialize MediaPipe Hands using global window object
      this.hands = new window.Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      // Configure hand detection
      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.8,
        minTrackingConfidence: 0.7
      });

      // Set up results callback
      this.hands.onResults((results) => this.onResults(results, canvasElement));

      // Initialize camera
      this.camera = new window.Camera(videoElement, {
        onFrame: async () => {
          if (this.hands && this.isTracking) {
            await this.hands.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480
      });

      this.isInitialized = true;
      console.log('✅ MediaPipe Hand Tracker initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ MediaPipe initialization failed:', error);
      alert(`MediaPipe setup failed: ${error.message}\n\nPlease check your internet connection and try again.`);
      return false;
    }
  }

  async loadMediaPipeScripts() {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
    ];

    for (const src of scripts) {
      await this.loadScript(src);
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // ... rest of your methods stay the same
  onResults(results, canvasElement) {
    const canvasCtx = canvasElement.getContext('2d');
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasElement.width = 640;
    canvasElement.height = 480;
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Use global drawing functions
      window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 2
      });
      
      window.drawLandmarks(canvasCtx, landmarks, {
        color: '#FF0000',
        lineWidth: 1,
        radius: 3
      });

      // Highlight index finger tip
      const indexTip = landmarks[8];
      if (indexTip) {
        const x = indexTip.x * canvasElement.width;
        const y = indexTip.y * canvasElement.height;
        
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

      this.detectTap(landmarks, canvasElement);
      
    } else {
      canvasCtx.fillStyle = '#FFFF00';
      canvasCtx.font = 'bold 16px Arial';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText('Show your hand in the camera', canvasElement.width / 2, canvasElement.height / 2);
      canvasCtx.textAlign = 'left';
    }
    
    canvasCtx.restore();

    if (this.onResultsCallback) {
      this.onResultsCallback(results);
    }
  }



  detectTap(landmarks, canvasElement) {
    const indexTip = landmarks[8]; // Index finger tip
    const indexDip = landmarks[7]; // Index finger DIP joint
    const indexPip = landmarks[6]; // Index finger PIP joint
    
    if (!indexTip || !indexDip || !indexPip) return;

    // Convert to pixel coordinates
    const tipY = indexTip.y * canvasElement.height;
    const dipY = indexDip.y * canvasElement.height;
    const pipY = indexPip.y * canvasElement.height;
    
    // Calculate finger curvature - more curved = more likely a tap
    const fingerCurvature = (dipY + pipY) / 2 - tipY;
    
    // Detect downward tap motion with curvature
    if (this.lastFingerTipY !== null) {
      const movement = tipY - this.lastFingerTipY;
      const currentTime = Date.now();
      
      // Tap conditions:
      // 1. Quick downward movement
      // 2. Finger is reasonably extended (not completely curled)
      // 3. Minimum time between taps to avoid double-counting
      if (movement > this.tapThreshold && 
          fingerCurvature < 40 && // Finger not completely curled
          currentTime - this.lastTapTime > this.minTapInterval) {
        
        this.lastTapTime = currentTime;
        
        // Visual feedback - flash the finger tip
        this.flashFingerTip(indexTip, canvasElement);
        
        // Trigger tap event
        if (this.onTapDetected) {
          this.onTapDetected({
            position: { x: indexTip.x, y: indexTip.y },
            timestamp: currentTime,
            force: Math.min(movement / this.tapThreshold, 3), // Relative tap force
            fingerCurvature: fingerCurvature
          });
        }
      }
    }
    
    this.lastFingerTipY = tipY;
  }

  flashFingerTip(indexTip, canvasElement) {
    // Visual feedback for tap detection
    const canvasCtx = canvasElement.getContext('2d');
    const x = indexTip.x * canvasElement.width;
    const y = indexTip.y * canvasElement.height;
    
    // Draw flash effect
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 20, 0, 2 * Math.PI);
    canvasCtx.fillStyle = 'rgba(255, 255, 0, 0.6)';
    canvasCtx.fill();
    canvasCtx.restore();
    
    // Clear flash after short delay
    setTimeout(() => {
      // Flash will be cleared on next frame
    }, 100);
  }

  setTapCallback(callback) {
    this.onTapDetected = callback;
  }

  // Get current hand data for analysis
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
      thumb: landmarks[4],
      middleFinger: landmarks[12],
      isVisible: true
    };
  }

  // Calculate hand stability and metrics
  calculateHandMetrics(landmarks, canvasWidth, canvasHeight) {
    if (!landmarks) return null;

    const indexTip = landmarks[8];
    const indexMcp = landmarks[5];
    const wrist = landmarks[0];
    
    // Hand span (thumb to pinky)
    const thumb = landmarks[4];
    const pinky = landmarks[20];
    const handSpan = Math.sqrt(
      Math.pow((thumb.x - pinky.x) * canvasWidth, 2) + 
      Math.pow((thumb.y - pinky.y) * canvasHeight, 2)
    );

    // Finger extension (how extended the index finger is)
    const fingerExtension = (indexMcp.y - indexTip.y) * canvasHeight;

    // Hand center for stability analysis
    const handCenter = {
      x: landmarks.reduce((sum, point) => sum + point.x, 0) / landmarks.length,
      y: landmarks.reduce((sum, point) => sum + point.y, 0) / landmarks.length
    };

    return {
      handSpan,
      handCenter,
      fingerExtension,
      handOrientation: Math.atan2(
        (indexMcp.y - wrist.y) * canvasHeight,
        (indexMcp.x - wrist.x) * canvasWidth
      ) * 180 / Math.PI,
      stability: fingerExtension > 30 ? 'Good' : 'Unstable'
    };
  }

  // Adjust sensitivity for different users
  adjustSensitivity(sensitivity) {
    // sensitivity: 'low', 'normal', 'high'
    switch (sensitivity) {
      case 'low':
        this.tapThreshold = 35;
        this.minTapInterval = 200;
        break;
      case 'high':
        this.tapThreshold = 15;
        this.minTapInterval = 100;
        break;
      default: // normal
        this.tapThreshold = 25;
        this.minTapInterval = 150;
    }
  }
}

// Enhanced analytics for rhythm and clinical analysis
export const HandAnalytics = {
  // Calculate tapping rhythm consistency
  calculateRhythmMetrics: (tapTimes) => {
    if (tapTimes.length < 3) return null;

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
    
    return {
      meanInterval: Math.round(meanInterval),
      standardDeviation: Math.round(stdDev),
      coefficientOfVariation: Math.round(coefficientOfVariation * 10) / 10,
      rhythmScore: Math.max(0, 100 - coefficientOfVariation),
      consistency: coefficientOfVariation < 15 ? 'Excellent' : 
                  coefficientOfVariation < 25 ? 'Good' : 
                  coefficientOfVariation < 40 ? 'Fair' : 'Poor'
    };
  },

  // Calculate speed metrics with clinical interpretation
  calculateSpeedMetrics: (tapCount, duration) => {
    const tapsPerSecond = tapCount / duration;
    
    let classification;
    if (tapsPerSecond >= 6) {
      classification = 'Excellent';
    } else if (tapsPerSecond >= 4.5) {
      classification = 'Good';
    } else if (tapsPerSecond >= 3) {
      classification = 'Fair';
    } else if (tapsPerSecond >= 2) {
      classification = 'Below Normal';
    } else {
      classification = 'Significantly Impaired';
    }
    
    return {
      tapsPerSecond: Math.round(tapsPerSecond * 10) / 10,
      totalTaps: tapCount,
      duration,
      classification,
      percentileRank: Math.min(100, Math.round((tapsPerSecond / 7) * 100)) // Assuming 7 taps/sec is 100th percentile
    };
  },

  // Clinical analysis for motor abnormalities
  detectMotorAbnormalities: (leftHandData, rightHandData) => {
    if (!leftHandData || !rightHandData) return null;

    const speedDifference = Math.abs(leftHandData.tapsPerSecond - rightHandData.tapsPerSecond);
    const rhythmDifference = Math.abs(leftHandData.rhythmScore - rightHandData.rhythmScore);
    
    const findings = [];
    
    // Speed asymmetry analysis
    if (speedDifference > 1.5) {
      findings.push({
        type: 'speed_asymmetry',
        severity: speedDifference > 2.5 ? 'significant' : 'mild',
        description: `Speed asymmetry detected: ${speedDifference.toFixed(1)} taps/sec difference between hands`,
        clinicalNote: 'May indicate lateralized motor dysfunction or handedness preference'
      });
    }
    
    // Rhythm consistency analysis
    if (rhythmDifference > 25) {
      findings.push({
        type: 'rhythm_asymmetry',
        severity: rhythmDifference > 40 ? 'significant' : 'mild',
        description: `Rhythm inconsistency: ${rhythmDifference.toFixed(1)}% difference between hands`,
        clinicalNote: 'May suggest cerebellar dysfunction or motor planning deficits'
      });
    }
    
    // Bradykinesia detection
    const avgSpeed = (leftHandData.tapsPerSecond + rightHandData.tapsPerSecond) / 2;
    if (avgSpeed < 3) {
      findings.push({
        type: 'bradykinesia',
        severity: avgSpeed < 2 ? 'significant' : 'mild',
        description: `Slow finger tapping speed: ${avgSpeed.toFixed(1)} taps/sec average`,
        clinicalNote: 'May indicate parkinsonian features or general motor slowing'
      });
    }

    // Rhythm variability (both hands)
    const avgRhythm = (leftHandData.rhythmScore + rightHandData.rhythmScore) / 2;
    if (avgRhythm < 40) {
      findings.push({
        type: 'rhythm_variability',
        severity: avgRhythm < 25 ? 'significant' : 'mild',
        description: `Poor rhythm consistency: ${avgRhythm.toFixed(1)}% average rhythm score`,
        clinicalNote: 'May suggest cerebellar dysfunction or attention deficits'
      });
    }
    
    return {
      hasAbnormalities: findings.length > 0,
      findings,
      summary: findings.length === 0 ? 'Normal motor function detected' : `${findings.length} potential motor finding(s) identified`,
      recommendations: findings.length > 0 ? [
        'Consider comprehensive neurological evaluation',
        'Monitor progression with serial testing',
        'Correlate with clinical history and examination',
        'Consider additional motor assessments if indicated'
      ] : [
        'Normal results - no immediate follow-up needed',
        'Consider annual screening if risk factors present'
      ]
    };
  }
};

export default HandTracker;