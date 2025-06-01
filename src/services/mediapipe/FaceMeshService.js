import { FaceMesh } from '@mediapipe/face_mesh';

let faceMeshInstance = null;

export function getFaceMesh() {
  if (!faceMeshInstance) {
    faceMeshInstance = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMeshInstance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }
  return faceMeshInstance;
}
