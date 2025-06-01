import { useEffect, useRef, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export const useHandDetection = (videoRef, onResults) => {
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize MediaPipe Hands
    handsRef.current = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    handsRef.current.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    handsRef.current.onResults((res) => {
      setResults(res); // for overlay or other use
      if (onResults) onResults(res); // external callback like from FingerTapTest
    });

    // Create camera instance
    cameraRef.current = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current && handsRef.current) {
          await handsRef.current.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

  }, [videoRef, onResults]);

  const startCamera = () => {
    if (cameraRef.current) cameraRef.current.start();
  };

  const stopCamera = () => {
    if (cameraRef.current) cameraRef.current.stop();
  };

  return {
    results,
    startCamera,
    stopCamera,
  };
};
