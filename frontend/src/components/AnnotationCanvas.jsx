import { useEffect, useRef, useState } from 'react';

const AnnotationCanvas = ({ 
  imageUrl, 
  teeth = [], 
  imageWidth, 
  imageHeight,
  onSubboxClick 
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [hoveredSubbox, setHoveredSubbox] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // ...existing code...
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
    img.onerror = () => {};
  }, [imageUrl]);
  
  // Redraw canvas when teeth or hover state changes
  useEffect(() => {
    if (imageRef.current) {
      drawCanvas();
    }
  }, [teeth, hoveredSubbox]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img) {
      return;
    }

    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match image
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw image
    ctx.drawImage(img, 0, 0);
    
    // Draw annotations
    try {
      teeth.forEach((tooth) => {
        // Draw tooth bounding box (parent)
        const toothBox = tooth.bbox;
        if (!Array.isArray(toothBox)) return;
        if (toothBox.length !== 4) return;
        const invalidElements = toothBox.filter((v) => typeof v !== 'number');
        if (invalidElements.length > 0) return;
        ctx.strokeStyle = '#10b981'; // Green for tooth
        ctx.lineWidth = 2;
        ctx.strokeRect(toothBox[0], toothBox[1], toothBox[2], toothBox[3]);
        // Draw label
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.fillRect(toothBox[0], toothBox[1] - 20, 60, 20);
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Tooth ${tooth.category_name}`, toothBox[0] + 5, toothBox[1] - 6);
        // Draw subboxes
        if (!tooth.subboxes || !Array.isArray(tooth.subboxes)) return;
        tooth.subboxes.forEach((subbox) => {
          const box = subbox.bbox;
          if (!Array.isArray(box) || box.length !== 4) return;
          const isHovered = hoveredSubbox?.subbox_id === subbox.subbox_id;
          // Determine color based on plaque status
          let fillColor, strokeColor;
          if (subbox.plaque_status === null) {
            fillColor = 'rgba(148, 163, 184, 0.3)'; // Gray - not annotated
            strokeColor = '#94a3b8';
          } else if (subbox.plaque_status === 0) {
            fillColor = 'rgba(16, 185, 129, 0.4)'; // Green - no plaque
            strokeColor = '#10b981';
          } else {
            fillColor = 'rgba(239, 68, 68, 0.4)'; // Red - has plaque
            strokeColor = '#ef4444';
          }
          // Fill subbox
          ctx.fillStyle = fillColor;
          ctx.fillRect(box[0], box[1], box[2], box[3]);
          // Stroke subbox
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = isHovered ? 4 : 2;
          ctx.strokeRect(box[0], box[1], box[2], box[3]);
          // If hovered, add highlight
          if (isHovered) {
            ctx.strokeStyle = '#FFD700'; // Gold
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(box[0], box[1], box[2], box[3]);
            ctx.setLineDash([]);
          }
          // Draw region label
          const label = subbox.region.charAt(0).toUpperCase();
          ctx.fillStyle = strokeColor;
          ctx.fillRect(box[0], box[1], 18, 18);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(label, box[0] + 5, box[1] + 13);
        });
      });
    } catch (err) {}
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const coords = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
    
    // ...existing code...
    
    return coords;
  };

  const findSubboxAtPoint = (x, y) => {
    let subboxIndex = 0;
    for (const tooth of teeth) {
      for (const subbox of tooth.subboxes) {
        const box = subbox.bbox;
        const matches = x >= box[0] && x <= box[0] + box[2] && y >= box[1] && y <= box[1] + box[3];
        if (matches) {
          return { tooth, subbox };
        }
        subboxIndex++;
      }
    }
    return null;
  };

  const handleMouseMove = (e) => {
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    
    const result = findSubboxAtPoint(coords.x, coords.y);
    setHoveredSubbox(result?.subbox || null);
    
    // Change cursor
    e.target.style.cursor = result ? 'pointer' : 'default';
  };

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent closing lightbox
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    const result = findSubboxAtPoint(coords.x, coords.y);
    if (result && onSubboxClick) {
      onSubboxClick(result.subbox, result.tooth);
    }
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 0,
        minWidth: 0,
        flex: 1
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredSubbox(null)}
        onClick={handleClick}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          borderRadius: '8px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          cursor: 'pointer',
          border: '2px solid lime' // Debug: make canvas visible
        }}
      />
      
      {/* Debug info */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'lime',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'monospace',
        pointerEvents: 'none'
      }}>
        Canvas: {canvasRef.current ? `${canvasRef.current.width}x${canvasRef.current.height}` : 'Not mounted'} | 
        Image: {imageRef.current ? `${imageRef.current.width}x${imageRef.current.height}` : 'Not loaded'} | 
        Teeth: {teeth.length} | 
        Handler: {onSubboxClick ? 'OK' : 'Missing'}
      </div>
      
      {/* Tooltip */}
      {hoveredSubbox && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          <div style={{ fontWeight: '600', marginBottom: '6px' }}>
            Region: {hoveredSubbox.region}
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            Status: {
              hoveredSubbox.plaque_status === 1 ? '🟢 No plaque' :
              hoveredSubbox.plaque_status === 0 ? '🔴 Has plaque' :
              '🔴 Has plaque'
            }
          </div>
          {hoveredSubbox.annotated_by && (
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              By: {hoveredSubbox.annotated_by.name}
            </div>
          )}
          <div style={{ 
            marginTop: '8px', 
            paddingTop: '8px', 
            borderTop: '1px solid rgba(255,255,255,0.2)',
            fontSize: '11px',
            color: '#fbbf24'
          }}>
            Click to toggle
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationCanvas;
