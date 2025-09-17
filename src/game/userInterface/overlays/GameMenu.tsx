import GameButton from "../../../components/GameButton.tsx";
import {OverlayPanel} from "../../../components/OverlayPanel.tsx";
import {useNavigate} from "react-router-dom";
import {useGameStore} from "../../state/store.ts";
import {GameState, type ScoreTracker, type ScoringConstants} from "../../models/gameData.ts";

function calculateScores(scores: ScoreTracker, constants: ScoringConstants, startingStardate: number, currentStardate: number) {
    const scoreLines = {
        scoutDestroyed: scores.scoutDestroyed * constants.destroyedScoutPoints,
        warbirdDestroyed: scores.warbirdDestroyed * constants.destroyedWarbirdPoints,
        cubusDestroyed: scores.cubusDestroyed * constants.destroyedCubusPoints,
        timeTakenPenalty: Math.round((currentStardate - startingStardate) * constants.deductedPointsPerStardate),
        defeatPenalty: scores.finalGameState === GameState.Defeat ? constants.destructionPenalty : 0,
        totalScore: 0
    };
    scoreLines.totalScore = scoreLines.scoutDestroyed + scoreLines.warbirdDestroyed + scoreLines.cubusDestroyed + scoreLines.timeTakenPenalty + scoreLines.defeatPenalty;
    return scoreLines;
}

export function GameMenu() {
    const navigate = useNavigate();
    const constants = useGameStore(s => s.gameData.difficultyConstants.scoring);
    const scores = useGameStore(s => s.gameData.scoreTracker);
    const startingStardate = useGameStore(s => s.gameData.startingStardate);
    const currentStardate = useGameStore(s => s.gameData.stardate);
    const calculatedScores = calculateScores(scores, constants, startingStardate, currentStardate);

    return (<OverlayPanel borderColor="green-600" onClick={e => e.stopPropagation()}>
        <div className="p-3 flex flex-col font-orbitron gap-5">
            <div className="grid grid-cols-2 gap-3">
                <div className="text-green-600">Scouts destroyed</div>
                <div className="text-green-600 text-right">{calculatedScores.scoutDestroyed}</div>
                <div className="text-green-600">Warbirds destroyed</div>
                <div className="text-green-600 text-right">{calculatedScores.warbirdDestroyed}</div>
                <div className="text-green-600">Cubus destroyed</div>
                <div className="text-green-600 text-right">{calculatedScores.cubusDestroyed}</div>
                <div className="text-orange-600">Time penalty</div>
                <div className="text-orange-600 text-right">{calculatedScores.timeTakenPenalty}</div>
                <div className="text-orange-600">Defeat penalty</div>
                <div className="text-orange-600 text-right">{scores.finalGameState === GameState.Defeat ? calculatedScores.defeatPenalty : "n/a"}</div>
                <div className={calculatedScores.totalScore < 0 ? "text-red-600" : "text-green-600"}>Total score</div>
                <div className={calculatedScores.totalScore < 0 ? "text-red-600 text-right" : "text-green-600 text-right"}>{calculatedScores.totalScore}</div>
            </div>
            <div className="flex flex-col">
                <GameButton title="BACK TO TITLE SCREEN" onClick={() => navigate('/')} />
            </div>
        </div>

    </OverlayPanel>);
}