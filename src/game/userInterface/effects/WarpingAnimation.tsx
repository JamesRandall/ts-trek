import Starfield from "./Starfield.tsx";
import {useAssets} from "../../AssetManager.tsx";
import {useMemo, useState} from "react";
import {useGameStore} from "../../state/store.ts";
import {useNavigate} from "react-router-dom";


export function WarpingAnimation({isGameOver}: { isGameOver?: boolean }) {

    const navigate = useNavigate();
    const assets = useAssets();
    const endWarpTo = useGameStore(s => s.playerTurn.endWarpTo);
    const shipSrc = assets?.assets?.starshipPerspective?.src;

    const [hideShip, setHideShip] = useState(false);
    const [showGameOver, setShowGameOver] = useState(false);
    const [timerId, setTimerId] = useState<number | null>(null);
    const durations = useMemo(() => ({
        shipMs: 2000,
        whiteInMs: 100,
        whiteOutMs: 100,
    }), []);

    const handleClickToClose = () => {
        //if (isGameOver) return; // Prevent manual close during game over
        if (timerId !== null) {
            clearTimeout(timerId);
            setTimerId(null);
        }
        endWarpTo();
    }

    return (
        <div className="fixed inset-0 z-50 opacity-100" onClick={handleClickToClose}>
            <style>{`
                /* Smooth ease-in (starts very slow, accelerates strongly at the end) */
                @keyframes ship-move-to-center {
                    from {
                        transform: translate3d(-50%, calc(-50% + 35vh), 0) scale(1);
                        opacity: 1;
                    }
                    to {
                        transform: translate3d(-50%, -50%, 0) scale(0.35);
                        opacity: 1;
                    }
                }
                @keyframes white-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes white-out {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes game-over-zoom {
                    from {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }

                .ship-anim {
                    animation-name: ship-move-to-center;
                    animation-duration: var(--ship-duration);
                    animation-fill-mode: forwards;
                    /* Strong ease-in quint: smooth start, massive acceleration near end */
                    animation-timing-function: var(--ship-ease, cubic-bezier(0.70, 0.08, 0.855, 0.06));
                    will-change: transform;
                    backface-visibility: hidden;
                    transform: translate3d(-50%, calc(-50% + 35vh), 0) scale(1);
                }

                .white-in {
                    animation: white-in var(--white-in-duration) linear var(--ship-duration) forwards;
                }

                .white-out {
                    animation: white-out var(--white-out-duration) linear 0ms forwards;
                }

                .game-over-text {
                    animation: game-over-zoom 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }

                @media (prefers-reduced-motion: reduce) {
                    .ship-anim,
                    .white-in,
                    .white-out,
                    .game-over-text {
                        animation: none !important;
                    }
                }
            `}</style>

            <Starfield />

            {!hideShip && (
                <img
                    src={shipSrc}
                    alt="Starship"
                    className="ship-anim"
                    style={{
                        position: 'fixed',
                        zIndex: 60,
                        top: '50%',
                        left: '50%',
                        width: 150,
                        height: 150,
                        objectFit: 'contain',
                        ['--ship-duration' as string]: `${durations.shipMs}ms`,
                        // You can tweak this if you want slightly different acceleration:
                        // e.g. quartic: cubic-bezier(0.895, 0.03, 0.685, 0.22)
                        ['--ship-ease' as string]: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
                    }}
                />
            )}

            <div
                className={hideShip ? 'white-out' : 'white-in'}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'white',
                    zIndex: 70,
                    opacity: 0,
                    ['--ship-duration' as string]: `${durations.shipMs}ms`,
                    ['--white-in-duration' as string]: `${durations.whiteInMs}ms`,
                    ['--white-out-duration' as string]: `${durations.whiteOutMs}ms`,
                }}
                onAnimationEnd={(e) => {
                    const name = String(e.animationName || '');
                    if (name.includes('white-in')) {
                        setHideShip(true);
                        if (isGameOver) {
                            setShowGameOver(true);
                        }
                    } else if (name.includes('white-out')) {
                        if (isGameOver) {
                            // Navigate to home after 5 seconds
                            setTimerId(setTimeout(() => navigate('/'), 5000));
                        } else {
                            setTimerId(setTimeout(() => endWarpTo(), 1500));
                        }
                    }
                }}
                aria-hidden="true"
            />

            {showGameOver && (
                <div
                    className="game-over-text font-orbitron text-center text-gamewhite"
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) scale(0)',
                        zIndex: 80,
                        fontSize: '4rem',
                        fontWeight: 'bold',
                        textShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
                        letterSpacing: '0.2em',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <div>GAME OVER</div>
                    <div>YOU WON!!!</div>
                </div>
            )}
        </div>
    );
}
