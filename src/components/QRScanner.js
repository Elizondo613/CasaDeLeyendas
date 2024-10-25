import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess, onScanFailure }) => {
  const [scanner, setScanner] = useState(null);
  const [method, setMethod] = useState(null);

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
    <div className="min-h-screen bg-[#B8860B] p-4">
      <div className="max-w-md mx-auto">
        <button 
          onClick={() => setMethod('camera')} 
          className="w-full bg-[#1e3333] text-white py-3 px-6 rounded-lg hover:opacity-90 transition-opacity duration-200 mb-6 font-medium"
        >
          Escanear QR
        </button>
        
        {method === 'camera' && (
          <div 
            id="qr-reader" 
            className="bg-white rounded-lg p-4 shadow-lg"
            style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
          ></div>
        )}
        
        {method === 'file' && (
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              className="w-full p-2 border rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QrScanner;