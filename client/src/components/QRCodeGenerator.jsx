import { QRCodeSVG } from 'qrcode.react';

// Props: value (url), label (container name), subLabel (location)
const QRCodeGenerator = ({ value, label, subLabel }) => {
  return (
    <div className="print-only hidden">
      {/* CSS for Print Media
         This container forces specific 2x2cm sizing logic when printed 
      */}
      <style>
        {`
          @media print {
            .print-only { 
              display: block !important; 
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: white;
              z-index: 9999;
              padding: 20px;
            }
            .qr-sticker {
              width: 2cm;
              height: 2cm;
              border: 1px solid #ccc;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              page-break-inside: avoid;
              margin-bottom: 10px;
            }
            /* Hide everything else */
            body > *:not(.print-only) {
              display: none;
            }
          }
        `}
      </style>

      <div className="qr-sticker">
        <QRCodeSVG value={value} size={40} level="M" />
        <div style={{ fontSize: '8px', fontWeight: 'bold', marginTop: '2px', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {label}
        </div>
        <div style={{ fontSize: '6px', color: '#555' }}>
          {subLabel}
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;