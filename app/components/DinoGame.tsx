'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface DinoGameProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
  onScoreUpdate?: (score: number) => void;
}

export default function DinoGame({ onGameOver, isPlaying, onScoreUpdate }: DinoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  
  const gameState = useRef({
    dino: { x: 50, y: 120, vy: 0, width: 40, height: 48, jumping: false, frame: 0, runFrame: 0 },
    obstacles: [] as { x: number; width: number; height: number; type: number }[],
    clouds: [] as { x: number; y: number; size: number; speed: number }[],
    mountains: [] as { x: number; height: number; width: number }[],
    ground: [] as { x: number; type: number }[],
    coins: [] as { x: number; y: number; collected: boolean; frame: number }[],
    birds: [] as { x: number; y: number; frame: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    speed: 5,
    gravity: 0.7,
    jumpForce: -14,
    groundY: 120,
    frameCount: 0,
    score: 0,
    coinCount: 0,
    gameRunning: false,
    milestone: 0,
    showMilestone: false,
    milestoneTimer: 0,
  });

  const jump = useCallback(() => {
    const state = gameState.current;
    if (!state.dino.jumping && state.gameRunning) {
      state.dino.vy = state.jumpForce;
      state.dino.jumping = true;
      // Jump particles
      for (let i = 0; i < 6; i++) {
        state.particles.push({
          x: state.dino.x + 20,
          y: state.dino.y + 48,
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * -2,
          life: 15,
          color: '#0052FF'
        });
      }
    }
  }, []);

  // Detailed T-Rex sprite
  const drawDino = (ctx: CanvasRenderingContext2D, x: number, y: number, runFrame: number, jumping: boolean) => {
    const p = 2.5;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 82, 255, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x + 20, 170, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body color
    ctx.fillStyle = '#0052FF';
    
    const dinoStand = [
      '        111111    ',
      '       11111111   ',
      '       11011111   ',
      '       11111111   ',
      '       1111111    ',
      '       11111      ',
      '   1   111111     ',
      '   1  1111111111  ',
      '  11  11111111    ',
      '  11111111111     ',
      ' 1111111111111    ',
      ' 111111111111     ',
      '11111111111       ',
      '1 11111111        ',
      '   1111111        ',
      '    111111        ',
      '     1111         ',
      '     11 11        ',
      '     11  11       ',
      '    111  111      ',
    ];
    
    const dinoRun1 = [
      '        111111    ',
      '       11111111   ',
      '       11011111   ',
      '       11111111   ',
      '       1111111    ',
      '       11111      ',
      '   1   111111     ',
      '   1  1111111111  ',
      '  11  11111111    ',
      '  11111111111     ',
      ' 1111111111111    ',
      ' 111111111111     ',
      '11111111111       ',
      '1 11111111        ',
      '   1111111        ',
      '    111111        ',
      '     1111         ',
      '     11           ',
      '        11        ',
      '        111       ',
    ];
    
    const dinoRun2 = [
      '        111111    ',
      '       11111111   ',
      '       11011111   ',
      '       11111111   ',
      '       1111111    ',
      '       11111      ',
      '   1   111111     ',
      '   1  1111111111  ',
      '  11  11111111    ',
      '  11111111111     ',
      ' 1111111111111    ',
      ' 111111111111     ',
      '11111111111       ',
      '1 11111111        ',
      '   1111111        ',
      '    111111        ',
      '     1111         ',
      '        11        ',
      '     11           ',
      '     111          ',
    ];

    let sprite = dinoStand;
    if (!jumping) {
      sprite = runFrame % 10 < 5 ? dinoRun1 : dinoRun2;
    }
    
    sprite.forEach((row, py) => {
      row.split('').forEach((cell, px) => {
        if (cell === '1') {
          ctx.fillRect(x + px * p, y + py * p, p, p);
        }
      });
    });
    
    // Eye highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 9 * p, y + 2 * p, p * 0.5, p * 0.5);
  };

  // Detailed cactus
  const drawCactus = (ctx: CanvasRenderingContext2D, x: number, y: number, type: number) => {
    const p = 2.5;
    ctx.fillStyle = '#0052FF';
    
    const cactusSmall = [
      '   11   ',
      '   11   ',
      '   11   ',
      '1  11   ',
      '1  11  1',
      '1  11  1',
      '11 11  1',
      ' 1111 11',
      '  1111  ',
      '   11   ',
      '   11   ',
      '   11   ',
      '   11   ',
      '   11   ',
    ];
    
    const cactusLarge = [
      '   11       ',
      '   11   11  ',
      '   11   11  ',
      '1  11   11  ',
      '1  11   11 1',
      '1  11 1 11 1',
      '11 11 1 1111',
      ' 111111111  ',
      '  111111    ',
      '   1111     ',
      '   1111     ',
      '   1111     ',
      '   1111     ',
      '   1111     ',
      '   1111     ',
      '   1111     ',
    ];
    
    const sprite = type === 0 ? cactusSmall : cactusLarge;
    const offsetY = type === 0 ? 35 : 40;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 82, 255, 0.15)';
    ctx.beginPath();
    ctx.ellipse(x + 12, 172, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#0052FF';
    sprite.forEach((row, py) => {
      row.split('').forEach((cell, px) => {
        if (cell === '1') {
          ctx.fillRect(x + px * p, y + offsetY + py * p, p, p);
        }
      });
    });
  };

  // Flying bird
  const drawBird = (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) => {
    const p = 2.5;
    ctx.fillStyle = '#0052FF';
    
    const birdUp = [
      '  1    1  ',
      ' 11    11 ',
      '1111111111',
      '  111111  ',
      '   1111   ',
    ];
    
    const birdDown = [
      '   1111   ',
      '  111111  ',
      '1111111111',
      ' 11    11 ',
      '  1    1  ',
    ];
    
    const sprite = frame % 20 < 10 ? birdUp : birdDown;
    
    sprite.forEach((row, py) => {
      row.split('').forEach((cell, px) => {
        if (cell === '1') {
          ctx.fillRect(x + px * p, y + py * p, p, p);
        }
      });
    });
  };

  // Coin
  const drawCoin = (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) => {
    const bounce = Math.sin(frame * 0.2) * 3;
    
    // Glow
    ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x + 8, y + 8 + bounce, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Coin
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x + 8, y + 8 + bounce, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Shine
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(x + 5, y + 5 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  // Cloud
  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.fillStyle = 'rgba(0, 82, 255, 0.08)';
    const s = size * 8;
    ctx.beginPath();
    ctx.arc(x + s, y + s, s, 0, Math.PI * 2);
    ctx.arc(x + s * 2, y + s * 0.7, s * 1.2, 0, Math.PI * 2);
    ctx.arc(x + s * 3, y + s, s, 0, Math.PI * 2);
    ctx.fill();
  };

  // Mountain
  const drawMountain = (ctx: CanvasRenderingContext2D, x: number, height: number, width: number) => {
    ctx.fillStyle = 'rgba(0, 82, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(x, 170);
    ctx.lineTo(x + width / 2, 170 - height);
    ctx.lineTo(x + width, 170);
    ctx.closePath();
    ctx.fill();
  };

  // Sun
  const drawSun = (ctx: CanvasRenderingContext2D) => {
    const x = 350;
    const y = 35;
    
    // Glow
    ctx.fillStyle = 'rgba(255, 200, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Sun
    ctx.fillStyle = 'rgba(255, 200, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
  };

  // Milestone animation
  const drawMilestone = (ctx: CanvasRenderingContext2D, score: number, timer: number) => {
    const alpha = timer > 30 ? 1 : timer / 30;
    const scale = timer > 30 ? 1 : 0.5 + (timer / 30) * 0.5;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${24 * scale}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`🎉 ${score} POINTS! 🎉`, 200, 100);
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameState.current;
    
    if (isPlaying) {
      // Reset game
      state.dino = { x: 50, y: 120, vy: 0, width: 40, height: 48, jumping: false, frame: 0, runFrame: 0 };
      state.obstacles = [];
      state.clouds = [
        { x: 50, y: 20, size: 1.2, speed: 0.3 },
        { x: 180, y: 35, size: 0.8, speed: 0.2 },
        { x: 300, y: 15, size: 1, speed: 0.25 },
      ];
      state.mountains = [
        { x: 0, height: 60, width: 120 },
        { x: 150, height: 80, width: 150 },
        { x: 320, height: 50, width: 100 },
      ];
      state.ground = [];
      for (let i = 0; i < 50; i++) {
        state.ground.push({ x: i * 12, type: Math.random() > 0.7 ? 1 : 0 });
      }
      state.coins = [];
      state.birds = [];
      state.particles = [];
      state.speed = 5;
      state.frameCount = 0;
      state.score = 0;
      state.coinCount = 0;
      state.gameRunning = true;
      state.milestone = 0;
      state.showMilestone = false;
      setScore(0);
      setCoins(0);
    } else {
      state.gameRunning = false;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    const handleTouch = (e: Event) => {
      e.preventDefault();
      jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('click', handleTouch);

    let animationId: number;

    const gameLoop = () => {
      if (!state.gameRunning) return;

      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.6, '#F0F7FF');
      gradient.addColorStop(1, '#E0EFFF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sun
      drawSun(ctx);

      // Mountains (parallax - slow)
      state.mountains.forEach(m => {
        m.x -= state.speed * 0.1;
        if (m.x < -m.width) {
          m.x = canvas.width + Math.random() * 100;
          m.height = 40 + Math.random() * 50;
          m.width = 80 + Math.random() * 80;
        }
        drawMountain(ctx, m.x, m.height, m.width);
      });

      // Clouds (parallax - medium)
      state.clouds.forEach(cloud => {
        cloud.x -= state.speed * cloud.speed;
        if (cloud.x < -60) {
          cloud.x = canvas.width + 60;
          cloud.y = Math.random() * 40 + 10;
        }
        drawCloud(ctx, cloud.x, cloud.y, cloud.size);
      });

      // Ground
      ctx.fillStyle = 'rgba(0, 82, 255, 0.1)';
      ctx.fillRect(0, 170, canvas.width, 30);
      
      // Ground line
      ctx.fillStyle = '#0052FF';
      ctx.fillRect(0, 170, canvas.width, 2);
      
      // Ground details
      state.ground.forEach(g => {
        g.x -= state.speed;
        if (g.x < -12) {
          g.x = canvas.width;
          g.type = Math.random() > 0.7 ? 1 : 0;
        }
        if (g.type === 1) {
          ctx.fillStyle = 'rgba(0, 82, 255, 0.3)';
          ctx.fillRect(g.x, 175, 3, 3);
        }
      });

      // Update dino
      state.dino.vy += state.gravity;
      state.dino.y += state.dino.vy;
      state.dino.runFrame++;

      if (state.dino.y >= state.groundY) {
        state.dino.y = state.groundY;
        state.dino.vy = 0;
        state.dino.jumping = false;
      }

      // Draw dino
      drawDino(ctx, state.dino.x, state.dino.y, state.dino.runFrame, state.dino.jumping);

      // Spawn coins
      state.frameCount++;
      if (state.frameCount % 150 === 0 && Math.random() > 0.5) {
        state.coins.push({
          x: canvas.width,
          y: 80 + Math.random() * 40,
          collected: false,
          frame: 0
        });
      }

      // Spawn birds
      if (state.frameCount % 200 === 0 && state.score > 300 && Math.random() > 0.6) {
        state.birds.push({
          x: canvas.width,
          y: 60 + Math.random() * 50,
          frame: 0
        });
      }

      // Update coins
      state.coins = state.coins.filter(coin => {
        coin.x -= state.speed;
        coin.frame++;
        
        if (!coin.collected) {
          drawCoin(ctx, coin.x, coin.y, coin.frame);
          
          // Collect coin
          if (
            state.dino.x < coin.x + 16 &&
            state.dino.x + 40 > coin.x &&
            state.dino.y < coin.y + 16 &&
            state.dino.y + 48 > coin.y
          ) {
            coin.collected = true;
            state.coinCount++;
            setCoins(state.coinCount);
            // Coin particles
            for (let i = 0; i < 8; i++) {
              state.particles.push({
                x: coin.x + 8,
                y: coin.y + 8,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 20,
                color: '#FFD700'
              });
            }
          }
        }
        
        return coin.x > -20;
      });

      // Update birds
      state.birds = state.birds.filter(bird => {
        bird.x -= state.speed * 1.5;
        bird.frame++;
        drawBird(ctx, bird.x, bird.y, bird.frame);
        
        // Collision
        if (
          state.dino.x + 10 < bird.x + 20 &&
          state.dino.x + 35 > bird.x &&
          state.dino.y + 5 < bird.y + 12 &&
          state.dino.y + 35 > bird.y
        ) {
          state.gameRunning = false;
          setTimeout(() => onGameOver(state.score), 300);
        }
        
        return bird.x > -30;
      });

      // Spawn obstacles
      if (state.frameCount % 90 === 0) {
        state.obstacles.push({
          x: canvas.width,
          width: 20,
          height: 35,
          type: Math.random() > 0.5 ? 1 : 0
        });
      }

      // Update obstacles
      state.obstacles = state.obstacles.filter((obs) => {
        obs.x -= state.speed;
        drawCactus(ctx, obs.x, 100, obs.type);

        const dinoBox = { x: state.dino.x + 8, y: state.dino.y + 5, w: 28, h: 43 };
        const obsBox = { x: obs.x + 5, y: obs.type === 0 ? 135 : 130, w: 15, h: obs.type === 0 ? 35 : 45 };

        if (
          dinoBox.x < obsBox.x + obsBox.w &&
          dinoBox.x + dinoBox.w > obsBox.x &&
          dinoBox.y + dinoBox.h > obsBox.y
        ) {
          state.gameRunning = false;
          for (let i = 0; i < 15; i++) {
            state.particles.push({
              x: state.dino.x + 20,
              y: state.dino.y + 25,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              life: 25,
              color: '#0052FF'
            });
          }
          setTimeout(() => onGameOver(state.score), 300);
          return false;
        }
        return obs.x > -30;
      });

      // Particles
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        ctx.fillStyle = p.color + Math.floor((p.life / 25) * 255).toString(16).padStart(2, '0');
        ctx.fillRect(p.x, p.y, 4, 4);
        return p.life > 0;
      });

      // Score
      state.score++;
      setScore(state.score);
      if (onScoreUpdate) onScoreUpdate(state.score);

      // Milestones
      if (state.score % 500 === 0 && state.score !== state.milestone) {
        state.milestone = state.score;
        state.showMilestone = true;
        state.milestoneTimer = 60;
      }
      
      if (state.showMilestone) {
        state.milestoneTimer--;
        drawMilestone(ctx, state.milestone, state.milestoneTimer);
        if (state.milestoneTimer <= 0) {
          state.showMilestone = false;
        }
      }

      // Speed up
      if (state.score % 500 === 0 && state.speed < 12) {
        state.speed += 0.3;
      }

      // HUD
      ctx.fillStyle = '#0052FF';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('SCORE', canvas.width - 75, 18);
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${state.score}`, canvas.width - 75, 38);
      
      // Coins HUD
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`🪙 ${state.coinCount}`, 15, 25);

      animationId = requestAnimationFrame(gameLoop);
    };

    if (isPlaying) {
      gameLoop();
    } else {
      // Static preview
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(1, '#E8F0FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      drawSun(ctx);
      drawMountain(ctx, 50, 60, 120);
      drawMountain(ctx, 200, 80, 150);
      drawCloud(ctx, 100, 25, 1);
      drawCloud(ctx, 280, 40, 0.8);
      
      ctx.fillStyle = 'rgba(0, 82, 255, 0.1)';
      ctx.fillRect(0, 170, canvas.width, 30);
      ctx.fillStyle = '#0052FF';
      ctx.fillRect(0, 170, canvas.width, 2);
      
      drawDino(ctx, 50, 120, 0, false);
      drawCactus(ctx, 300, 100, 0);
      
      // "Tap to Play" hint
      ctx.fillStyle = 'rgba(0, 82, 255, 0.6)';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TAP TO JUMP', 200, 100);
      ctx.textAlign = 'left';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('click', handleTouch);
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, jump, onGameOver, onScoreUpdate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        style={{
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0, 82, 255, 0.25)',
          border: '3px solid rgba(0, 82, 255, 0.2)'
        }}
      />
    </div>
  );
}