import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { RefreshCcw, Flashlight, FlashlightOff, CheckCircle, User, Bell } from 'lucide-react';

const Scanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [ownerDetails, setOwnerDetails] = useState(null);
  const [loadingBell, setLoadingBell] = useState(false);
  const [camError, setCamError] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  
  // New State for Camera features
  const [facingMode, setFacingMode] = useState("environment"); // "environment" = back, "user" = front
  const [isTorchOn, setIsTorchOn] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isScanning && !scanResult) {
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;
      
      scanner.start(
        { facingMode: facingMode },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (decodedText.startsWith('OWNER_EMAIL:')) {
            const email = decodedText.split('OWNER_EMAIL:')[1];
            setScanResult(email);
            setIsScanning(false);
            
            // Stop scanning visually
            scanner.stop().catch(e => console.error(e));
            
            try {
              const docRef = doc(db, 'users', email);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                setOwnerDetails(docSnap.data());
              }
            } catch (err) {
              console.error("Failed to fetch owner details", err);
            }
          } else {
            alert("Invalid ParkByWhom QR Code");
          }
        },
        (error) => {
          // ignore scan errors
        }
      ).then(() => {
        // Reset torch state when camera restarts
        setIsTorchOn(false);
      }).catch((err) => {
        setCamError("Camera permission denied or camera not found. Please allow camera access.");
        setIsScanning(false);
      });

      return () => {
        if (scanner && scanner.isScanning) {
          scanner.stop().catch(e => console.error(e));
        }
      };
    }
  }, [isScanning, scanResult, facingMode]);

  const handleRingBell = async () => {
    if (scanResult) {
      setLoadingBell(true);
      try {
        const docRef = doc(db, 'users', scanResult);
        await updateDoc(docRef, { bellRungAt: Date.now() });
        alert('🔔 Bell rung! Notification sent to the vehicle owner.');
        // Don't navigate away, let them stay or scan another
      } catch (err) {
        console.error("Failed to ring bell", err);
        alert('Failed to send notification. Please try again.');
      }
      setLoadingBell(false);
    }
  };

  const handleScanAnother = () => {
    setScanResult(null);
    setOwnerDetails(null);
    setCamError('');
    setIsScanning(true);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const toggleTorch = async () => {
    try {
      const newTorchState = !isTorchOn;
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: newTorchState }]
        });
        setIsTorchOn(newTorchState);
      }
    } catch (err) {
      console.error("Torch error", err);
      alert("Flashlight is not supported by this camera/browser.");
    }
  };

  return (
    <div className="scanner-container">
      
      {!scanResult && isScanning && !camError && (
        <div className="scanner-box">
          
          <div id="reader"></div>
          
          {/* Laser Line Overlay */}
          <div className="scanner-overlay">
             <div className="laser-line"></div>
          </div>
          
          {/* Camera Controls Overlay */}
          <div className="scanner-controls">
            <button 
              onClick={toggleCamera} 
              className="icon-btn"
              title="Switch Camera"
            >
              <RefreshCcw size={24} />
            </button>
            
            {/* Only show Torch button if using back camera (environment) */}
            {facingMode === "environment" && (
              <button 
                onClick={toggleTorch} 
                className="icon-btn"
                style={{ background: isTorchOn ? 'rgba(255,255,255,0.9)' : '', color: isTorchOn ? 'black' : '' }}
                title="Toggle Flashlight"
              >
                {isTorchOn ? <Flashlight size={24} /> : <FlashlightOff size={24} />}
              </button>
            )}
          </div>
        </div>
      )}

      {camError && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '8px', margin: '2rem', textAlign: 'center', border: '1px solid #f87171', zIndex: 1000, position: 'relative' }}>
          {camError}
          <button onClick={handleScanAnother} className="btn btn-secondary" style={{ marginTop: '1rem', background: 'white' }}>
            Try Again
          </button>
        </div>
      )}

      {scanResult && (
        <div className="scan-result-overlay">
          <div className="scan-result-card success">
            
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'var(--primary)', color: '#1f2937', borderRadius: '50%', marginBottom: '1rem' }}>
              <CheckCircle size={32} />
            </div>
            
            <h3 style={{ color: 'var(--text-main)', marginBottom: '1.5rem', fontWeight: 800 }}>Vehicle Identified!</h3>
            
            {ownerDetails && (
              <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left', border: '1px solid rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.75rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <User size={20} />
                  {ownerDetails.name}
                </p>
                
                <div>
                  <span style={{color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px'}}>Registered Vehicles</span>
                  {(!ownerDetails.vehicles || ownerDetails.vehicles.length === 0) ? (
                    <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#94a3b8' }}>No vehicles registered.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {ownerDetails.vehicles.map((v, i) => (
                        <li key={i} style={{ background: 'var(--primary)', color: '#1f2937', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: '700', letterSpacing: '1px' }}>
                          {v}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={handleRingBell} className="btn btn-primary" style={{ fontSize: '1.25rem', padding: '1rem', background: '#ef4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={loadingBell}>
                {loadingBell ? 'Ringing...' : (
                  <>
                    <Bell size={20} />
                    Ring Bell
                  </>
                )}
              </button>

              <button onClick={handleScanAnother} className="btn btn-secondary">
                Scan Another QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
