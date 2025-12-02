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
  
  const damping = 0.96; // Wave decay
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const init = () => {
      // Lower resolution for performance and "soft" water look
      // We process at a smaller scale then scale up via CSS to keep it fast
      const processScale = 0.5; 
      
      const w = Math.floor(container.clientWidth * processScale);
      const h = Math.floor(container.clientHeight * processScale);

      if (w <= 0 || h <= 0) return;

      canvas.width = w;
      canvas.height = h;
      widthRef.current = w;
      heightRef.current = h;

      const size = w * h;
      // Only re-allocate if size changed to avoid GC thrashing, 
      // but strictly necessary for resize logic.
      if (buffer1Ref.current.length !== size) {
          buffer1Ref.current = new Int16Array(size);
          buffer2Ref.current = new Int16Array(size);
      }
    };

    const process = () => {
      const w = widthRef.current;
      const h = heightRef.current;

      // Guard against 0 dimensions (e.g. before layout)
      if (w <= 0 || h <= 0) {
        animationFrameRef.current = requestAnimationFrame(process);
        return;
      }
      
      const buffer1 = buffer1Ref.current;
      const buffer2 = buffer2Ref.current;
      
      // Ensure buffers match current dimensions (safety check)
      if (buffer1.length !== w * h || buffer2.length !== w * h) {
          init(); // Attempt to re-init if mismatch
          animationFrameRef.current = requestAnimationFrame(process);
          return;
      }

      // Wave propagation algorithm
      // For each pixel, new height is average of neighbors minus current height (velocity)
      // Optimized loop: avoid edge checking inside loop by iterating from w to size-w
      const size = w * h;
      for (let i = w; i < size - w; i++) {
        buffer2[i] = (
          (buffer1[i - 1] +
           buffer1[i + 1] +
           buffer1[i - w] +
           buffer1[i + w]) >> 1
        ) - buffer2[i];
        
        buffer2[i] -= (buffer2[i] >> 5); // Damping
      }

      // Swap buffers
      const temp = buffer1Ref.current;
      buffer1Ref.current = buffer2Ref.current;
      buffer2Ref.current = temp;

      // Render to canvas
      // Guard createImageView against 0
      try {
          const imgData = ctx.createImageData(w, h);
          const data = imgData.data;
          const buffer = buffer1Ref.current; // The active buffer to draw

          for (let i = 0; i < size; i++) {
            let wave = buffer[i];
            
            // Background color is #fafafa (250, 250, 250)
            let r = 250;
            let g = 250;
            let b = 250;

            if (wave !== 0) {
              const intensity = wave; 
              // Shadow
              r = Math.max(0, 250 - intensity);
              g = Math.max(0, 250 - intensity);
              b = Math.max(0, 250 - intensity);
            }

            data[i * 4 + 0] = r;
            data[i * 4 + 1] = g;
            data[i * 4 + 2] = b;
            data[i * 4 + 3] = 255; // Alpha
          }

          ctx.putImageData(imgData, 0, 0);
      } catch (e) {
          // Ignore transient resize errors
      }
      
      animationFrameRef.current = requestAnimationFrame(process);
    };

    init();
    process();

    const handleResize = () => {
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      // If canvas is not sized yet, ignore
      if (widthRef.current <= 0) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      
      const w = widthRef.current;
      const h = heightRef.current;
      
      const radius = 3;
      const strength = 500; 

      for (let j = y - radius; j < y + radius; j++) {
        for (let k = x - radius; k < x + radius; k++) {
          if (j >= 0 && j < h && k >= 0 && k < w) {
            // Safety check for array bounds
            const index = j * w + k;
            if (index >= 0 && index < buffer1Ref.current.length) {
                buffer1Ref.current[index] = strength;
            }
          }
        }
      }
    };
    
    // Attach listener to window or a larger container if needed, 
    // but attaching to canvas works if pointer-events allow.
    // Ensure we clean up correctly.
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-auto mix-blend-multiply opacity-60">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default WaterRippleEffect;