import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PdfTicket from './PdfTicket';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Download } from 'lucide-react';

const MyVehicles = () => {
  const navigate = useNavigate();
  const ticketRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    vehicles: []
  });
  const [newVehicle, setNewVehicle] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userEmail = localStorage.getItem('currentUser');
    if (!userEmail) {
      navigate('/');
      return;
    }
    
    setCurrentUser(userEmail);
    
    // Fetch user data from Firestore
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'users', userEmail);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
             name: data.name || '',
             email: data.email || userEmail,
             vehicles: data.vehicles || []
          });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setLoading(false);
    };
    
    fetchData();

    // Listen for real-time Bell alerts
    const unsubscribe = onSnapshot(doc(db, 'users', userEmail), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.bellRungAt) {
          const now = Date.now();
          if (now - data.bellRungAt < 10000) {
             const pattern = [];
             for (let i = 0; i < 10; i++) {
               pattern.push(500, 300);
             }
             if (navigator.vibrate) {
               navigator.vibrate(pattern);
             }
             alert("🔔 Someone is at your vehicle! Please check immediately.");
          }
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const saveVehiclesToCloud = async (updatedVehicles) => {
    try {
      const docRef = doc(db, 'users', currentUser);
      await updateDoc(docRef, { vehicles: updatedVehicles });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Error saving data:", err);
      alert("Failed to save changes.");
    }
  };

  const handleAddVehicle = (e) => {
    e.preventDefault();
    if (newVehicle.trim() !== '') {
      const updatedVehicles = [...formData.vehicles, newVehicle.trim().toUpperCase()];
      setFormData(prev => ({ ...prev, vehicles: updatedVehicles }));
      setNewVehicle('');
      saveVehiclesToCloud(updatedVehicles);
    }
  };

  const handleRemoveVehicle = (index) => {
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles.splice(index, 1);
    setFormData(prev => ({ ...prev, vehicles: updatedVehicles }));
    saveVehiclesToCloud(updatedVehicles);
  };

  const handleInstallApp = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choiceResult) => {
        window.deferredPrompt = null;
      });
    } else if (isIOS) {
      alert("To install on iOS: Tap the Share button (square with arrow pointing up) at the bottom of Safari, then select 'Add to Home Screen'.");
    } else {
      alert("App installation is not supported by your current browser, or it is already installed.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const generatePDF = async () => {
    if (ticketRef.current) {
      const canvas = await html2canvas(ticketRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [600, 350]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 600, 350);
      pdf.save(`ParkingTicket_${formData.name.replace(/\s+/g, '')}.pdf`);
    }
  };

  const qrData = `OWNER_EMAIL:${currentUser}`;

  if (loading) {
    return <div className="glass-card"><h3 style={{textAlign: 'center'}}>Loading My Vehicles...</h3></div>;
  }

  return (
    <div className="glass-card wide" style={{ maxWidth: '900px', marginBottom: '80px' }}>
      <h2>Vehicle Dashboard</h2>
      <p style={{textAlign: 'center', marginBottom: '1.25rem'}}>Welcome, {formData.name}</p>
      
      <div className="dashboard-grid">
        <div>
          <h3 style={{ fontSize: '1.25rem', textAlign: 'left', marginBottom: '0.75rem' }}>Your Vehicles</h3>
          
          <ul style={{ listStyle: 'none', marginBottom: '1.25rem', padding: 0 }}>
            {formData.vehicles.length === 0 && (
              <li style={{color: 'var(--text-muted)', marginBottom: '0.75rem'}}>No vehicles added yet.</li>
            )}
            {formData.vehicles.map((v, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.05)', padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span style={{fontWeight: 'bold', letterSpacing: '1px'}}>{v}</span>
                <button onClick={() => handleRemoveVehicle(i)} style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold'}}>✕</button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddVehicle} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <input 
              type="text" 
              placeholder="e.g. UP32 XX 1234" 
              value={newVehicle}
              onChange={(e) => setNewVehicle(e.target.value)}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-main)' }}
            />
            <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.75rem 1.25rem' }}>Add</button>
          </form>

          {isSaved && <p style={{ color: 'var(--success)', fontSize: '0.875rem', textAlign: 'center', marginTop: '-0.5rem' }}>Changes saved automatically ✓</p>}
        </div>

        <div className="qr-section" style={{ background: 'rgba(0,0,0,0.02)' }}>
          <div className="qr-container">
            <QRCodeSVG value={qrData} size={200} />
          </div>
          <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            Print this QR for your dashboard.
          </p>
          
          <button onClick={generatePDF} className="btn btn-primary" style={{ marginBottom: '1rem' }}>
            Download QR ID Card (PDF)
          </button>
          
          <button onClick={handleInstallApp} className="btn btn-primary" style={{ marginBottom: '1rem', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Download size={20} />
            Download App
          </button>
          
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <PdfTicket userRef={ticketRef} data={formData} />
    </div>
  );
};

export default MyVehicles;
