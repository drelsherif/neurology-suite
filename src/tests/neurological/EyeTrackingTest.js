import React, { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export default function EyeTrackingTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [irisOffset, setIrisOffset] = useState({ x: 0, y: 0 });
  const [faceDetected, setFaceDetected] = useState(false);

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

      setIrisOffset({ x: offsetX, y: offsetY });

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

    video.onloadedmetadata = () => {
      camera.start();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-black">
      <video
        ref={videoRef}
        width="640"
        height="480"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
      />
      <div className="absolute top-2 left-2 z-20 bg-white/80 text-black text-sm p-2 rounded">
        Face: {faceDetected ? '✓' : '✗'}<br />
        x: {irisOffset.x.toFixed(2)}, y: {irisOffset.y.toFixed(2)}
      </div>
    </div>
  );
}
