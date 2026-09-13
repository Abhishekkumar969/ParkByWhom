import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Save or update user in Firestore
      const userRef = doc(db, 'users', user.email);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          vehicles: [],
          bellRungAt: null
        });
      }
      localStorage.setItem('currentUser', user.email);
      navigate('/scan');
    } catch (err) {
      console.error(err);
      setError('Google Sign-In failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="glass-card wide" style={{ maxWidth: '600px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🅿️ ParkByWhom</h1>
      <p className="subtitle" style={{ marginBottom: '3rem', fontSize: '1.1rem' }}>
        Scan, Identify, and Alert Vehicle Owners Instantly.
      </p>

      {error && <div className="error-text" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
        <button 
          onClick={handleGoogleSignIn} 
          className="btn btn-primary" 
          style={{ padding: '1.25rem', fontSize: '1.25rem', width: '100%', maxWidth: '350px' }}
          disabled={loading}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: '24px', marginRight: '8px'}}/>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
};

export default Home;
