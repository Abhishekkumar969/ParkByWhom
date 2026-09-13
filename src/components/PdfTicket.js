import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const PdfTicket = ({ userRef, data }) => {
  if (!data || !data.email) return null;

  const qrData = `OWNER_EMAIL:${data.email}`;

  return (
    <div ref={userRef} className="pdf-ticket">
      <div className="pdf-ticket-left">
        <div className="pdf-header">
          🅿️ ParkByWhom
        </div>
        <div className="pdf-detail">
          <div className="pdf-label">Vehicle Owner</div>
          <div className="pdf-value">{data.name}</div>
        </div>
        
        {data.vehicles && data.vehicles.length > 0 && (
          <div className="pdf-detail">
            <div className="pdf-label">Registered Vehicles</div>
            <div className="pdf-value" style={{ fontSize: '1rem' }}>
              {data.vehicles.join('  •  ')}
            </div>
          </div>
        )}
      </div>
      <div className="pdf-ticket-right">
        <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
           <QRCodeSVG value={qrData} size={120} />
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', fontWeight: '500' }}>
          Scan to contact<br/>owner
        </div>
      </div>
    </div>
  );
};

export default PdfTicket;
