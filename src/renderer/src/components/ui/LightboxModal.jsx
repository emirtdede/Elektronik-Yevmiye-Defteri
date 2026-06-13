import React, { useState, useRef, useEffect } from 'react';

const LightboxModal = ({ isOpen, imageSrc, onClose }) => {
  if (!isOpen || !imageSrc) return null;

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef(null);

  // Reset zoom & drag when image changes or modal closes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [imageSrc, isOpen]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="drawer-overlay" 
      style={{ 
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        userSelect: 'none'
      }} 
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        style={{ 
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          zIndex: 10000
        }}
        onClick={e => e.stopPropagation()}
      >
        <button type="button" className="btn btn-primary" onClick={handleZoomIn} style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>+</button>
        <button type="button" className="btn btn-primary" onClick={handleZoomOut} style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>-</button>
        <button type="button" className="btn" onClick={handleReset} style={{ height: '40px', fontSize: '0.85rem' }}>Sıfırla</button>
        <button type="button" className="btn btn-danger" onClick={onClose} style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>✕</button>
      </div>

      <div 
        style={{ 
          position: 'relative',
          maxWidth: '90%',
          maxHeight: '90vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
        onWheel={handleWheel}
      >
        <img 
          ref={imageRef}
          src={imageSrc} 
          alt="Lightbox View" 
          onMouseDown={handleMouseDown}
          style={{ 
            maxWidth: '100%', 
            maxHeight: '85vh', 
            objectFit: 'contain', 
            borderRadius: '8px', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            transformOrigin: 'center center'
          }} 
        />
      </div>
    </div>
  );
};

export default LightboxModal;
