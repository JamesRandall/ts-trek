import {AiActorAction, useGameStore} from "../state/store.ts";
import {useEffect} from "react";
import {GameState} from "../models/gameData.ts";

export function EnemyAiControlLoop() {
    const currentGameState = useGameStore(state => state.gameData.state);
    const currentAiSequence = useGameStore(state => state.enemyTurn.aiActorSequence);
    const endEnemyTurn = useGameStore(state => state.enemyTurn.endTurn);
    const setActorAction = useGameStore(state => state.enemyTurn.setActorAction);
    useEffect(() => {
        if (currentGameState !== GameState.EnemyTurn) { return; }
        if (currentAiSequence.length === 0) {
            endEnemyTurn();
            return;
        }
        setActorAction(AiActorAction.FirePhasers);
    }, [currentGameState, currentAiSequence, endEnemyTurn, setActorAction])

    return <></>
}