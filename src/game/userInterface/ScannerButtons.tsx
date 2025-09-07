import GameButton from "../../components/GameButton.tsx";
import {useGameStore} from "../state/store.ts";
import {useCallback, useRef, useState, useEffect} from "react";
import {createPortal} from "react-dom";
import {LongRangeScanner} from "./overlays/LongRangeScanner.tsx";
import {SystemStatus} from "./overlays/SystemStatus.tsx";
import {Logs} from "./overlays/Logs.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {GameMenu} from "./GameMenu.tsx";
import {faBars} from "@fortawesome/free-solid-svg-icons";

export default function ScannerButtons() {
    const isDisabled = useGameStore(s => s.userInterface.isDisabled);
    const isShowingLongRangeScanner = useGameStore(
        (s) => s.userInterface.isShowingLongRangeScanner
    );
    const showLongRangeScanner = useGameStore(
        (s) => s.userInterface.showLongRangeScanner
    );
    const hideLongRangeScanner = useGameStore(state => state.userInterface.hideLongRangeScanner);
    const isShowingLogs = useGameStore(state => state.userInterface.isShowingLogs);
    const showLogs = useGameStore(state => state.userInterface.showLogs);
    const hideLogs = useGameStore(state => state.userInterface.hideLogs);
    const showSystemStatus = useGameStore(state => state.userInterface.showSystemStatus);
    const hideShowSystemStatus = useGameStore(state => state.userInterface.hideSystemStatus);
    const isShowingSystemStatus = useGameStore(state => state.userInterface.isShowingSystemStatus);
    const showMenu = useGameStore(state => state.userInterface.showMenu);
    const hideMenu = useGameStore(state => state.userInterface.hideMenu);
    const isShowingMenu = useGameStore(state => state.userInterface.isShowingMenu);
    const stardate = useGameStore(state => state.gameData.stardate);
    const statusAnchorRef = useRef<HTMLDivElement | null>(null);
    const logsAnchorRef = useRef<HTMLDivElement | null>(null);
    const longRangeAnchorRef = useRef<HTMLDivElement | null>(null);
    const menuAnchorRef = useRef<HTMLDivElement | null>(null);
    const [scannerAnchor, setScannerAnchor] = useState<{ left: number; top:number } | null>(null);

    const handleShowLongRange = useCallback(() => {
        const el = longRangeAnchorRef.current;
        if (!el) {
            showLongRangeScanner();
            return;
        }
        const rect = el.getBoundingClientRect();
        const gap = 8; // px gap above the button
        const left = rect.left - 2; // + rect.width / 2;
        const top = rect.top - gap; // place just above
        setScannerAnchor({ left, top });
        showLongRangeScanner();
    }, [showLongRangeScanner]);

    const handleShowSystemStatus = useCallback(() => {
        const el = statusAnchorRef.current;
        if (!el) {
            showSystemStatus();
            return;
        }
        const rect = el.getBoundingClientRect();
        const gap = 8; // px gap above the button
        const left = rect.left - 2; // + rect.width / 2;
        const top = rect.top - gap; // place just above
        setScannerAnchor({ left, top });
        showSystemStatus();
    }, [showSystemStatus]);

    const handleShowLogs = useCallback(() => {
        const el = logsAnchorRef.current;
        if (!el) {
            showLogs();
            return;
        }
        const rect = el.getBoundingClientRect();
        const gap = 8; // px gap above the button
        const left = rect.left - 2; // + rect.width / 2;
        const top = rect.top - gap; // place just above
        setScannerAnchor({ left, top });
        showLogs();
    }, [showLogs]);

    const handleShowMenu = useCallback(() => {
        const el = menuAnchorRef.current;
        if (!el) {
            showMenu();
            return;
        }
        const rect = el.getBoundingClientRect();
        const gap = 8; // px gap above the button
        const left = rect.left - 2; // + rect.width / 2;
        const top = rect.top - gap; // place just above
        setScannerAnchor({ left, top });
        showMenu();
    }, [showMenu]);

    // Auto-position logs overlay when isShowingLogs changes
    useEffect(() => {
        if (isShowingLogs) {
            const el = logsAnchorRef.current;
            if (el) {
                const rect = el.getBoundingClientRect();
                const gap = 8; // px gap above the button
                const left = rect.left - 2;
                const top = rect.top - gap;
                setScannerAnchor({ left, top });
            }
        }
    }, [isShowingLogs]);

    return (
        <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row gap-2 items-center relative" ref={menuAnchorRef}>
                <GameButton isSquare={true} onClick={handleShowMenu}>
                    <FontAwesomeIcon icon={faBars}  />
                </GameButton>
                <div className="font-orbitron text-lg">Stardate {stardate.toFixed(1)}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div ref={longRangeAnchorRef} className="relative"><GameButton disabled={isDisabled} title="LONG RANGE" onClick={handleShowLongRange} /></div>
                <div ref={statusAnchorRef} className="relative"><GameButton disabled={isDisabled} isBlock={true} title="STATUS" onClick={handleShowSystemStatus} /></div>
                <div ref={logsAnchorRef} className="relative"><GameButton disabled={isDisabled} isBlock={true} title="LOGS" onClick={handleShowLogs} /></div>
            </div>
            {isShowingLongRangeScanner && scannerAnchor && !isDisabled && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-20 opacity-100" onClick={hideLongRangeScanner}
                    >
                        <div className="absolute" style={{
                            left: scannerAnchor.left,
                            top: scannerAnchor.top,
                            transform: "translateY(-100%)", // center X and place above
                        }}>
                            <LongRangeScanner />
                        </div>
                    </div>
                </>,
                document.body
            )}
            {isShowingSystemStatus && scannerAnchor && !isDisabled && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-20 opacity-100" onClick={hideShowSystemStatus}
                    >
                        <div className="absolute" style={{
                            left: scannerAnchor.left,
                            top: scannerAnchor.top,
                            transform: "translateY(-100%)", // center X and place above
                        }}>
                            <SystemStatus />
                        </div>
                    </div>
                </>,
                document.body
            )}
            {isShowingLogs && scannerAnchor && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-20 opacity-100 animate-in fade-in duration-300"
                        onClick={hideLogs}
                    >
                        <div className="absolute animate-in fade-in slide-in-from-top-2 duration-300" style={{
                            left: scannerAnchor.left,
                            top: scannerAnchor.top,
                            transform: "translateY(-100%)",
                        }}>
                            <Logs />
                        </div>
                    </div>
                </>,

                document.body
            )}
            {isShowingMenu && scannerAnchor && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-20 opacity-100 animate-in fade-in duration-300"
                        onClick={hideMenu}
                    >
                        <div className="absolute animate-in fade-in slide-in-from-top-2 duration-300" style={{
                            left: scannerAnchor.left,
                            top: scannerAnchor.top,
                            transform: "translateY(-100%)",
                        }}>
                            <GameMenu />
                        </div>
                    </div>
                </>,

                document.body
            )}

        </div>
    )
}