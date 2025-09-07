import type {GameStore} from "../../state/store.ts";
import {applyRepairForTime} from "./repair.ts";

export function passTime(state:GameStore, time: number) {
    state.gameData.stardate += time;
    applyRepairForTime(state, time);
}