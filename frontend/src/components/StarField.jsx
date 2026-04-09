import React, { useEffect, useRef } from 'react';

const StarField = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    canvas.width = width;
    canvas.height = height;

    const stars = [];
    const numStars = 200;

    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5,
            vx: Math.floor(Math.random() * 50) - 25,
            vy: Math.floor(Math.random() * 50) - 25
        });
    }

    let animationFrameId;

    const render = () => {
        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);
        
        ctx.globalCompositeOperation = 'lighter';
        
        stars.forEach(star => {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
            ctx.fill();

            star.x += star.vx / 60;
            star.y += star.vy / 60;

            if (star.x < 0 || star.x > width) star.vx = -star.vx;
            if (star.y < 0 || star.y > height) star.vy = -star.vy;
        });

        animationFrameId = window.requestAnimationFrame(render);
    };
    
    render();

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

export default StarField;
