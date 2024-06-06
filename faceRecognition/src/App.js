import React, { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

function App() {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.BarcodeDetector) {
      console.error("Your device does not support the Barcode Detection API. Try again on Chrome Desktop or Android");
    } else {
      async function startVideo() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
          .then(function (stream) {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch(function (err) {
            console.log(err);
          });
      }

      async function loadModels() {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
      }

      async function handleVideoPlay() {
        const video = videoRef.current;
        const canvas = await faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        // setInterval(async () => {
          await loadModels();
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
          console.log(detections)
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
       // }, );
      }

      startVideo();

      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current.play();
        handleVideoPlay();
      });

    }
  }, []);

  return (
    <div className="App">
      <h1>Facial Recognition Login</h1>
      <video ref={videoRef} width="640" height="480" muted playsInline />
    </div>
  );
}

export default App;
