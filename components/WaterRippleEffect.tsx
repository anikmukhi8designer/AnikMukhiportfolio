import React, { useRef, useEffect } from 'react';

const WaterRippleEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Simulation State
  const widthRef = useRef(0);
  const heightRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  
  // Buffers for wave height
  const buffer1Ref = useRef<Int16Array>(new Int16Array(0));
  const buffer2Ref = useRef<Int16Array>(new Int16Array(0));
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const init = () => {
      // Lower resolution for performance and "soft" water look
      const processScale = 0.5; 
      
      const w = Math.floor(container.clientWidth * processScale);
      const h = Math.floor(container.clientHeight * processScale);

      if (w <= 0 || h <= 0) return;

      canvas.width = w;
      canvas.height = h;
      widthRef.current = w;
      heightRef.current = h;

      const size = w * h;
      if (buffer1Ref.current.length !== size) {
          buffer1Ref.current = new Int16Array(size);
          buffer2Ref.current = new Int16Array(size);
      }
    };

    const process = () => {
      const w = widthRef.current;
      const h = heightRef.current;

      if (w <= 0 || h <= 0) {
        animationFrameRef.current = requestAnimationFrame(process);
        return;
      }
      
      const buffer1 = buffer1Ref.current;
      const buffer2 = buffer2Ref.current;
      const size = w * h;

      if (buffer1.length !== size || buffer2.length !== size) {
          init();
          animationFrameRef.current = requestAnimationFrame(process);
          return;
      }

      // Wave propagation algorithm
      for (let i = w; i < size - w; i++) {
        const val = (
          (buffer1[i - 1] +
           buffer1[i + 1] +
           buffer1[i - w] +
           buffer1[i + w]) >> 1
        ) - buffer2[i];
        
        buffer2[i] = val - (val >> 5); // Damping ~0.968
      }

      // Swap buffers
      const temp = buffer1Ref.current;
      buffer1Ref.current = buffer2Ref.current;
      buffer2Ref.current = temp;

      // Render to canvas
      try {
          const imgData = ctx.createImageData(w, h);
          const data = imgData.data;
          const buffer = buffer1Ref.current; 

          for (let i = 0; i < size; i++) {
            const wave = buffer[i];
            
            // Base white (255) so it's transparent in Multiply mode
            let r = 255;
            let g = 255;
            let b = 255;

            if (wave !== 0) {
              // Create shadow from wave height
              // Clamped to avoid wrapping
              const intensity = Math.max(0, Math.min(255, wave));
              
              if (intensity > 0) {
                  // Subtract intensity to create shadow
                  // Less subtraction from Blue channel = Blue Tint
                  r = 255 - intensity;
                  g = 255 - intensity;
                  b = 255 - Math.floor(intensity * 0.8); 
              }
            }

            data[i * 4 + 0] = r;
            data[i * 4 + 1] = g;
            data[i * 4 + 2] = b;
            data[i * 4 + 3] = 255; // Alpha
          }

          ctx.putImageData(imgData, 0, 0);
      } catch (e) {
          // Ignore resize race conditions
      }
      
      animationFrameRef.current = requestAnimationFrame(process);
    };

    init();
    process();

    const handleResize = () => {
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (widthRef.current <= 0) return;

      const rect = canvas.getBoundingClientRect();
      
      // Check if mouse is within canvas bounds
      if (
          e.clientX < rect.left || 
          e.clientX > rect.right || 
          e.clientY < rect.top || 
          e.clientY > rect.bottom
      ) return;

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      
      const w = widthRef.current;
      const h = heightRef.current;
      
      const radius = 2; // Smaller radius for sharper ripples
      const strength = 600; // Amplitude

      for (let j = y - radius; j < y + radius; j++) {
        for (let k = x - radius; k < x + radius; k++) {
          if (j >= 0 && j < h && k >= 0 && k < w) {
            const index = j * w + k;
            if (index >= 0 && index < buffer1Ref.current.length) {
                // Add disturbance
                buffer1Ref.current[index] = strength;
            }
          }
        }
      }
    };
    
    // Attach to window to capture moves even over overlay text
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-none mix-blend-multiply opacity-80">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default WaterRippleEffect;