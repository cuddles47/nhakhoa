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

    // Compute scale from original image coordinates to display coordinates
    const scaleX = (imageWidth && imageWidth > 0) ? canvas.width / imageWidth : 1;
    const scaleY = (imageHeight && imageHeight > 0) ? canvas.height / imageHeight : 1;

    // Draw annotations
    try {
      teeth.forEach((tooth) => {
        // Draw tooth bounding box (parent)
        const toothBox = tooth.bbox;
        if (!Array.isArray(toothBox)) return;
        if (toothBox.length !== 4) return;
        const invalidElements = toothBox.filter((v) => typeof v !== 'number');
        if (invalidElements.length > 0) return;
        const tx = toothBox[0] * scaleX, ty = toothBox[1] * scaleY;
        const tw = toothBox[2] * scaleX, th = toothBox[3] * scaleY;
        ctx.strokeStyle = '#10b981'; // Green for tooth
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, tw, th);
        // Draw label
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.fillRect(tx, ty - 20, 60, 20);
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Tooth ${tooth.category_name}`, tx + 5, ty - 6);
        // Draw subboxes
        if (!tooth.subboxes || !Array.isArray(tooth.subboxes)) return;
        tooth.subboxes.forEach((subbox) => {
          const box = subbox.bbox;
          if (!Array.isArray(box) || box.length !== 4) return;
          const isHovered = hoveredSubbox?.subbox_id === subbox.subbox_id;
          const sx = box[0] * scaleX, sy = box[1] * scaleY;
          const sw = box[2] * scaleX, sh = box[3] * scaleY;
          // Determine color based on plaque status (always 0 or 1 after processing)
          let fillColor, strokeColor;
          if (subbox.plaque_status === 1) {
            fillColor = 'rgba(239, 68, 68, 0.4)'; // Red - has plaque
            strokeColor = '#ef4444';
          } else {
            fillColor = 'rgba(16, 185, 129, 0.4)'; // Green - no plaque (default 0)
            strokeColor = '#10b981';
          }
          // Fill subbox
          ctx.fillStyle = fillColor;
          ctx.fillRect(sx, sy, sw, sh);
          // Stroke subbox
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = isHovered ? 4 : 2;
          ctx.strokeRect(sx, sy, sw, sh);
          // If hovered, add highlight
          if (isHovered) {
            ctx.strokeStyle = '#FFD700'; // Gold
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(sx, sy, sw, sh);
            ctx.setLineDash([]);
          }
          // Draw region label
          const label = subbox.region.charAt(0).toUpperCase();
          ctx.fillStyle = strokeColor;
          ctx.fillRect(sx, sy, 18, 18);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(label, sx + 5, sy + 13);
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
    
    
    return coords;
  };

  const findSubboxAtPoint = (x, y) => {
    const sx = (imageWidth && imageWidth > 0) ? (canvasRef.current?.width || 1) / imageWidth : 1;
    const sy = (imageHeight && imageHeight > 0) ? (canvasRef.current?.height || 1) / imageHeight : 1;
    for (const tooth of teeth) {
      if (!tooth.subboxes) continue;
      for (const subbox of tooth.subboxes) {
        const box = subbox.bbox;
        if (!Array.isArray(box) || box.length !== 4) continue;
        const bx = box[0] * sx, by = box[1] * sy;
        const bw = box[2] * sx, bh = box[3] * sy;
        const matches = x >= bx && x <= bx + bw && y >= by && y <= by + bh;
        if (matches) {
          return { tooth, subbox };
        }
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
      
      {/* Debug info - stays fixed, doesn't rotate with canvas */}
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
        pointerEvents: 'none',
        zIndex: 1000
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
            Status: {hoveredSubbox.plaque_status === 1 ? '🔴 Has plaque' : '🟢 No plaque'}
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
