import GameButton from "../../components/GameButton.tsx";
import {OverlayPanel} from "../../components/OverlayPanel.tsx";
import {useNavigate} from "react-router-dom";

export function GameMenu() {
    const navigate = useNavigate();

    return (<OverlayPanel borderColor="orange-600" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col w-60">
            <GameButton hasBorder={false} title="SCORE" />
            <GameButton hasBorder={false} title="QUIT" onClick={() => navigate('/')} />
        </div>
    </OverlayPanel>);
}