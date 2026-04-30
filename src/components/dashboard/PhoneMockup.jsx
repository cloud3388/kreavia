import React from 'react';

const PhoneMockup = ({ children }) => {
  return (
    <div style={{
      position: 'relative',
      margin: '0 auto',
      backgroundColor: '#1f2937',
      border: '14px solid #1f2937',
      borderRadius: '2.5rem',
      height: '600px',
      width: '300px',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      overflow: 'hidden',
    }}>
      {/* Side buttons */}
      <div style={{ height: '32px', width: '3px', backgroundColor: '#1f2937', position: 'absolute', left: '-17px', top: '72px', borderRadius: '0.5rem 0 0 0.5rem' }}></div>
      <div style={{ height: '46px', width: '3px', backgroundColor: '#1f2937', position: 'absolute', left: '-17px', top: '124px', borderRadius: '0.5rem 0 0 0.5rem' }}></div>
      <div style={{ height: '46px', width: '3px', backgroundColor: '#1f2937', position: 'absolute', left: '-17px', top: '178px', borderRadius: '0.5rem 0 0 0.5rem' }}></div>
      <div style={{ height: '64px', width: '3px', backgroundColor: '#1f2937', position: 'absolute', right: '-17px', top: '142px', borderRadius: '0 0.5rem 0.5rem 0' }}></div>
      
      {/* Notch */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '8rem',
        height: '1.5rem',
        backgroundColor: '#1f2937',
        borderRadius: '0 0 1rem 1rem',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ width: '2.5rem', height: '4px', backgroundColor: 'rgba(55,65,81,0.5)', borderRadius: '9999px' }}></div>
      </div>

      {/* Screen Content */}
      <div style={{
        borderRadius: '2rem',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        position: 'relative',
        zIndex: 10,
      }}>
        {children}
      </div>
      
      {/* Home Indicator */}
      <div style={{
        position: 'absolute',
        bottom: '6px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '8rem',
        height: '4px',
        backgroundColor: 'rgba(31,41,55,0.2)',
        borderRadius: '9999px',
        zIndex: 20,
      }}></div>
    </div>
  );
};

export default PhoneMockup;
