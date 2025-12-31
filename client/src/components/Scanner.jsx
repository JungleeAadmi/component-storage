import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

const Scanner = ({ onScan, onClose }) => {
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Success callback
        scanner.clear();
        onScan(decodedText);
      },
      (errorMessage) => {
        // Error callback (scanning in progress, usually ignored)
        // setScanError(errorMessage); 
      }
    );

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-dark-800 p-2 rounded-full hover:bg-dark-700"
      >
        <X size={24} />
      </button>

      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div id="reader" className="w-full"></div>
      </div>
      
      <p className="text-white mt-4 text-center text-sm opacity-80">
        Point camera at a Container or Tray QR Code
      </p>
      
      {scanError && <p className="text-red-500 text-xs mt-2">{scanError}</p>}
    </div>
  );
};

export default Scanner;