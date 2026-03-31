"use client";

import React, { useRef, useEffect } from "react";

interface BonsaiCanvasProps {
  level: number;
  isGlowing: boolean;
}

export function BonsaiCanvas({ level, isGlowing }: BonsaiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Derived parameters based on level
    const maxDepth = Math.min(10, Math.floor(level / 4) + 2);
    const trunkLength = Math.min(70, 25 + level * 0.8);
    const branchReduction = 0.75 + (Math.min(10, level) / 100); 

    const drawBranch = (
      startX: number,
      startY: number,
      len: number,
      angle: number,
      branchWidth: number,
      depth: number
    ) => {
      // Calculate end point with a subtle sway
      const sway = Math.sin(time + depth * 0.5) * (0.05 * (maxDepth - depth));
      const endX = startX + Math.cos(angle + sway) * len;
      const endY = startY + Math.sin(angle + sway) * len;

      // Draw the branch
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      
      // Color: Darker/Thicker for trunk, lighter/thinner for branches
      const colorProgress = 1 - (depth / maxDepth);
      ctx.strokeStyle = `rgb(${74 + depth * 10}, ${55 + depth * 5}, ${40 + depth * 2})`;
      ctx.lineWidth = branchWidth;
      ctx.lineCap = "round";
      ctx.stroke();

      // If we're at the leaf depth, draw foliage
      if (depth <= 2) {
        drawFoliage(endX, endY, depth);
      }

      if (depth > 0) {
        // Create 2 or 3 branches based on level/depth
        const numBranches = level > 10 && depth === maxDepth ? 3 : 2;
        const spread = 0.5 + (Math.sin(time * 0.2) * 0.02);

        drawBranch(endX, endY, len * branchReduction, angle - spread, branchWidth * 0.7, depth - 1);
        drawBranch(endX, endY, len * branchReduction, angle + spread, branchWidth * 0.7, depth - 1);
        
        if (numBranches === 3) {
            drawBranch(endX, endY, len * (branchReduction * 0.8), angle, branchWidth * 0.7, depth - 1);
        }
      }
    };

    const drawFoliage = (x: number, y: number, depth: number) => {
        const leafSize = 4 + (depth * 2);
        const opacity = 0.6 + (Math.sin(time + x) * 0.1);
        
        // Leaf color: Emerald 500
        ctx.fillStyle = isGlowing 
            ? `rgba(34, 197, 94, ${opacity + 0.2})` 
            : `rgba(34, 197, 94, ${opacity})`;

        ctx.beginPath();
        ctx.arc(x, y, leafSize, 0, Math.PI * 2);
        ctx.fill();

        if (isGlowing) {
            // Add a "sparkle" or secondary bloom
            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(34, 197, 94, 0.5)";
        } else {
            ctx.shadowBlur = 0;
        }
    };

    const render = () => {
      time += 0.015;
      
      // Reset canvas for high-quality drawing
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, rect.width, rect.height);

      // Center horizontally, start from bottom
      const startX = rect.width / 2;
      const startY = rect.height - 40;

      // Draw the pot (minimalist)
      ctx.fillStyle = "#1e293b"; // Slate 800
      ctx.beginPath();
      ctx.roundRect(startX - 30, startY - 5, 60, 15, 4);
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Start the recursion
      // angle: -PI/2 is straight up
      drawBranch(startX, startY - 5, trunkLength, -Math.PI / 2, Math.max(2, 6 - (maxDepth / 2)), maxDepth);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [level, isGlowing]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: "100%", height: "100%", maxWidth: "300px", aspectRatio: "1/1" }}
      className="mx-auto"
    />
  );
}
