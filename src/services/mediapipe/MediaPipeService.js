import { Camera } from '@mediapipe/camera_utils';

let globalCamera = null;

export function getOrCreateCamera(videoElement, onFrame) {
  if (!globalCamera) {
    globalCamera = new Camera(videoElement, {
      onFrame,
      width: 640,
      height: 480,
    });
    globalCamera.start();
  }
  return globalCamera;
}

export function stopCamera() {
  if (globalCamera) {
    globalCamera.stop();
    globalCamera = null;
  }
}
