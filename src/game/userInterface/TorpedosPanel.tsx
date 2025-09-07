import {useGameStore} from "../state/store.ts";
import HorizontalGauge from "../../components/HorizontalGauge.tsx";

export function TorpedoesPanel() {
    const player = useGameStore(s => s.gameData.player);

    return (
      <div className="flex flex-col gap-3">
          <div className="flex flex-row justify-between items-center">
              <div>Torpedoes</div>
              <div className="flex flex-row justify-end items-center gap-3">
                  {[...Array(player.attributes.weapons.torpedoes.maxValue)].map((_, i) =>
                      <div key={i} className={"aspect-square h-4 relative rounded-full " + (player.attributes.weapons.torpedoes.currentValue >= (player.attributes.weapons.torpedoes.maxValue - i) ? "bg-white" : "bg-gray-700")}></div>)}
              </div>
          </div>
          <HorizontalGauge label="Launchers" range={player.attributes.systems.torpedoTubes.status} />
      </div>
    );
}