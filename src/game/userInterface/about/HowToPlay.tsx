import sector from "../../../assets/sector.png";
import longrange from "../../../assets/longrange.png";

export function HowToPlay() {
    const imageSize = {width: '20vw'};

    return (<div>
        <p className="mb-4">
            TS Trek is based on the classic mainframe game of Star Trek. Its a simple turn based game where you control a
            ship that can fire lasers and torpedoes.
            The, (lets call them) Fwingons have invaded the your quadrant of the galaxy and are you're the only ship
            that can stop them.
        </p>
        <div className="grid grid-cols-[1fr_auto] gap-3 mb-4">
            <div>
                <p className="mb-4">
                    The universe is broken down into an 8x8 grid of sectors (like the one to the right) each of which are themselves 8x8 in size. Within a
                    sector you can move around by dragging and dropping your ship - but be careful after each move any enemies
                    in the sector get a chance to take a turn.
                </p>
                <p className="mb-4">
                    All your actions consume energy so keep an eye on that. Energy will be refilled while you warp travel between sectors if you are moving slower
                    than warp 5.
                </p>
                <p className="mb-4">
                    You can fire phasers and torpedoes by clicking on the target you want to fire at and adding them as a target. You can target up
                    to 3 enemies at a time but this can be impacted if your sensors are damaged. Your ship carries a complement of 9 torpedoes which can be resupplied
                    by docking at a starbase. Your phasers draw on main energy and you can adjust the power of each hit - less energy, less damage but less draw on your main energy supply.
                </p>
                <p className="mb-4">
                    Phasers are most effective against shields, torpedoes will cause maximum damage when an enemies shields are depleted.
                </p>
            </div>
            <img style={imageSize} src={sector} alt="View of a sector"/>
        </div>
        <p className="mb-4">
            After each turn you take your enemies will get a chance to strike you, your shields will protect you from damage while they hold but direct strikes
            will damage your ships hull and systems. Damaged systems will be less effective and cause various side effects. If your hull is reduced to 0 then you will exploder. Game over man, game over.
            Fortunately you can repair your systems (check the status overlay) but your hull can only be repaired by docking with a starbase (which will also repair your systems and resupply you).
        </p>
        <div className="grid grid-cols-[auto_1fr] gap-3 mb-4">
            <img style={imageSize} src={longrange} alt="Long range scanners"/>
            <div>
                <p className="mb-4">
                    You can move between sectors using the long range view. The red number represents the number of enemies in a sector,
                    the blue number the number of starbases and the orange number the number of stars. You can only view the sectors within your scanning
                    range but once you've visited a sector it and its neighbors will be visible from then on. It pays to find a starbase sooner rather than later!
                </p>
                <p className="mb-4">
                    With a fully functional ship speeds of warp 4 and below will generate energy, warp 5 is neutral, and warp 6 and above will consume energy. Why move fast? The faster you complete
                    the game the higher your final score and you might find yourself responding to the occasional request for help. Moving with damaged deflectors will cause damage to your ship - so take care.
                </p>
                <p className="mb-4">
                    Warping with your shields lowered will generate you more energy but their is a risk that you warp into a sector and the enemies respond to your arrival before you can raise the shields.
                </p>
            </div>
        </div>
        <p className="mb-4">
            There's a bit more to it but nothing that can't be discovered with a quick game or two. Have fun!
        </p>
    </div>);
}