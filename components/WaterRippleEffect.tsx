import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface WaterRippleRef {
  trigger: (clientX: number, clientY: number) => void;
}

const WaterRippleEffect = forwardRef<WaterRippleRef>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Simulation State
  const widthRef = useRef(0);
  const heightRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  
  // Buffers for wave height
  const buffer1Ref = useRef<Int16Array>(new Int16Array(0));
  const buffer2Ref = useRef<Int16Array>(new Int16Array(0));

  // Expose trigger method to parent
  useImperativeHandle(ref, () => ({
    trigger: (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || widthRef.current <= 0) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = Math.floor((clientX - rect.left) * scaleX);
      const y = Math.floor((clientY - rect.top) * scaleY);
      
      const w = widthRef.current;
      const h = heightRef.current;
      
      const radius = 3; 
      const strength = 1000; // Increased strength for visibility

      for (let j = y - radius; j < y + radius; j++) {
        for (let k = x - radius; k < x + radius; k++) {
          if (j >= 0 && j < h && k >= 0 && k < w) {
            const index = j * w + k;
            if (index >= 0 && index < buffer1Ref.current.length) {
                buffer1Ref.current[index] = strength;
            }
          }
        }
      }
    }
  }));
  
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
        
        buffer2[i] = val - (val >> 5); // Damping
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
            
            // Base background is White (transparent in multiply, but we handle color mixing directly)
            let r = 255;
            let g = 255;
            let b = 255;

            if (wave > 0) {
              const intensity = Math.min(255, wave);
              
              if (intensity > 5) {
                  // Calculate gradient position (0 to 1) from left to right
                  const x = i % w;
                  const ratio = x / w;

                  // Gradient Colors:
                  // Start: Violet (#8b5cf6) -> RGB(139, 92, 246)
                  // End: Cyan (#06b6d4) -> RGB(6, 182, 212)
                  
                  const targetR = 139 + (6 - 139) * ratio;
                  const targetG = 92 + (182 - 92) * ratio;
                  const targetB = 246 + (212 - 246) * ratio;

                  // Blend White with Target Color based on wave intensity
                  // Higher intensity = more color
                  const alpha = intensity / 255;
                  
                  r = 255 * (1 - alpha) + targetR * alpha;
                  g = 255 * (1 - alpha) + targetG * alpha;
                  b = 255 * (1 - alpha) + targetB * alpha;
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

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-100">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
});

export default WaterRippleEffect;