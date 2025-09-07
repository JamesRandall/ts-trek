import {useGameStore} from "../state/store.ts";
import HorizontalGauge from "../../components/HorizontalGauge.tsx";
import HorizontalSlider from "../../components/HorizontalSlider.tsx";

export function PhasersPanel() {
    const player = useGameStore(s => s.gameData.player);
    const setPhaserPower = useGameStore(s => s.playerTurn.setPhaserPower);

    return (
      <div className="flex flex-col gap-1">
          <HorizontalSlider label="Energy" range={player.attributes.weapons.laserPower} setValue={setPhaserPower} />
          <HorizontalGauge label="Temperature" range={player.attributes.weapons.laserTemperature} />
          <HorizontalGauge label="Status" range={player.attributes.systems.lasers.status} />
      </div>
    );
}