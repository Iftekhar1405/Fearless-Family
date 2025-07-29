import { useEffect, useRef, useState } from 'react';

export const NotFoundComp = ({ isError = false }: { isError: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    // Responsive canvas dimensions
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 300 });
    const [scale, setScale] = useState(1);

    const GROUND_Y_RATIO = 0.77; // 230/300 from original
    const PLAYER_HEIGHT_RATIO = 0.133; // 40/300 from original
    const PLAYER_WIDTH_RATIO = 0.031; // 25/800 from original

    // Calculated values based on canvas size
    const GROUND_Y = canvasSize.height * GROUND_Y_RATIO;
    const PLAYER_HEIGHT = canvasSize.height * PLAYER_HEIGHT_RATIO;
    const PLAYER_WIDTH = canvasSize.width * PLAYER_WIDTH_RATIO;

    const player = useRef({
        x: canvasSize.width * 0.0625, // 50/800 from original
        y: GROUND_Y - PLAYER_HEIGHT,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        dy: 0,
        jumping: false,
        animFrame: 0,
    });

    const gravity = 0.8 * scale;
    const jumpPower = -12 * scale;
    const frame = useRef(0);
    const nextObstacleFrame = useRef(100);
    const gameSpeed = useRef(4 * scale);
    const backgroundOffset = useRef(0);

    const gameOverRef = useRef(false);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [highScore, setHighScore] = useState(0);
    const scoreRef = useRef(0);

    const particles = useRef<{ x: number, y: number, vx: number, vy: number, life: number, maxLife: number }[]>([]);
    const clouds = useRef<{ x: number, y: number, size: number, speed: number }[]>([]);
    const obstacles = useRef<{ x: number; y: number; width: number; height: number; type: 'snake' | 'cactus' }[]>([]);

    // Update canvas size based on container and device
    const updateCanvasSize = () => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const containerWidth = container.clientWidth - (window.innerWidth < 640 ? 16 : 32); // Less padding on mobile
        const isMobile = window.innerWidth < 640;

        // Mobile optimization: use more screen width, adjust aspect ratio
        const maxWidth = isMobile ?
            Math.min(containerWidth, window.innerWidth - 32) :
            Math.min(containerWidth, 800);

        // Slightly different aspect ratio for mobile to fit better
        const aspectRatio = isMobile ? 2.4 : 2.67; // 800/300 = 2.67, mobile uses 2.4

        const newWidth = maxWidth;
        const newHeight = newWidth / aspectRatio;
        const newScale = newWidth / 800;

        setCanvasSize({ width: newWidth, height: newHeight });
        setScale(newScale);
    };

    // Update player position when canvas size changes
    useEffect(() => {
        const newGroundY = canvasSize.height * GROUND_Y_RATIO;
        const newPlayerHeight = canvasSize.height * PLAYER_HEIGHT_RATIO;
        const newPlayerWidth = canvasSize.width * PLAYER_WIDTH_RATIO;

        player.current = {
            ...player.current,
            x: canvasSize.width * 0.0625,
            y: newGroundY - newPlayerHeight,
            width: newPlayerWidth,
            height: newPlayerHeight,
        };
    }, [canvasSize]);

    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.code === 'Space' || e.code === 'ArrowUp') && !player.current.jumping && !gameOverRef.current) {
            e.preventDefault();
            player.current.dy = jumpPower;
            player.current.jumping = true;
            addJumpParticles();
        }
        if (e.code === 'Space' && gameOverRef.current) {
            e.preventDefault();
            resetGame();
        }
    };

    // Touch/Click handler for mobile
    const handleCanvasTouch = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        if (!player.current.jumping && !gameOverRef.current) {
            player.current.dy = jumpPower;
            player.current.jumping = true;
            addJumpParticles();
        } else if (gameOverRef.current) {
            resetGame();
        }
    };

    const initClouds = () => {
        clouds.current = [];
        for (let i = 0; i < 6; i++) {
            clouds.current.push({
                x: Math.random() * canvasSize.width,
                y: Math.random() * (canvasSize.height * 0.27) + (canvasSize.height * 0.067),
                size: Math.random() * (canvasSize.width * 0.0375) + (canvasSize.width * 0.025),
                speed: (Math.random() * 0.3 + 0.1) * scale
            });
        }
    };

    const addJumpParticles = () => {
        for (let i = 0; i < 8; i++) {
            particles.current.push({
                x: player.current.x + player.current.width / 2,
                y: player.current.y + player.current.height,
                vx: (Math.random() - 0.5) * 4 * scale,
                vy: (Math.random() * -3 - 1) * scale,
                life: 30,
                maxLife: 30
            });
        }
    };

    const addCollisionParticles = (x: number, y: number) => {
        for (let i = 0; i < 15; i++) {
            particles.current.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8 * scale,
                vy: (Math.random() - 0.5) * 8 * scale,
                life: 40,
                maxLife: 40
            });
        }
    };

    const getRandomObstacleInterval = () => {
        return Math.floor(Math.random() * 80) + 50;
    };

    const getRandomObstacleType = (): 'snake' | 'cactus' => {
        return Math.random() > 0.6 ? 'cactus' : 'snake';
    };

    const resetGame = () => {
        gameOverRef.current = false;
        setGameOver(false);
        const newGroundY = canvasSize.height * GROUND_Y_RATIO;
        const newPlayerHeight = canvasSize.height * PLAYER_HEIGHT_RATIO;
        const newPlayerWidth = canvasSize.width * PLAYER_WIDTH_RATIO;

        player.current = {
            x: canvasSize.width * 0.0625,
            y: newGroundY - newPlayerHeight,
            width: newPlayerWidth,
            height: newPlayerHeight,
            dy: 0,
            jumping: false,
            animFrame: 0,
        };
        obstacles.current = [];
        particles.current = [];
        scoreRef.current = 0;
        setScore(0);
        frame.current = 0;
        gameSpeed.current = 4 * scale;
        backgroundOffset.current = 0;
        nextObstacleFrame.current = getRandomObstacleInterval();
        initClouds();
        animationRef.current = requestAnimationFrame(loop);
    };

    const drawHuman = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, animFrame: number) => {
        const headRadius = width * 0.3;
        const bodyHeight = height * 0.6;
        const legHeight = height * 0.3;
        const runOffset = Math.sin(animFrame * 0.3) * 2 * scale;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, GROUND_Y + 5 * scale, width * 0.6, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + headRadius, headRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(x + width * 0.1, y + headRadius * 0.3, width * 0.8, headRadius * 0.4);
        ctx.fillRect(x + width * 0.05, y + headRadius * 0.6, width * 0.9, headRadius * 0.2);

        ctx.fillStyle = '#000000';
        const eyeSize = Math.max(1, 2 * scale);
        ctx.fillRect(x + width * 0.35, y + headRadius * 0.8, eyeSize, eyeSize);
        ctx.fillRect(x + width * 0.55, y + headRadius * 0.8, eyeSize, eyeSize);
        ctx.fillRect(x + width * 0.4, y + headRadius * 1.2, width * 0.2, Math.max(1, scale));

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x + width * 0.25, y + headRadius * 2, width * 0.5, bodyHeight);

        const armSwing = Math.sin(animFrame * 0.4) * 0.2;
        ctx.save();
        ctx.translate(x + width * 0.1, y + headRadius * 2 + bodyHeight * 0.2);
        ctx.rotate(armSwing);
        ctx.fillRect(0, 0, width * 0.15, bodyHeight * 0.4);
        ctx.restore();

        ctx.save();
        ctx.translate(x + width * 0.75, y + headRadius * 2 + bodyHeight * 0.2);
        ctx.rotate(-armSwing);
        ctx.fillRect(0, 0, width * 0.15, bodyHeight * 0.4);
        ctx.restore();

        ctx.fillStyle = '#1f2937';
        if (!player.current.jumping) {
            const legSwing = Math.sin(animFrame * 0.5) * 0.3;
            ctx.save();
            ctx.translate(x + width * 0.3, y + headRadius * 2 + bodyHeight);
            ctx.rotate(legSwing);
            ctx.fillRect(0, 0, width * 0.2, legHeight);
            ctx.restore();

            ctx.save();
            ctx.translate(x + width * 0.5, y + headRadius * 2 + bodyHeight);
            ctx.rotate(-legSwing);
            ctx.fillRect(0, 0, width * 0.2, legHeight);
            ctx.restore();
        } else {
            ctx.fillRect(x + width * 0.3, y + headRadius * 2 + bodyHeight, width * 0.2, legHeight);
            ctx.fillRect(x + width * 0.5, y + headRadius * 2 + bodyHeight, width * 0.2, legHeight);
        }
    };

    const drawSnake = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
        const segmentHeight = height / 4;
        const wiggle = Math.sin(frame.current * 0.1) * 2 * scale;

        ctx.fillStyle = '#059669';

        for (let i = 0; i < 4; i++) {
            const segmentY = y + i * segmentHeight;
            const segmentWidth = width - Math.abs(wiggle) * 0.5;
            const segmentX = x + Math.sin(frame.current * 0.1 + i) * 1.5 * scale;

            ctx.fillRect(segmentX, segmentY, segmentWidth, segmentHeight);

            ctx.fillStyle = '#065f46';
            ctx.fillRect(segmentX + segmentWidth * 0.2, segmentY + segmentHeight * 0.3, segmentWidth * 0.6, segmentHeight * 0.4);
            ctx.fillStyle = '#059669';
        }

        ctx.fillStyle = '#10b981';
        ctx.fillRect(x + wiggle, y, width, segmentHeight);

        ctx.fillStyle = '#ef4444';
        const eyeSize = Math.max(1, 3 * scale);
        ctx.fillRect(x + width * 0.2 + wiggle, y + segmentHeight * 0.2, eyeSize, eyeSize);
        ctx.fillRect(x + width * 0.6 + wiggle, y + segmentHeight * 0.2, eyeSize, eyeSize);

        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.beginPath();
        ctx.moveTo(x + width * 0.4 + wiggle, y);
        ctx.lineTo(x + width * 0.35 + wiggle, y - 5 * scale);
        ctx.moveTo(x + width * 0.4 + wiggle, y);
        ctx.lineTo(x + width * 0.45 + wiggle, y - 5 * scale);
        ctx.stroke();
    };

    const drawCactus = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x + width * 0.3, y, width * 0.4, height);

        ctx.fillRect(x, y + height * 0.3, width * 0.4, width * 0.3);
        ctx.fillRect(x, y + height * 0.3, width * 0.2, height * 0.4);

        ctx.fillRect(x + width * 0.6, y + height * 0.5, width * 0.4, width * 0.3);
        ctx.fillRect(x + width * 0.8, y + height * 0.5, width * 0.2, height * 0.3);

        ctx.strokeStyle = '#166534';
        ctx.lineWidth = Math.max(1, scale);
        const spineSpacing = Math.max(4, 8 * scale);
        for (let i = 0; i < height; i += spineSpacing) {
            ctx.beginPath();
            ctx.moveTo(x + width * 0.25, y + i);
            ctx.lineTo(x + width * 0.15, y + i);
            ctx.moveTo(x + width * 0.75, y + i);
            ctx.lineTo(x + width * 0.85, y + i);
            ctx.stroke();
        }

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x + width * 0.5, y - 3 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawClouds = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const cloud of clouds.current) {
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const drawParticles = (ctx: CanvasRenderingContext2D) => {
        for (let i = particles.current.length - 1; i >= 0; i--) {
            const p = particles.current[i];
            const alpha = p.life / p.maxLife;

            ctx.fillStyle = `rgba(255, 193, 7, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(1, 2 * scale), 0, Math.PI * 2);
            ctx.fill();

            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2 * scale;
            p.life--;

            if (p.life <= 0) {
                particles.current.splice(i, 1);
            }
        }
    };

    const update = () => {
        const p = player.current;
        p.dy += gravity;
        p.y += p.dy;
        p.animFrame++;

        if (p.y > GROUND_Y - p.height) {
            p.y = GROUND_Y - p.height;
            p.dy = 0;
            p.jumping = false;
        }

        gameSpeed.current = Math.min(8 * scale, 5 * scale + scoreRef.current * 0.001 * scale);
        backgroundOffset.current += gameSpeed.current * 0.5;

        for (const cloud of clouds.current) {
            cloud.x -= cloud.speed;
            if (cloud.x < -cloud.size * 2) {
                cloud.x = canvasSize.width + cloud.size;
                cloud.y = Math.random() * (canvasSize.height * 0.27) + (canvasSize.height * 0.067);
            }
        }

        if (frame.current >= nextObstacleFrame.current) {
            const obstacleType = getRandomObstacleType();
            obstacles.current.push({
                x: canvasSize.width,
                y: GROUND_Y - (obstacleType === 'cactus' ? canvasSize.height * 0.15 : canvasSize.height * 0.117),
                width: obstacleType === 'cactus' ? canvasSize.width * 0.0375 : canvasSize.width * 0.03125,
                height: obstacleType === 'cactus' ? canvasSize.height * 0.15 : canvasSize.height * 0.117,
                type: obstacleType
            });
            nextObstacleFrame.current = frame.current + getRandomObstacleInterval();
        }

        const newObstacles = [];
        for (const obs of obstacles.current) {
            obs.x -= gameSpeed.current;

            const collisionMargin = 5 * scale;
            const collided =
                p.x < obs.x + obs.width - collisionMargin &&
                p.x + p.width > obs.x + collisionMargin &&
                p.y < obs.y + obs.height - collisionMargin &&
                p.y + p.height > obs.y + collisionMargin;

            if (collided) {
                gameOverRef.current = true;
                setGameOver(true);
                addCollisionParticles(p.x + p.width / 2, p.y + p.height / 2);
                if (scoreRef.current > highScore) {
                    setHighScore(scoreRef.current);
                }
                cancelAnimationFrame(animationRef.current!);
                return;
            }

            if (obs.x + obs.width > 0) {
                newObstacles.push(obs);
            }
        }

        obstacles.current = newObstacles;
        scoreRef.current += 1;
        setScore(scoreRef.current);
        frame.current++;
    };

    const draw = () => {
        const ctx = ctxRef.current;
        if (!ctx) return;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(0.7, '#f59e0b');
        gradient.addColorStop(1, '#d97706');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

        drawClouds(ctx);

        ctx.fillStyle = '#a3a3a3';
        ctx.beginPath();
        ctx.moveTo(-50 * scale, GROUND_Y);
        ctx.lineTo(100 * scale, GROUND_Y * 0.5);
        ctx.lineTo(200 * scale, GROUND_Y * 0.6);
        ctx.lineTo(350 * scale, GROUND_Y * 0.4);
        ctx.lineTo(500 * scale, GROUND_Y * 0.533);
        ctx.lineTo(650 * scale, GROUND_Y * 0.467);
        ctx.lineTo(canvasSize.width + 50 * scale, GROUND_Y * 0.567);
        ctx.lineTo(canvasSize.width + 50 * scale, GROUND_Y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(0, GROUND_Y, canvasSize.width, canvasSize.height - GROUND_Y);

        const duneSpacing = Math.max(20, 40 * scale);
        for (let i = 0; i < canvasSize.width; i += duneSpacing) {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.ellipse(i + (backgroundOffset.current % duneSpacing), GROUND_Y + 20 * scale, 20 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = Math.max(1, 3 * scale);
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(canvasSize.width, GROUND_Y);
        ctx.stroke();

        const p = player.current;
        drawHuman(ctx, p.x, p.y, p.width, p.height, p.animFrame);

        for (const obs of obstacles.current) {
            if (obs.type === 'snake') {
                drawSnake(ctx, obs.x, obs.y, obs.width, obs.height);
            } else {
                drawCactus(ctx, obs.x, obs.y, obs.width, obs.height);
            }
        }

        drawParticles(ctx);

        ctx.fillStyle = '#1f2937';
        const fontSize = Math.max(12, 24 * scale);
        ctx.font = `bold ${fontSize}px serif`;
        ctx.fillText(`Score: ${scoreRef.current}`, 20 * scale, 40 * scale);

        const smallFontSize = Math.max(10, 16 * scale);
        ctx.font = `${smallFontSize}px serif`;
        ctx.fillText(`Speed: ${gameSpeed.current.toFixed(1)}x`, 20 * scale, 65 * scale);
        if (highScore > 0) {
            ctx.fillText(`Best: ${highScore}`, 20 * scale, 85 * scale);
        }

        if (gameOverRef.current) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

            ctx.fillStyle = '#fbbf24';
            const titleFontSize = Math.max(20, 36 * scale);
            ctx.font = `bold ${titleFontSize}px serif`;
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER!', canvasSize.width / 2, canvasSize.height * 0.333);

            ctx.fillStyle = '#ffffff';
            const scoreFontSize = Math.max(16, 24 * scale);
            ctx.font = `bold ${scoreFontSize}px serif`;
            ctx.fillText(`Final Score: ${scoreRef.current}`, canvasSize.width / 2, canvasSize.height * 0.467);

            if (scoreRef.current === highScore && highScore > 0) {
                ctx.fillStyle = '#fbbf24';
                const highScoreFontSize = Math.max(14, 20 * scale);
                ctx.font = `${highScoreFontSize}px serif`;
                ctx.fillText('🏆 NEW HIGH SCORE! 🏆', canvasSize.width / 2, canvasSize.height * 0.567);
            }

            ctx.fillStyle = '#d1d5db';
            const instructionFontSize = Math.max(12, 18 * scale);
            ctx.font = `${instructionFontSize}px serif`;
            ctx.fillText('Press SPACE or click "Play Again"', canvasSize.width / 2, canvasSize.height * 0.667);
            ctx.textAlign = 'left';
        }
    };

    const loop = () => {
        if (gameOverRef.current) return;
        update();
        draw();
        animationRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) ctxRef.current = ctx;

        updateCanvasSize();

        const handleResize = () => {
            updateCanvasSize();
        };

        // Optimize for mobile performance
        const handleVisibilityChange = () => {
            if (document.hidden && animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            } else if (!document.hidden && !gameOverRef.current) {
                animationRef.current = requestAnimationFrame(loop);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        nextObstacleFrame.current = getRandomObstacleInterval();
        initClouds();
        animationRef.current = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Re-initialize when canvas size changes
    useEffect(() => {
        if (canvasSize.width > 0 && canvasSize.height > 0) {
            initClouds();
        }
    }, [canvasSize]);

    return (
        <div className='min-h-screen bg-gradient-to-br from-orange-200 via-yellow-200 to-orange-300 flex flex-col items-center justify-center p-1 sm:p-4'>
            <div className='text-center mb-2 sm:mb-8 px-2'>
                <h1 className='text-4xl sm:text-8xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1 sm:mb-4'>
                    {isError ? 'ERROR' : '404'}
                </h1>
                <h2 className='text-lg sm:text-3xl font-semibold text-orange-800 mb-1 sm:mb-2'>
                    {isError ? 'Something went wrong' : 'Lost in the Desert'}
                </h2>
                <p className='text-xs sm:text-base text-orange-700 mb-2 sm:mb-6 max-w-md leading-relaxed px-2'>
                    {isError ? 'Our servers encountered a sandstorm! We\'ll fix it shortly.' : "This page wandered off into the desert and got lost!"}
                    While we search for it, help our desert explorer survive the wild!
                </p>
            </div>

            <div ref={containerRef} className='w-full max-w-6xl bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-2 sm:p-8 mb-2 sm:mb-6 border border-orange-200 mx-2'>
                <div className='text-center mb-2 sm:mb-6'>
                    <h3 className='text-base sm:text-2xl font-bold text-orange-800 mb-1 sm:mb-2 flex items-center justify-center gap-1 sm:gap-2'>
                        🏜️ Desert Survival 🐍
                    </h3>
                    <p className='text-xs sm:text-base text-orange-600 mb-1 sm:mb-2 hidden sm:block'>Help the explorer jump over desert dangers!</p>
                    <div className='flex flex-wrap justify-center gap-1 sm:gap-4 text-xs text-orange-500'>
                        <span className='hidden sm:inline'>🎮 SPACE/↑ to Jump</span>
                        <span className='sm:hidden'>🎮 TAP to Jump</span>
                        <span>📊 Score: {score}</span>
                        {highScore > 0 && <span>🏆 Best: {highScore}</span>}
                    </div>
                </div>

                <div className='border-2 sm:border-4 border-orange-300 rounded-lg sm:rounded-xl overflow-hidden shadow-inner bg-gradient-to-b from-yellow-100 to-orange-100'>
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        className='block w-full h-auto touch-none select-none'
                        style={{ imageRendering: 'pixelated' }}
                        onClick={handleCanvasTouch}
                        onTouchStart={handleCanvasTouch}
                        onTouchEnd={(e) => e.preventDefault()}
                    />
                </div>

                <div className='text-center mt-2 sm:mt-6'>
                    <button
                        onClick={resetGame}
                        disabled={!gameOver}
                        className={`font-bold py-2 sm:py-3 px-3 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 transform text-xs sm:text-base ${gameOver
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl hover:scale-105'
                            : 'bg-orange-200 text-orange-400 cursor-not-allowed'
                            }`}
                    >
                        {gameOver ? '🎮 Play Again' : '🏃‍♂️ Running...'}
                    </button>
                </div>
            </div>

            <div className='text-center space-x-2 sm:space-x-4 px-2'>
                <button
                    onClick={() => window.history.back()}
                    className='bg-orange-500/80 hover:bg-orange-600 text-white font-semibold py-2 sm:py-3 px-2 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 backdrop-blur-sm text-xs sm:text-base'
                >
                    ← Back
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    className='bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-2 sm:py-3 px-2 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 shadow-md sm:shadow-lg text-xs sm:text-base'
                >
                    🏠 Home
                </button>
            </div>
        </div>
    );
}