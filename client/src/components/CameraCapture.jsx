import { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Unable to access camera. Please allow permissions.");
      onClose();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
      stopCamera();
      onCapture(file);
    }, 'image/jpeg', 0.8);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex justify-between items-center p-4 bg-black/50 absolute top-0 w-full z-10">
        <span className="text-white font-bold">Take Photo</span>
        <button onClick={() => { stopCamera(); onClose(); }} className="text-white p-2">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-8 bg-black/50 flex justify-center pb-12">
        <button 
          onClick={takePhoto}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white/50 transition-all"
        >
          <div className="w-16 h-16 bg-white rounded-full" />
        </button>
      </div>
    </div>
  );
};

export default CameraCapture;