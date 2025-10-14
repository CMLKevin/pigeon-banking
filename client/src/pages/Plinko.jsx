import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { walletAPI } from '../services/api';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import api from '../services/api';

const Plinko = () => {
  const [wallet, setWallet] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [isDropping, setIsDropping] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Fixed: Low risk, 8 rows only
  const rows = 8;
  const risk = 'low';
  const multipliers = [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6];

  const ensureAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    return audioCtxRef.current;
  };

  const playPegSound = (frequency = 400) => {
    try {
      const ctx = ensureAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  };

  const playWinSound = (multiplier) => {
    try {
      const ctx = ensureAudioContext();
      const now = ctx.currentTime;
      const baseFreq = multiplier > 10 ? 880 : multiplier > 2 ? 660 : 523.25;
      const notes = [baseFreq, baseFreq * 1.26, baseFreq * 1.5];

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.0001, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.08 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch {}
  };

  const playLaunchSound = () => {
    try {
      const ctx = ensureAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  };

  // Define loadWallet and loadRecentGames as useCallback to avoid dependency issues
  const loadWallet = useCallback(async () => {
    try {
      const res = await walletAPI.getWallet();
      setWallet(res.data.wallet);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  }, []);

  const loadRecentGames = useCallback(async () => {
    try {
      const res = await api.get('/games/history', { params: { limit: 10 } });
      const filtered = (res.data.games || []).filter(g => g.game_type === 'plinko');
      setRecentGames(filtered);
    } catch (error) {
      console.error('Failed to load game history:', error);
    }
  }, []);

  const drawInitialBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    if (width === 0 || height === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Board configuration
    const pegRadius = 4;
    const rowCount = rows;
    const startY = 60;
    const rowSpacing = (height - startY - 100) / rowCount;
    const pegSpacing = 35;

    // Calculate and draw pegs
    const pegs = [];
    for (let row = 0; row < rowCount; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * pegSpacing;
      const startX = (width - rowWidth) / 2;
      for (let col = 0; col < pegsInRow; col++) {
        pegs.push({
          x: startX + col * pegSpacing,
          y: startY + row * rowSpacing
        });
      }
    }

    // Draw pegs
    pegs.forEach(peg => {
      // Peg shadow
      ctx.beginPath();
      ctx.arc(peg.x, peg.y + 1, pegRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();
      
      // Main peg
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, pegRadius, 0, Math.PI * 2);
      const pegGradient = ctx.createRadialGradient(peg.x - 1, peg.y - 1, 0, peg.x, peg.y, pegRadius);
      pegGradient.addColorStop(0, '#818cf8');
      pegGradient.addColorStop(1, '#6366f1');
      ctx.fillStyle = pegGradient;
      ctx.fill();
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Get current multipliers and draw slots
    const slotsCount = multipliers.length;
    const slotWidth = (width * 0.9) / slotsCount;
    const slotsStartX = (width - slotWidth * slotsCount) / 2;

    for (let i = 0; i < slotsCount; i++) {
      if (i >= multipliers.length) continue;
      
      const x = slotsStartX + i * slotWidth;
      const y = height - 60;
      const slotHeight = 50;
      
      const mult = multipliers[i];
      let color = '#10b981';
      if (mult < 1) color = '#ef4444';
      else if (mult > 10) color = '#f59e0b';
      else if (mult > 5) color = '#8b5cf6';

      // Slot background
      const slotGradient = ctx.createLinearGradient(x, y, x, y + slotHeight);
      slotGradient.addColorStop(0, color + '30');
      slotGradient.addColorStop(1, color + '20');
      ctx.fillStyle = slotGradient;
      ctx.fillRect(x, y, slotWidth - 2, slotHeight);
      
      // Border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, slotWidth - 2, slotHeight);

      // Multiplier text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mult + 'x', x + slotWidth / 2, y + slotHeight / 2);
    }
  }, [rows, risk]);

  const simulatePlinko = (landingSlot, onComplete) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cancel any previous animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Ensure canvas has proper dimensions
    if (width === 0 || height === 0) {
      console.error('Canvas has invalid dimensions');
      return;
    }
    
    // Validate landingSlot
    const maxSlot = multipliers.length - 1;
    if (landingSlot < 0 || landingSlot > maxSlot) {
      console.error(`Invalid landingSlot ${landingSlot}. Must be between 0 and ${maxSlot}`);
      landingSlot = Math.max(0, Math.min(landingSlot, maxSlot));
    }

    // Board configuration
    const pegRadius = 4;
    const ballRadius = 6;
    const rowCount = rows;
    const startY = 60;
    const rowSpacing = (height - startY - 100) / rowCount;
    const pegSpacing = 35;

    // Calculate pegs and organize by row
    const pegsByRow = [];
    for (let row = 0; row < rowCount; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * pegSpacing;
      const startX = (width - rowWidth) / 2;
      const rowPegs = [];
      for (let col = 0; col < pegsInRow; col++) {
        rowPegs.push({
          x: startX + col * pegSpacing,
          y: startY + row * rowSpacing,
          row: row,
          col: col
        });
      }
      pegsByRow.push(rowPegs);
    }

    // Flatten for drawing
    const pegs = pegsByRow.flat();

    // Calculate predetermined path based on landing slot
    const slotsCount = multipliers.length;
    const slotWidth = (width * 0.9) / slotsCount;
    const slotsStartX = (width - slotWidth * slotsCount) / 2;
    const targetSlotX = slotsStartX + landingSlot * slotWidth + slotWidth / 2;

    // Calculate path: determine which pegs to hit
    // Starting at column 1 (middle of 3-peg first row)
    // After N bounces, final position = startColumn + (number of right moves)
    // So: landingSlot = 1 + numberOfRights
    const path = [];
    const startColumn = 1;
    const numberOfRights = Math.max(0, Math.min(landingSlot - startColumn, rowCount));
    
    // Create path array: true = go right, false = stay/go left
    for (let i = 0; i < numberOfRights; i++) path.push(true);
    for (let i = 0; i < rowCount - numberOfRights; i++) path.push(false);
    
    // Shuffle to make it look random while maintaining exact count
    for (let i = path.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [path[i], path[j]] = [path[j], path[i]];
    }
    
    // Debug logging
    console.log(`Plinko: landingSlot=${landingSlot}, rows=${rowCount}, rights=${numberOfRights}, path length=${path.length}`);

    // Ball state
    const ball = {
      x: width / 2,
      y: 20,
      vx: 0,
      vy: 2,
      targetPeg: null,
      bouncing: false
    };

    let currentPathIndex = 0;
    let currentColumn = 1; // Start at column 1 (middle of first row which is [0,1,2])
    const gravity = 0.5;
    const maxSpeed = 10;
    let hasCalledComplete = false; // Flag to ensure callback fires only once

    const animate = () => {
      // Clear with anti-aliasing
      ctx.clearRect(0, 0, width, height);
      
      // Enable anti-aliasing for smoother graphics
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw pegs with better styling
      pegs.forEach(peg => {
        // Peg shadow
        ctx.beginPath();
        ctx.arc(peg.x, peg.y + 1, pegRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        // Main peg
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pegRadius, 0, Math.PI * 2);
        const pegGradient = ctx.createRadialGradient(peg.x - 1, peg.y - 1, 0, peg.x, peg.y, pegRadius);
        pegGradient.addColorStop(0, '#818cf8');
        pegGradient.addColorStop(1, '#6366f1');
        ctx.fillStyle = pegGradient;
        ctx.fill();
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw multiplier slots with better visuals
      for (let i = 0; i < slotsCount; i++) {
        // Safety check - skip if multiplier doesn't exist
        if (i >= multipliers.length) {
          console.warn(`Slot ${i} exceeds multipliers array length ${multipliers.length}`);
          continue;
        }
        const x = slotsStartX + i * slotWidth;
        const y = height - 60;
        const slotHeight = 50;
        
        const mult = multipliers[i];
        let color = '#10b981';
        if (mult < 1) color = '#ef4444';
        else if (mult > 10) color = '#f59e0b';
        else if (mult > 5) color = '#8b5cf6';

        const isTarget = i === landingSlot;
        
        // Draw slot background with gradient
        const slotGradient = ctx.createLinearGradient(x, y, x, y + slotHeight);
        slotGradient.addColorStop(0, isTarget ? color + 'dd' : color + '30');
        slotGradient.addColorStop(1, isTarget ? color + 'aa' : color + '20');
        ctx.fillStyle = slotGradient;
        ctx.fillRect(x, y, slotWidth - 2, slotHeight);
        
        // Draw border
        ctx.strokeStyle = color;
        ctx.lineWidth = isTarget ? 3 : 1.5;
        ctx.strokeRect(x, y, slotWidth - 2, slotHeight);
        
        // Add glow effect for target slot
        if (isTarget) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = color;
          ctx.strokeRect(x, y, slotWidth - 2, slotHeight);
          ctx.shadowBlur = 0;
        }

        // Draw multiplier text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(mult + 'x', x + slotWidth / 2, y + slotHeight / 2);
      }

      // Deterministic ball movement
      if (currentPathIndex < rowCount) {
        const pegRow = pegsByRow[currentPathIndex];
        
        // Ensure column is valid
        if (currentColumn < 0 || currentColumn >= pegRow.length) {
          currentColumn = Math.max(0, Math.min(currentColumn, pegRow.length - 1));
        }
        
        const targetPeg = pegRow[currentColumn];
        
        if (!ball.targetPeg) {
          ball.targetPeg = targetPeg;
          ball.bouncing = false;
        }
        
        if (!ball.bouncing) {
          // Falling phase - move toward peg
          const dx = ball.targetPeg.x - ball.x;
          const dy = ball.targetPeg.y - ball.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 3) {
            // Apply gravity and move
            ball.vy += gravity;
            ball.vy = Math.min(ball.vy, maxSpeed);
            
            // Direct movement towards peg
            const moveSpeed = Math.min(ball.vy, distance / 2);
            ball.x += (dx / distance) * moveSpeed;
            ball.y += moveSpeed;
          } else {
            // Hit the peg - bounce
            playPegSound(400 + currentPathIndex * 50);
            ball.bouncing = true;
            
            // Determine next column based on path
            const goRight = path[currentPathIndex];
            if (goRight) {
              currentColumn++;
            }
            // If goLeft, column stays same
            
            // Set bounce velocity
            const bounceDir = goRight ? 1 : -1;
            ball.vx = bounceDir * 3;
            ball.vy = 2;
            
            currentPathIndex++;
            ball.targetPeg = null;
          }
        } else {
          // Bouncing phase
          ball.vx *= 0.92;
          ball.vy += gravity;
          ball.x += ball.vx;
          ball.y += ball.vy;
          
          // Stop bouncing when velocity is low
          if (Math.abs(ball.vx) < 0.3 && ball.vy > 0) {
            ball.bouncing = false;
            ball.vx = 0;
            ball.vy = 2;
          }
        }
      } else {
        // After all pegs, fall to slot
        ball.vy += gravity;
        ball.vy = Math.min(ball.vy, maxSpeed);
        ball.y += ball.vy;
        
        // Guide horizontally to target
        const dx = targetSlotX - ball.x;
        if (Math.abs(dx) > 0.5) {
          ball.x += dx * 0.2;
        } else {
          ball.x = targetSlotX;
        }
      }

      // Draw ball shadow
      ctx.beginPath();
      ctx.arc(ball.x + 1, ball.y + 2, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();
      
      // Draw ball with gradient
      const ballGradient = ctx.createRadialGradient(
        ball.x - ballRadius * 0.3, 
        ball.y - ballRadius * 0.3, 
        0, 
        ball.x, 
        ball.y, 
        ballRadius
      );
      ballGradient.addColorStop(0, '#fef3c7');
      ballGradient.addColorStop(0.4, '#fbbf24');
      ballGradient.addColorStop(1, '#f59e0b');
      
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = ballGradient;
      ctx.fill();
      
      // Ball outline
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Ball highlight
      ctx.beginPath();
      ctx.arc(ball.x - ballRadius * 0.3, ball.y - ballRadius * 0.3, ballRadius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();

      // Check if ball reached bottom
      if (ball.y > height - 70) {
        // Call onComplete callback when ball lands
        if (!hasCalledComplete && onComplete && typeof onComplete === 'function') {
          hasCalledComplete = true;
          onComplete();
        }
        
        // Ensure ball is centered in the correct slot
        ball.x = targetSlotX;
        ball.y = height - 35;
        
        ctx.clearRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Final draw - pegs with improved styling
        pegs.forEach(peg => {
          // Peg shadow
          ctx.beginPath();
          ctx.arc(peg.x, peg.y + 1, pegRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fill();
          
          // Main peg
          ctx.beginPath();
          ctx.arc(peg.x, peg.y, pegRadius, 0, Math.PI * 2);
          const pegGradient = ctx.createRadialGradient(peg.x - 1, peg.y - 1, 0, peg.x, peg.y, pegRadius);
          pegGradient.addColorStop(0, '#818cf8');
          pegGradient.addColorStop(1, '#6366f1');
          ctx.fillStyle = pegGradient;
          ctx.fill();
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        // Final draw - highlight winning slot
        for (let i = 0; i < slotsCount; i++) {
          // Safety check
          if (i >= multipliers.length) continue;
          
          const x = slotsStartX + i * slotWidth;
          const y = height - 60;
          const slotHeight = 50;
          
          const mult = multipliers[i];
          let color = '#10b981';
          if (mult < 1) color = '#ef4444';
          else if (mult > 10) color = '#f59e0b';
          else if (mult > 5) color = '#8b5cf6';

          const isTarget = i === landingSlot;
          
          // Slot background
          const slotGradient = ctx.createLinearGradient(x, y, x, y + slotHeight);
          slotGradient.addColorStop(0, isTarget ? color + 'ff' : color + '30');
          slotGradient.addColorStop(1, isTarget ? color + 'cc' : color + '20');
          ctx.fillStyle = slotGradient;
          ctx.fillRect(x, y, slotWidth - 2, slotHeight);
          
          // Border with glow for winning slot
          ctx.strokeStyle = color;
          ctx.lineWidth = isTarget ? 4 : 1.5;
          if (isTarget) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
          }
          ctx.strokeRect(x, y, slotWidth - 2, slotHeight);
          ctx.shadowBlur = 0;

          // Multiplier text
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(mult + 'x', x + slotWidth / 2, y + slotHeight / 2);
        }
        
        // Draw final ball position with shadow and highlight
        ctx.beginPath();
        ctx.arc(ball.x + 1, ball.y + 2, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
        
        const finalBallGradient = ctx.createRadialGradient(
          ball.x - ballRadius * 0.3, 
          ball.y - ballRadius * 0.3, 
          0, 
          ball.x, 
          ball.y, 
          ballRadius
        );
        finalBallGradient.addColorStop(0, '#fef3c7');
        finalBallGradient.addColorStop(0.4, '#fbbf24');
        finalBallGradient.addColorStop(1, '#f59e0b');
        
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = finalBallGradient;
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Ball highlight
        ctx.beginPath();
        ctx.arc(ball.x - ballRadius * 0.3, ball.y - ballRadius * 0.3, ballRadius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  // Load wallet and recent games on mount
  useEffect(() => {
    loadWallet();
    loadRecentGames();
    
    // Cleanup animation on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loadWallet, loadRecentGames]);

  // Draw initial board when canvas is ready (but not during/after animation)
  useEffect(() => {
    // Don't redraw if dropping or if there's a game result showing
    if (isDropping || gameResult) return;
    
    const timer = setTimeout(() => {
      drawInitialBoard();
    }, 100); // Small delay to ensure canvas is rendered
    
    return () => clearTimeout(timer);
  }, [drawInitialBoard, isDropping, gameResult]);

  const handleDrop = async (e) => {
    e.preventDefault();

    if (!betAmount || parseFloat(betAmount) <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(betAmount) > wallet?.stoneworks_dollar) {
      alert('Insufficient Game Chips balance');
      return;
    }

    setIsDropping(true);
    setGameResult(null);

    try {
      const res = await api.post('/games/plinko', {
        betAmount: parseFloat(betAmount)
      });

      // Play launch sound when ball is released
      playLaunchSound();

      // Simulate the drop with the landing slot from server
      // Pass callback to sync result display with ball landing
      simulatePlinko(res.data.landingSlot, () => {
        // This callback fires when the ball actually lands in the slot
        playWinSound(res.data.multiplier);
        setGameResult(res.data);
        setIsDropping(false);
        loadWallet();
        loadRecentGames();
      });
    } catch (error) {
      setIsDropping(false);
      console.error('Plinko error:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to play game';
      alert(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent mb-3">Plinko</h1>
          <p className="text-phantom-text-secondary text-lg">Drop the ball and watch it bounce to multipliers!</p>
        </div>

        {/* Game Chips Balance */}
        <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Available Game Chips</p>
              <h2 className="text-3xl font-bold tracking-tight">
                {getCurrencySymbol('stoneworks_dollar')} {formatCurrency(wallet?.stoneworks_dollar || 0)}
              </h2>
            </div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white/90" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <circle cx="12" cy="7" r="1" fill="currentColor"/>
                <circle cx="12" cy="17" r="1" fill="currentColor"/>
                <circle cx="7" cy="12" r="1" fill="currentColor"/>
                <circle cx="17" cy="12" r="1" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-2 bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={600}
              className="w-full max-w-[600px] mx-auto bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl border-2 border-phantom-border shadow-inner"
              style={{ aspectRatio: '1/1', display: 'block' }}
            />
            
            {/* Result Display */}
            {gameResult && (
              <div className={`mt-6 p-6 rounded-2xl border-2 ${
                gameResult.multiplier >= 1 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="text-center">
                  <p className="text-sm text-phantom-text-secondary mb-1">Multiplier</p>
                  <p className={`text-4xl font-bold mb-3 ${
                    gameResult.multiplier >= 1 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {gameResult.multiplier}x
                  </p>
                  <p className={`text-2xl font-bold mb-2 ${
                    gameResult.amountChange >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {gameResult.amountChange >= 0 ? '+' : ''}{getCurrencySymbol('stoneworks_dollar')} {formatCurrency(Math.abs(gameResult.amountChange))}
                  </p>
                  <p className="text-sm text-phantom-text-secondary">
                    New Balance: {getCurrencySymbol('stoneworks_dollar')} {formatCurrency(gameResult.newBalance)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Betting Form */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
              <h3 className="text-xl font-bold text-phantom-text-primary mb-4">Game Settings</h3>
              
              <form onSubmit={handleDrop} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-phantom-text-primary mb-2">
                    Bet Amount
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={isDropping}
                    placeholder="Enter amount..."
                    className="w-full px-4 py-3 bg-phantom-bg-tertiary border-2 border-phantom-border rounded-2xl text-phantom-text-primary placeholder-phantom-text-tertiary focus:border-phantom-accent-primary focus:ring-0 transition-colors disabled:opacity-50"
                    step="0.01"
                    min="0.01"
                  />
                  <div className="mt-2 flex gap-2">
                    {[1, 5, 10, 50].map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setBetAmount(amount.toString())}
                        disabled={isDropping}
                        className="flex-1 px-2 py-1 text-sm bg-phantom-bg-tertiary border border-phantom-border rounded-lg text-phantom-text-secondary hover:border-phantom-accent-primary hover:text-phantom-text-primary transition-all disabled:opacity-50"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-phantom-bg-tertiary/50 rounded-xl border border-phantom-border">
                  <p className="text-sm text-phantom-text-secondary">
                    <span className="font-semibold text-phantom-text-primary">Fixed Settings:</span> Low Risk, 8 Rows
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isDropping || !betAmount}
                  className="w-full py-4 bg-gradient-phantom text-white font-bold rounded-2xl hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDropping ? 'Dropping...' : 'Drop Ball'}
                </button>
              </form>
            </div>

            {/* Info Card */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
              <h3 className="text-xl font-bold text-phantom-text-primary mb-4">📊 Game Info</h3>
              <div className="space-y-2 text-sm text-phantom-text-secondary">
                <div className="flex justify-between">
                  <span>House Edge:</span>
                  <span className="text-phantom-text-primary font-semibold">5%</span>
                </div>
                <div className="flex justify-between">
                  <span>RTP:</span>
                  <span className="text-phantom-text-primary font-semibold">95%</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Multiplier:</span>
                  <span className="text-phantom-text-primary font-semibold">5.6x</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
          <h2 className="text-2xl font-bold text-phantom-text-primary mb-6 flex items-center gap-3">
            <svg className="w-7 h-7 text-phantom-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Games
          </h2>
          
          {recentGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-phantom-text-secondary">No games played yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentGames.slice(0, 10).map((game, index) => {
                // Safely parse game data with fallback
                let gameData = {};
                try {
                  if (game.choice && typeof game.choice === 'string') {
                    gameData = JSON.parse(game.choice);
                  } else if (game.choice && typeof game.choice === 'object') {
                    // Already parsed (some databases return JSONB as objects)
                    gameData = game.choice;
                  }
                } catch (error) {
                  console.error('Failed to parse game choice:', error, game.choice);
                  gameData = {};
                }
                
                // Safely parse numeric values with fallbacks
                const multiplier = parseFloat(game.result) || 0;
                const betAmount = parseFloat(game.bet_amount) || 0;
                const isWin = game.won === true || game.won === 1 || game.won === 'true';
                const profit = betAmount * (multiplier - 1);
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-phantom-bg-tertiary/50 rounded-2xl border border-phantom-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        multiplier >= 1 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {Number(multiplier || 0).toFixed(1)}x
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-phantom-text-primary">
                          {gameData.rows || 8} rows • {(gameData.risk || 'low').toUpperCase()}
                        </p>
                        <p className="text-xs text-phantom-text-tertiary">
                          {new Date(game.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        isWin ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {isWin ? '+' : ''}{getCurrencySymbol('stoneworks_dollar')} {formatCurrency(Math.abs(profit))}
                      </p>
                      <p className="text-xs text-phantom-text-tertiary">
                        Bet: {getCurrencySymbol('stoneworks_dollar')} {formatCurrency(betAmount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Plinko;
