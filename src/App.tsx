import './App.css'
import {TitleScreen} from "./game/userInterface/TitleScreen.tsx";
import {GameScreen} from "./game/userInterface/GameScreen.tsx";
import {Route, Routes, useNavigate} from "react-router-dom";
import {useGameStore} from "./game/state/store.ts";
import {useEffect} from "react";
import MouseTrek from "./game/userInterface/about/MouseTrek.tsx";

function NavigationBridge() {
    const navigate = useNavigate()

    useEffect(() => {
        return useGameStore.subscribe((state, prevState) => {
           if (state.pendingNav && state.pendingNav !== prevState.pendingNav) {
               navigate(state.pendingNav);
               useGameStore.getState().clearPendingNav();
           }
        });
    }, [navigate])

    return null
}

function App() {
    return (
        <div className="h-full w-full">
            <Routes>
                <Route path="/*" element={<TitleScreen/>} />
                <Route path="/game" element={<GameScreen />} />
                <Route path="/mstrek" element={<MouseTrek />} />
            </Routes>
            <NavigationBridge />
        </div>
    );
}

export default App
