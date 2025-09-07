
import {ShortRangeScanner} from "./ShortRangeScanner.tsx";
import ParallaxStarfield from "./effects/ParallaxStarfield.tsx";
import ScannerButtons from "./ScannerButtons.tsx";
import SidePanel from "./SidePanel.tsx";
import WeaponButtons from "./WeaponButtons.tsx";
import { useEffect, useState } from "react";
import {useGameStore} from "../state/store.ts";
import {WarpingAnimation} from "./WarpingAnimation.tsx";
import {EnemyAiControlLoop} from "./EnemyAiControlLoop.tsx";
import {GameLogLevel, GameOverState} from "../models/gameData.ts";
import {GameOverAnimation} from "./effects/GameOverAnimation.tsx";

export function GameScreen() {
    const [scale, setScale] = useState(1);
    const isWarping = useGameStore(state => state.gameData.isWarping);
    const showTipLog = useGameStore(state => state.userInterface.showTipLog);
    const hideTipLog = useGameStore(state => state.userInterface.hideTipLog);
    const logs = useGameStore(state => state.gameData.logs);
    const gameOver = useGameStore(state => state.gameData.gameOver);
    const tipLog = logs[logs.length - 1];
    const [timerHandle, setTimerHandle] = useState<number | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    
    const color = tipLog?.level === GameLogLevel.Red ? 'text-red-600' :
        tipLog?.level === GameLogLevel.Yellow ? 'text-yellow-600' : 'text-green-600';

    useEffect(() => {
        if (timerHandle) { clearTimeout(timerHandle); }
        
        if (showTipLog && tipLog) {
            // Start with overlay visible but transparent
            setIsVisible(true);
            setIsAnimating(false);
            
            // Trigger fade in on next frame
            requestAnimationFrame(() => {
                setIsAnimating(true);
            });
            
            // Start fade out after 1.5 seconds, then hide after fade completes
            setTimerHandle(setTimeout(() => {
                setIsAnimating(false); // Start fade out
                setTimeout(() => {
                    setIsVisible(false);
                    hideTipLog();
                    setTimerHandle(null);
                }, 500); // Wait for fade out to complete
            }, 1500));
        } else {
            setIsVisible(false);
            setIsAnimating(false);
        }
    }, [tipLog, showTipLog, hideTipLog]); // don't include timerHandle in here or you will an immediate canncel

    useEffect(() => {
        const calculateScale = () => {
            const gameWidth = 1200;
            const gameHeight = 825;
            const padding = 20; // Add some padding around the game area

            const availableWidth = window.innerWidth - padding * 2;
            const availableHeight = window.innerHeight - padding * 2;

            const scaleX = availableWidth / gameWidth;
            const scaleY = availableHeight / gameHeight;

            // Use the smaller scale to ensure the entire game fits
            const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
            setScale(newScale);
        };

        calculateScale();
        window.addEventListener('resize', calculateScale);

        return () => window.removeEventListener('resize', calculateScale);
    }, []);

    return (
        <div className="h-full w-full text-white bg-black relative flex flex-col justify-center items-center">
            <EnemyAiControlLoop />
            <div
                className="absolute inset-0 z-0" style={{
                filter: 'brightness(0.35)',
            }}>
                <ParallaxStarfield speed={0.01} streakSeconds={0.08} />
            </div>

            <div
                className="relative z-10"
                style={{
                    width: 1200,
                    height: 825,
                    minWidth: 1200,
                    minHeight: 825,
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center'
                }}
            >
                <div className="flex flex-row gap-x-5 h-full">
                    <div className="grid grid-rows-[1fr_auto] gap-y-5 flex-1">
                        <ShortRangeScanner />
                        <ScannerButtons />
                    </div>
                    <div className="grid grid-rows-[1fr_auto] gap-y-5 flex-1">
                        <SidePanel />
                        <WeaponButtons />
                    </div>
                </div>

                {isVisible && tipLog &&
                    <div 
                        className={`absolute bottom-0 left-0 right-0 h-auto pointer-events-none z-20 transition-opacity duration-500 ${
                            isAnimating ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {/* Overlay for ScannerButtons area */}
                        <div className={`bg-black border-2 w-full h-10 flex justify-center items-center ${color} font-orbitron`}>
                            {tipLog.message}
                        </div>
                    </div>
                }

            </div>

            {isWarping && <WarpingAnimation /> }
            {gameOver === GameOverState.Defeat && <GameOverAnimation /> }
        </div>
    )
}