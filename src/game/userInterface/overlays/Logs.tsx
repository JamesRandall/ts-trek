import {useGameStore} from "../../state/store.ts";
import {OverlayPanel} from "../../../components/OverlayPanel.tsx";
import {GameLogLevel} from "../../models/gameData.ts";
import {useEffect, useRef} from "react";

export function Logs() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const logs = useGameStore(s => s.gameData.logs);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);


    // tailwind-keep: border-green-600
    return (<OverlayPanel borderColor="green-600" width={500} isTransparentBackground={false}>
        <div ref={scrollRef}
             className="overflow-y-auto text-gamewhite p-3 my-scrollable"
             style={{maxHeight: '250px', minHeight: '250px'}}>
            {logs.map((l,i) => {
                const color = l.level === GameLogLevel.Red ? 'text-red-600' :
                    l.level === GameLogLevel.Yellow ? 'text-yellow-600' : 'text-green-600';
                return <div className={color} key={`${l.stardate}_${i}`}>&gt; {l.message}</div>
            })}
        </div>
    </OverlayPanel>);
}