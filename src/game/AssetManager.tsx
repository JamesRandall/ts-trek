import scout from "../assets/board-pieces/medium-scout.png";
import star from "../assets/board-pieces/star.png";
import starbase from "../assets/board-pieces/starbase.png";
import starship from "../assets/board-pieces/starship.png";
import warbird from "../assets/board-pieces/warbird.png";
import cube from "../assets/board-pieces/cube.png";
import starshipPerspective from "../assets/board-pieces/starship-perspective.png";
import playerLaser from '../assets/sounds/Laser Being Fired 2.mp3';
import enemyLaser from '../assets/sounds/Laser Being Fired.mp3';
import normalExplosion from '../assets/sounds/Normal Explosion.mp3';
import shieldsRaised from '../assets/sounds/Shields Being Raised.mp3';
import shieldsLowered from '../assets/sounds/Shields Being Lowered.mp3';
import {createContext, type ReactNode, useContext, useEffect, useState} from "react";

interface AssetProviderProps {
    children: ReactNode;
}

interface AssetContextType {
    assets: AssetManager | null;
    isLoading: boolean;
    error: string | null;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

type AudioOptions = {
    volume?: number;
    when?: number;
    offset?: number;
    duration?: number;
}

export type AssetManager = {
    star: HTMLImageElement;
    player: HTMLImageElement;
    starbase: HTMLImageElement;
    enemyCube: HTMLImageElement;
    enemyScout: HTMLImageElement;
    enemyWarbird: HTMLImageElement;
    starshipPerspective: HTMLImageElement;

    sounds: {
        playerLaser: (options?:AudioOptions) => void;
        normalExplosion: (options?:AudioOptions) => void;
        shieldsRaised: (options?:AudioOptions) => void;
        shieldsLowered: (options?:AudioOptions) => void;
        enemyLaser: (options?:AudioOptions) => void;
    }
}

let _ctx: AudioContext | null = null;
function getAudioContext() {
    if (_ctx) return _ctx!;
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return _ctx!;
}

function playAudioBuffer(
    audioBuffer: AudioBuffer,
    audioContext: AudioContext,
    options?: {
        when?: number;      // When to start (default: now)
        offset?: number;    // Where in the buffer to start (in seconds)
        duration?: number;  // How long to play (in seconds)
        volume?: number;    // Volume (0-1)
    }
) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // Optional: Add volume control
    if (options?.volume !== undefined) {
        const gainNode = audioContext.createGain();
        gainNode.gain.value = options.volume;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
    } else {
        source.connect(audioContext.destination);
    }

    // Start with optional parameters
    const when = options?.when ?? audioContext.currentTime;
    const offset = options?.offset ?? 0;
    const duration = options?.duration;

    if (duration !== undefined) {
        source.start(when, offset, duration);
    } else {
        source.start(when, offset);
    }
}


function loadAssets() : Promise<AssetManager> {
    const srcImages = [
        star,
        starbase,
        starship,
        scout,
        warbird,
        cube,
        starshipPerspective
    ];
    const srcSounds = [
        playerLaser,
        normalExplosion,
        shieldsRaised,
        shieldsLowered,
        enemyLaser
    ];

    const loadedImagePromises = srcImages.map(srcImage => {
        return new Promise<HTMLImageElement | AudioBuffer>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve(img);
            };
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${srcImage}`));
            }
            img.src = srcImage;
        })
    });

    const ctx = getAudioContext();
    const loadedSoundPromises = srcSounds.map(srcSound => {
        return fetch(srcSound)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                return ctx.decodeAudioData(arrayBuffer);
            })
            .then(buffer => {
                return buffer as (HTMLImageElement | AudioBuffer);
            });

    });

    const allPromises: (Promise<HTMLImageElement | AudioBuffer>)[] = loadedImagePromises.concat(loadedSoundPromises);
    //const allPromises = loadedImagePromises;

    return Promise.all(allPromises).then(loadedAssets => {
        return {
            star: loadedAssets[0],
            starbase: loadedAssets[1],
            player: loadedAssets[2],
            enemyScout: loadedAssets[3],
            enemyWarbird: loadedAssets[4],
            enemyCube: loadedAssets[5],
            starshipPerspective: loadedAssets[6],
            sounds: {
                playerLaser: (options) => playAudioBuffer(loadedAssets[7] as AudioBuffer, ctx, options),
                normalExplosion: (options) => playAudioBuffer(loadedAssets[8] as AudioBuffer, ctx, options),
                shieldsRaised: (options) => playAudioBuffer(loadedAssets[9] as AudioBuffer, ctx, options),
                shieldsLowered: (options) => playAudioBuffer(loadedAssets[10] as AudioBuffer, ctx, options),
                enemyLaser: (options) => playAudioBuffer(loadedAssets[11] as AudioBuffer, ctx, options),
            }
        } as AssetManager;
    });
}

export function AssetProvider({ children }: AssetProviderProps) {
    const [assets, setAssets] = useState<AssetManager | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadAssetManager = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const loadedAssets = await loadAssets();

                if (mounted) {
                    setAssets(loadedAssets);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load assets');
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        loadAssetManager();

        return () => {
            mounted = false;
        };
    }, []);

    const contextValue: AssetContextType = {
        assets,
        isLoading,
        error,
    };

    return (
        <AssetContext.Provider value={contextValue}>
            {children}
        </AssetContext.Provider>
    );
}

export function useAssets() {
    const context = useContext(AssetContext);

    if (context === undefined) {
        throw new Error('useAssets must be used within an AssetProvider');
    }

    return context;
}
