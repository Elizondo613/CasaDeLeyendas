import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess, onScanFailure }) => {
  const [scanner, setScanner] = useState(null);
  const [method, setMethod] = useState(null); // Estado para el método de escaneo

  const handleScanSuccess = (decodedText, decodedResult) => {
    console.log('Escaneado con éxito:', decodedText);
    onScanSuccess(decodedText, decodedResult);
  };

  const handleScanFailure = (error) => {
    console.warn('Escaneo fallido:', error);
    onScanFailure(error);
  };

  useEffect(() => {
    if (!method) return;

    let html5QrcodeScanner;
    if (method === 'camera') {
      html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      html5QrcodeScanner.render(handleScanSuccess, handleScanFailure);
    } else if (method === 'file') {
      html5QrcodeScanner = new Html5Qrcode("qr-reader");
    }

    setScanner(html5QrcodeScanner);

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => {
          console.error('Error limpiando el escáner: ', error);
        });
      }
    };
  }, [method]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && scanner) {
      scanner.scanFile(file, true)
        .then(handleScanSuccess)
        .catch(handleScanFailure);
    }
  };

  return (
    <div>
      <div>
        <button onClick={() => setMethod('camera')} className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mb-4"
          >Escanear QR</button>
      </div>
      {method === 'camera' && <div id="qr-reader" style={{ width: '300px' }}></div>}
      {method === 'file' && <input type="file" accept="image/*" onChange={handleFileUpload} />}
    </div>
  );
};

export default QrScanner;
