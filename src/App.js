import React, { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

function App() {
  const videoRef = useRef(null);
  // const canvasRef = useRef(null);

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

      startVideo();
      // eslint-disable-next-line no-undef
      let barcodeDetector = new BarcodeDetector({ formats: ["qr_code"] });

      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current.play();
        const video = videoRef.current;

        let canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        let context = canvas.getContext('2d');

        let checkForQrCode = async function () {
          //we draw the current view from the camera on a canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          //then we pass that canvas to the barcode detector
          let barcodes = await barcodeDetector.detect(canvas);
          console.log(barcodes)
          if (barcodes.length > 0) {
            let barcodeData = barcodes[0].rawValue;
            alert("Detected QR code with the following content: " + barcodeData);
            barcodes = [];
          };

          requestAnimationFrame(checkForQrCode);
        };

        checkForQrCode();

      });

      videoRef.current.addEventListener('play', () => { console.log('Video is playing'); });
    }

    // async function loadModels() {
    //    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    //    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    //    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    //    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    // }

    // async function handleVideoPlay() {
    //   const video = videoRef.current;
    //   const canvas = await faceapi.createCanvasFromMedia(video);
    //   document.body.append(canvas);
    //   const displaySize = { width: video.width, height: video.height };
    //   faceapi.matchDimensions(canvas, displaySize);

    //   setInterval(async () => {
    //      await  loadModels();
    //      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
    //      const resizedDetections = faceapi.resizeResults(detections, displaySize);
    //      const context = canvas.getContext('2d');
    //      context.clearRect(0, 0, canvas.width, canvas.height);
    //      faceapi.draw.drawDetections(canvas, resizedDetections);
    //      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    //    }, 100);
    // }
  }, []);

  return (
    <div className="App">
      <h1>Facial Recognition Login</h1>
      <video ref={videoRef} width="640" height="480" muted playsInline />
    </div>
  );
}

export default App;
