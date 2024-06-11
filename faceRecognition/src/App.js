import React, { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

const TIMEOUT = 2000;

function loadLabeledFaceDescriptorsFromDatabase() {
  // Fetch the data from localStorage
  const data = JSON.parse(localStorage.getItem('face-descriptors') || '[]');
  // Convert the data to LabeledFaceDescriptors
  const labeledFaceDescriptors = data.map(({ label, descriptors }) => {
    const float32ArrayDescriptors = descriptors.map(descriptor => new Float32Array(Object.values(descriptor)));
    return new faceapi.LabeledFaceDescriptors(label, float32ArrayDescriptors);
  });

  return labeledFaceDescriptors;
}

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    };

    const handleVideo = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      const intervalId = setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        if (!localStorage.getItem('face-descriptors')) {
          if (resizedDetections && resizedDetections.length > 0) {
            const faceDescriptors = resizedDetections.map(detection => detection.descriptor);
            localStorage.setItem('face-descriptors', JSON.stringify([{ label: 'FaceID', descriptors: faceDescriptors }]));
            clearInterval(intervalId); // Stop the interval after saving the face descriptor
          }
        } else {
          // Load labeled face descriptors from your database
          const labeledFaceDescriptors = await loadLabeledFaceDescriptorsFromDatabase();
          if (labeledFaceDescriptors && labeledFaceDescriptors.length > 0) {
            const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
            resizedDetections.forEach(detection => {
              const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
              if (bestMatch.label === 'FaceID' && bestMatch.distance < 0.6) {
                clearInterval(intervalId);
                alert('Authenticated');
              } else {
                console.log('Not Authenticated');
              }
            });

          }
        }
      }, 100);

      setTimeout(() => {
        clearInterval(intervalId);
      }, TIMEOUT);
    };

    loadModels().then(() => {
      navigator.mediaDevices.getUserMedia({ video: {} }).then(stream => {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadedmetadata', () => {
          videoRef.current.play();
          handleVideo();
        });
      })
      .catch(err => console.error(err));
    });
    // if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.BarcodeDetector) {
    //   console.error("Your device does not support the Barcode Detection API. Try again on Chrome Desktop or Android");
    // } else {
    //   async function startVideo() {
    //     navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    //       .then(function (stream) {
    //         if (videoRef.current) {
    //           videoRef.current.srcObject = stream;
    //         }
    //       })
    //       .catch(function (err) {
    //         console.log(err);
    //       });
    //   }

    //   const run = async () => {
    //     await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    //     // await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    //     await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    //     await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    //     // await faceapi.nets.faceExpressionNet.loadFromUri('/models');

    //     const video = videoRef.current;
    //     const canvas = faceapi.createCanvasFromMedia(video);
    //     document.getElementById('root').append(canvas);
    //     const displaySize = { width: video.width, height: video.height };
    //     faceapi.matchDimensions(canvas, displaySize);
    //     const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
    //     const resizedDetections = faceapi.resizeResults(detections, displaySize);
    //     canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    //     faceapi.draw.drawDetections(canvas, resizedDetections);
    //     faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    //     faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    //   };

    //   startVideo();

    //   videoRef.current.addEventListener('loadedmetadata', () => {
    //     videoRef.current.play();
    //     run();
    //   });

    // }
  }, []);

  return (
    <>
      <video ref={videoRef} autoPlay muted height={720} width={1280} />
      <canvas ref={canvasRef} />
    </>
  );
}

export default App;
