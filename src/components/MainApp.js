import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Scanner from './Scanner';
import MyVehicles from './MyVehicles';
import { Camera, Car } from 'lucide-react';

const MainApp = () => {
  const navigate = useNavigate();
  // Set default tab to 'scan' as requested
  const [activeTab, setActiveTab] = useState('scan');

  useEffect(() => {
    const userEmail = localStorage.getItem('currentUser');
    if (!userEmail) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div style={{ paddingBottom: '70px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        {activeTab === 'scan' ? <Scanner /> : <MyVehicles />}
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--card-border)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -4px 10px rgba(0,0,0,0.05)',
        zIndex: 1000
      }}>
        
        <button 
          onClick={() => setActiveTab('scan')}
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'scan' ? 'var(--primary-hover)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'color 0.2s',
            fontWeight: activeTab === 'scan' ? '700' : '500'
          }}
        >
          <Camera size={24} />
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Scan</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('vehicles')}
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'vehicles' ? 'var(--primary-hover)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'color 0.2s',
            fontWeight: activeTab === 'vehicles' ? '700' : '500'
          }}
        >
          <Car size={24} />
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>My Vehicles</span>
        </button>

      </div>
    </div>
  );
};

export default MainApp;
