import {type GameObject } from "../models/gameObject.ts";
import type {GameData} from "../models/gameData.ts";

export function objectWithId(gameData: GameData, targetId: string) : GameObject | undefined {
    return gameData.enemies.find(e => e.id === targetId) ??
        gameData.starbases.find(s => s.id === targetId) ??
        gameData.stars.find(s => s.id === targetId);
}
