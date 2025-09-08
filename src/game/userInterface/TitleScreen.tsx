import starship from "../../assets/titleScreenStarship.png";
import Starfield from "./effects/Starfield.tsx";
import {useGameStore} from "../state/store.ts";
import {useAssets} from "../AssetManager.tsx";
import MenuButton from "../../components/MenuButton.tsx";
import {Route, Routes, useNavigate} from "react-router-dom";
import AboutScreen from "./about/AboutScreen.tsx";

function Main() {
    const startGame = useGameStore(s => s.startGame);
    const assets = useAssets();
    const navigate = useNavigate();

    return (<div className="absolute flex flex-col justify-center items-center z-20 left-0 top-0 right-0 bottom-0 gap-10">
        <img src={starship} alt="" style={{maxHeight: "50vh"}} />
        <div className="flex flex-col gap-3 items-center">
            <div className="grid grid-cols-3 gap-3">
                <MenuButton title={"NEW GAME"} onClick={() => startGame()} disabled={assets.isLoading} />
                <MenuButton title={"CONTINUE"} disabled={assets.isLoading} />
                <MenuButton title={"ABOUT"} onClick={() => navigate('/about')} disabled={assets.isLoading} />
            </div>
        </div>
    </div>);
}

export function TitleScreen() {
    return (
        <div className="h-full w-full relative">
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/about/*" element={<AboutScreen/>} />
            </Routes>
            <Starfield />
        </div>
    )
}
