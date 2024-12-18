import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './qr-scanner.css';

const QrScanner = ({ onScanSuccess, onScanFailure }) => {
  const [scanner, setScanner] = useState(null);
  const [lastScan, setLastScan] = useState({ code: null, timestamp: 0 });
  const [isScanning, setIsScanning] = useState(false);
  const qrRef = useRef(null);
  const SCAN_DELAY = 1000; // Tiempo mínimo entre escaneos en milisegundos

  const handleScanSuccess = (decodedText, decodedResult) => {
    const currentTime = Date.now();
    
    // Verificar si es el mismo código y si ha pasado suficiente tiempo
    if (decodedText === lastScan.code && 
        currentTime - lastScan.timestamp < SCAN_DELAY) {
      return;
    }

    console.log('Escaneado con éxito:', decodedText);
    
    // Actualizar último escaneo con el código y timestamp
    setLastScan({
      code: decodedText,
      timestamp: currentTime
    });
    
    // Llamar al callback de éxito
    onScanSuccess(decodedText, decodedResult);
  };

  const handleScanFailure = (error) => {
    console.warn('Escaneo fallido:', error);
    onScanFailure(error);
  };

  useEffect(() => {
    let scannerInstance = null;

    if (isScanning && qrRef.current) {
      // Configurar el escáner
      scannerInstance = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10,  // Aumentado para mejor respuesta
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          showTorchButtonIfSupported: true,
          rememberLastUsedCamera: true,
          supportedScanTypes: [],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        },
        false
      );
      
      scannerInstance.render(handleScanSuccess, handleScanFailure);
      setScanner(scannerInstance);

      // Cleanup function
      return () => {
        if (scannerInstance) {
          scannerInstance.clear()
            .catch(error => {
              console.error('Error limpiando el escáner: ', error);
            })
            .finally(() => {
              setLastScan({ code: null, timestamp: 0 });
            });
        }
      };
    }
  }, [isScanning]);

  const startScanner = () => {
    setIsScanning(true);
    setLastScan({ code: null, timestamp: 0 });
  };

  const stopScanner = async () => {
    if (scanner) {
      try {
        await scanner.clear();
      } catch (error) {
        console.error('Error limpiando el escáner: ', error);
      }
      setScanner(null);
    }
    setIsScanning(false);
    setLastScan({ code: null, timestamp: 0 });
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