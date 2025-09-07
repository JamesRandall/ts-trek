import type {ContextAccessor} from "../../state/store.ts";
import {setRangedValue} from "../../models/RangedValue.ts";

export function setPhaserPower({set}:ContextAccessor, power: number) {
    set(state => {
        setRangedValue(state.gameData.player.attributes.weapons.laserPower, power);
    });
}