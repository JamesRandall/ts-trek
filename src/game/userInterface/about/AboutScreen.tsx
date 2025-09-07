import {Tabs} from "../../../components/Tabs.tsx";
import {useEffect, useState} from "react";
import {HowToPlay} from "./HowToPlay.tsx";
import {History} from "./History.tsx";
import {Credits} from "./Credits.tsx";
import {Route, Routes, useLocation, useNavigate} from "react-router-dom";
import GameButton from "../../../components/GameButton.tsx";

type TabKeys = "howToPlay" | "history" | "credits";

export default function AboutScreen() {
    const [activeTab, setActiveTab] = useState<TabKeys>("howToPlay");
    const navigate = useNavigate();
    const location = useLocation();


    useEffect(() => {
        // Map current route to tab key
        const pathToTabMap: Record<string, TabKeys> = {
            '/about': 'howToPlay',
            '/about/history': 'history',
            '/about/credits': 'credits'
        };

        const currentTab = pathToTabMap[location.pathname];
        if (currentTab) {
            setActiveTab(currentTab);
        }

    }, [location.pathname, setActiveTab]);

    const handleTabChange = (key: TabKeys) => {
        setActiveTab(key as TabKeys);
        switch(key) {
            case 'howToPlay':
                navigate('/about');
                break;
            case 'history':
                navigate('/about/history');
                break;
            case 'credits':
                navigate('/about/credits');
                break;
        }
    }

    return (

            <div className="text-gamewhite absolute flex flex-col justify-center items-center z-20 left-0 top-0 right-0 bottom-0 gap-4">
                <div className="border-2 border-gamewhite grid grid-rows-[auto_1fr]" style={{width: "80vw", height: "80vh"}}>
                    <Tabs
                        className="border-b-2 border-gamewhite"
                        tabs={[
                            {key: 'howToPlay', label: 'How to play' },
                            {key: 'history', label: 'History' },
                            {key: 'credits', label: 'Credits' }
                        ]}
                        activeTab={activeTab}
                        onTabChange={(key) => handleTabChange(key as TabKeys)}
                    />
                    <div className="p-3 overflow-y-auto overflow-x-hidden" style={{backgroundColor: "rgba(0,0,0,0.8)"}}>
                        <Routes>
                            <Route path="/" element={<HowToPlay/>} />
                            <Route path="/history" element={<History/>} />
                            <Route path="/credits" element={<Credits/>} />
                        </Routes>
                    </div>
                </div>
                <div className="flex flex-row justify-end" style={{width: "80vw"}}>
                    <div className="w-40"><GameButton title="Back" isBlock={true} onClick={() => navigate('/')} /></div>
                </div>
            </div>

    )
}