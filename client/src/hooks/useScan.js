import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const useScan = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleScan = (decodedText) => {
    try {
      // Expecting URL format: http://site.com/container/123 or /tray/456
      // or just a raw ID if you printed simple codes
      
      let path = decodedText;
      
      // If it's a full URL, extract the path
      if (decodedText.startsWith('http')) {
        const url = new URL(decodedText);
        path = url.pathname;
      }

      // Basic validation
      if (path.includes('/container/') || path.includes('/tray/') || path.includes('/component/')) {
        navigate(path);
      } else {
        // Fallback: If it's just an ID, assume Container? 
        // Or show error
        setError(`Unknown QR Format: ${decodedText}`);
        alert(`Unknown QR Format: ${decodedText}`);
      }
    } catch (err) {
      setError('Invalid QR Code');
      console.error(err);
    }
  };

  return { handleScan, error };
};

export default useScan;