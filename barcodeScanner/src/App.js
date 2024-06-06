import React, { useEffect, useRef } from 'react';
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
            window.location = barcodeData;
          };

          requestAnimationFrame(checkForQrCode);
        };

        checkForQrCode();

      });

      videoRef.current.addEventListener('play', () => { console.log('Video is playing'); });
    }
  }, []);

  return (
    <div className="App">
      <h1>QR Code Scanner</h1>
      <video ref={videoRef} width="640" height="480" muted playsInline />
    </div>
  );
}

export default App;
