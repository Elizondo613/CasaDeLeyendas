import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './qr-scanner.css';

const QrScanner = ({ onScanSuccess, onScanFailure }) => {
  const [scanner, setScanner] = useState(null);
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const qrRef = useRef(null);

  const handleScanSuccess = (decodedText, decodedResult) => {
    if (decodedText === lastScannedCode) return;

    console.log('Escaneado con éxito:', decodedText);
    setLastScannedCode(decodedText);
    onScanSuccess(decodedText, decodedResult);
    setTimeout(() => setLastScannedCode(null), 3000);
  };

  const handleScanFailure = (error) => {
    console.warn('Escaneo fallido:', error);
    onScanFailure(error);
  };

  useEffect(() => {
    // Solo inicializar el escáner cuando isScanning es true
    if (isScanning && qrRef.current) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 5, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          showTorchButtonIfSupported: true,
          rememberLastUsedCamera: true,
          supportedScanTypes: [],
        },
        false
      );
      
      html5QrcodeScanner.render(handleScanSuccess, handleScanFailure);
      setScanner(html5QrcodeScanner);

      // Cleanup function
      return () => {
        html5QrcodeScanner.clear().catch(error => {
          console.error('Error limpiando el escáner: ', error);
        });
      };
    }
  }, [isScanning]); // Depende de isScanning

  const startScanner = () => {
    setIsScanning(true);
  };

  const stopScanner = () => {
    setIsScanning(false);
    if (scanner) {
      scanner.clear().catch(error => {
        console.error('Error limpiando el escáner: ', error);
      });
      setScanner(null);
    }
  };

  return (
    <div className="bg-[#B8860B] p-4">
      <div className="max-w-md mx-auto space-y-4">
        {!isScanning ? (
          <button 
            onClick={startScanner} 
            className="w-full bg-[#1e3333] text-white py-3 px-6 rounded-lg hover:opacity-90 transition-opacity duration-200 font-medium"
          >
            Escanear QR
          </button>
        ) : (
          <div className="qr-container rounded-lg overflow-hidden bg-[#1e3333]">
            <div 
              id="qr-reader" 
              ref={qrRef}
              className="qr-scanner-custom"
            />
            <button 
              onClick={stopScanner}
              className="w-full bg-red-500 text-white py-2 px-4 mt-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
            >
              Cancelar escaneo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrScanner;