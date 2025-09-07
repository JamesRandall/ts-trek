import galaxy from "../../../assets/galaxy_screenshot.png";
import egaTrek from "../../../assets/egatrek_screenshot.png";
import msTrek1 from "../../../assets/mousetrek_screenshot_1.png";
import msTrek2 from "../../../assets/mousetrek_screenshot_2.png";
import msTrek3 from "../../../assets/mousetrek_screenshot_3.png";
import msTrek4 from "../../../assets/mousetrek_screenshot_4.png";
import paddTrek1 from "../../../assets/paddtrek_screenshot_1.png";
import paddTrek2 from "../../../assets/paddtrek_screenshot_2.png";
import paddTrek3 from "../../../assets/paddtrek_screenshot_3.png";
import paddTrek4 from "../../../assets/paddtrek_screenshot_4.png";
import paddTrekPhone1 from "../../../assets/paddtrek_phone_screenshot_1.png";
import paddTrekPhone2 from "../../../assets/paddtrek_phone_screenshot_2.png";
import paddTrekPhone3 from "../../../assets/paddtrek_phone_screenshot_3.png";
import paddTrekPhone4 from "../../../assets/paddtrek_phone_screenshot_4.png";
import paddTrekPhone5 from "../../../assets/paddtrek_phone_screenshot_5.png";
import GameButton from "../../../components/GameButton.tsx";
import {useNavigate} from "react-router-dom";

export function History() {
    const navigate = useNavigate();
    const imageSize = {width: '30vw'};
    // tailwind-keep: border-yellow-600 text-yellow-600 border-orange-600
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Beginnings</h2>
            <div className="grid grid-cols-[1fr_auto] gap-4">
                <div>
                    <p className="mb-4">
                        I have a long and storied (well, storied to me - anyone reading this drivel is probably thinking
                        get over yourself) history with the classic mainframe game <a
                        className="text-orange-600 hover:text-orange-400"
                        href="https://en.wikipedia.org/wiki/Star_Trek_(1971_video_game)">Star Trek</a>.
                        I first played it on the BBC Micro in the early 1980s - <a
                        className="text-orange-600 hover:text-orange-400"
                        href="https://www.bbcmicro.co.uk/index.php?search=star+trek&sort=b">there are loads of
                        versions</a> but I suspect I played the Acornsoft version Galaxy (pictured here). I don't really
                        remember but I'm guessing Acornsoft just because I remember having quite a few of their games in
                        the house in the early days of the BBC...
                    </p>
                    <p>I truly loved Star Trek as a kid (still do - but not the new garbage, my love ends with DS9,
                        slight soft spot for Voyager) and so I lapped this stuff up back then.</p>
                </div>
                <img style={imageSize} src={galaxy} alt="Screenshot of the Acornsoft Galaxy game"/>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-4 mb-4">
                <img className="float-right mr-4 mb-2" style={imageSize} src={egaTrek}
                     alt="Screenshot of the EGA Trek game"/>
                <div>
                    <p className="mb-4">The next version I clearly remember playing is on the PC. I downloaded <a
                        className="text-orange-600 hover:text-orange-400"
                        href="https://www.playdosgames.com/online/ega-trek/">EGA Trek</a> from a BBS probably around
                        1990 on a 2400bps modem. Yes. Bits per second. We did NOT have fibre to the door!</p>
                    <p className="mb-4">I loved this game. Absolutely loved it. It was a little easier to play than the
                        original text based games and the graphics, although primitive, added loads to the
                        experience.</p>
                    <p className="mb-4">However I'd always been more interested in coding than gaming and around the
                        same time I'd been learning C, first on my BBC (I had a BBC until well past their prime), and
                        then on an <a className="text-orange-600 hover:text-orange-400" href="">Amstrad PC 1512</a> with <a className="text-orange-600 hover:text-orange-400" href="https://en.wikipedia.org/wiki/Turbo_C">Turbo C</a> (version 1.5 I believe). I was also deeply into Star
                        Trek: The Next Generation and so decided to create my own version. I think, <em>think</em>, that just before I started it I somehow managed to get hold of an 80386 PC. My parents must have bought it. I know at some point I sold my BBC for something PC related but I, <em>again think</em>, that was to upgrade the 386 to an 80486.</p>
                    <p className="mb-4">In any case... enter.... MouseTrek!</p>
                </div>
            </div>
            <div className="flex flex-row justify-between items-center">
                <h2 className="text-2xl font-bold mb-4">MouseTrek</h2>
                <div className={"my-4"}><GameButton color="orange-600" title="Play online" onClick={() => navigate('/mstrek')} /></div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
                <img src={msTrek1} alt="Screenshot of MouseTrek"/>
                <img src={msTrek2} alt="Screenshot of MouseTrek"/>
                <img src={msTrek3} alt="Screenshot of MouseTrek"/>
                <img src={msTrek4} alt="Screenshot of MouseTrek"/>
            </div>
            <p className="mb-4">
                I think I started working on the first version in 1990 and at the time Graphical User Interfaces and mice were all the rage.
                They were new to most of us, Mac's were very rarely seen in the UK (I can't remember ever seeing one in the UK in the 1980s and early 1990s), and Windows 1.x and 2.x didn't really ship with PCs. Not the ones I came across anyway.
                However I'd been looking on in envy at the <a className="text-orange-600 hover:text-orange-400" href="https://en.wikipedia.org/wiki/Acorn_Archimedes">Acorn Archimedes</a> and <a className="text-orange-600 hover:text-orange-400" href="https://en.wikipedia.org/wiki/GEM_(desktop_environment)">Gem</a> shipped with the PC 1512 and so I'd experienced the power of this crazy new <a className="text-orange-600 hover:text-orange-400" href="https://en.wikipedia.org/wiki/WIMP_(computing)">WIMP</a> stuff.
            </p>
            <p className="mb-4">I think I had Windows 3.0 on the 386 PC but nobody really created games for that back then and my recollection is that even if I wanted to that prior to <a className="text-orange-600 hover:text-orange-400" href="https://winworldpc.com/product/quick-c/10-for-windows">Microsoft Quick C for Windows</a> the compilers that supported that were rather expensive and out of newspaper round territory. So DOS was the obvious choice. Only choice really.</p>
            <p className="mb-4">Probably seems odd to someone today but WIMP was the AI of the late 1980s and early 1990s. You couldn't escape the term. It was a new way of thinking about computing to most of us and so I decided that my spin on the game should try and take things forward a step and make use of this newfangled technology. In 2025 as I write this its probably hard to wrap your head around, I'm struggling, but back then their weren't really frameworks for this stuff and so my first hurdle was getting a mouse and basic UI working. It all had to be written from scratch - including interacting with the mouse (good old Int86 as I recall).
            </p>
            <p className="mb-4">
                So yeah, it was quite a bit of work. I can't actually remember how long it took - I was still at school (be about 14 years old I think) so it was all done around school and other people using the family computer.
            </p>
            <p className="mb-4">
                Sadly somewhere along the way I lost the source code - I found it, weirdly without the mouse code - I think I might have written that as a lib, about 15 years back then promptly lost it again.
                I've also lost the executable of the "released" version but I did manage to find my "work in progress version 2", which I started work on in 1992, and for which I'd added missions and, taking inspiration from The Best of Both Worlds, the ability
                to do the same trick with the deflectors. Sadly its not really very balanced and the missions get in the way. But you can play it <a className="text-orange-600 hover:text-orange-400" href="/mstrek">online in DosBox here</a>.
            </p>
            <p className="mb-4">
                In some ways I owe my career to this game - 2 years later I sent the source code on a 3.5" floppy disc to a business that had advertised for a developer in the local newspaper and I got the job.
                The pay was truly dreadful (I was paid less than I was paid for cleaning warehouses, and less than what in the UK we would now call the "minimum wage" even adjusting for inflation) but I had an absolute blast working on a scripting engine (I didn't know it was a scripting engine but thats what we'd call it now), a graphics engine for the PC and code to run on an embedded device pretty much as the only developer.
                Seriously. It was a very different time (and I think one of the things we've lost along the way is the belief that tiny teams, even solo developers, can get a lot done - they could then and they can now).
            </p>
            <h2 className="text-2xl font-bold my-4">Padd Trek</h2>
            <div className="grid grid-cols-4 gap-4 mb-4">
                <img src={paddTrek1} alt="Screenshot of Padd Trek"/>
                <img src={paddTrek2} alt="Screenshot of Padd Trek"/>
                <img src={paddTrek3} alt="Screenshot of Padd Trek"/>
                <img src={paddTrek4} alt="Screenshot of Padd Trek"/>
            </div>
            <p className="mb-4">
                Ok. So now we need to spin forward to 2011(ish). In between MouseTrek and 2011 I'd created, but not finished, multiple versions of the game as I'd come to use it
                as a tool for learning and experimenting with various programming languages. I think the closest one I came to completing was a version for Windows 3.1 that was
                written directly against the API (ahh the message loop, WM_* messages, you probably had to be there...) using <a className="text-orange-600 hover:text-orange-400" href="https://winworldpc.com/product/quick-c/10-for-windows">Microsoft QuickC for Windows</a> which was (I think) the
                first affordable compiler for Windows that actually ran in Windows. I could be misremembering but before then I seem to remember having to use Microsoft C in DOS.
            </p>
            <p className="mb-4">
                Other versions I recall working on are versions in <a className="text-orange-600 hover:text-orange:400" href="https://en.wikipedia.org/wiki/Visual_Basic_(classic)">Visual Basic</a>, maybe one in <a className="text-orange-600 hover:text-orange-400" href="https://en.wikipedia.org/wiki/Delphi_(software)">Delphi</a> and one in <a className="text-orange-600 hover:text-orange-400" href="https://en.wikipedia.org/wiki/Ruby_(programming_language)">Ruby</a>.
                I'm also pretty sure I got a fair way through one in C++ aimed at KDE on Linux - but the details of that are vague to say the least.
                In any case none of these got completed and didn't and don't feel slightly bad about - completing was never the point.
            </p>
            <p className="mb-4">
                In any case in 2011 I'd got myself an iPad. I'd already written a few apps for the iPhone and wanted to have a go at something for the iPad. The name, if you're a Star Trek fan, is a bit of a pun: the game is for the iPad and on Star Trek they would carry arounmd PADDs. Hence: Padd Trek.
                Unfortunately the source code situation for this is as bad as for MouseTrek. I've lost it. At the time I was quite short on cash and I seem to remember having to close my first paid GitHub account as a result and it wasn't open source. Details are vague. Wasn't a great period of my life to be honest.
                I recall popping it onto a hard drive but I don't seem able to locate it any longer.
            </p>
            <p className="mb-4">
                And its also no longer playable - I pulled it from the App Store as it just became a pain updating it to support the ever expanding range of devices that Apple was releasing. Screen sizes. Retina displays. It just got all a bit painful.
                It was written in Objective-C using AppKit and I think I started it before they began to introduce more usable layout systems so it was all a bit awkward.
            </p>
            <p className="mb-4">
                I do remember it didn't take that long to create and it saw quite a lot of downloads - I <em>think</em> it was a free download. I added iPhone support to it too, pictured below - though I think in retrospect this is the straw that broke the camels back in terms of my ability to maintain it.
            </p>
            <div className="grid grid-cols-5 gap-4 mb-4">
                <img src={paddTrekPhone1} alt="Screenshot of Padd Trek"/>
                <img src={paddTrekPhone2} alt="Screenshot of Padd Trek"/>
                <img src={paddTrekPhone3} alt="Screenshot of Padd Trek"/>
                <img src={paddTrekPhone4} alt="Screenshot of Padd Trek"/>
                <img src={paddTrekPhone5} alt="Screenshot of Padd Trek"/>
            </div>
            <h2 className="text-2xl font-bold my-4">Epilogue</h2>
            <p className="mb-4">
                I've continued to dabble with versions of the game since Padd Trek. I got someway through one in C#, I had a go at a version using F# and Fable and eventually ended up writing this version here, imaginatively called TS Trek because its written in TypeScript.
            </p>
            <p className="mb-4">
                This one I wrote mostly to dabble with AI and experiment with a visual style over a lazy weekend. I doubt its the last version I will create.
            </p>
        </div>)
}