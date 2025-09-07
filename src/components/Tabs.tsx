type Props = {
    disabled?:boolean
    activeTab:string;
    className?: string;
    tabs: { key:string, label:string }[];
    onTabChange: (tabKey: string) => void;
};

export function Tabs({disabled, activeTab, tabs, onTabChange, className}: Props) {
    return (
        <div className={`flex w-full relative ${className ?? ''}`}>
            {tabs.map((tab, index) => {
                const isActive = activeTab === tab.key;
                const isFirst = index === 0;
                const isLast = index === tabs.length - 1;
                const isSingle = isFirst && isLast;

                // Build classes for the clip-path based on position
                let clipPathClass = "";
                let paddingClass = "";
                let marginClass = "";
                let zIndexClass = "";

                if (isSingle) {
                    // Single tab - no clipping needed
                    paddingClass = "px-4";
                } else if (isFirst) {
                    // First tab (left side with right diagonal cut)
                    clipPathClass = "[clip-path:polygon(0_0,100%_0,calc(100%-20px)_100%,0_100%)]";
                    paddingClass = "pl-4 pr-8";
                    marginClass = "-mr-5";
                    zIndexClass = "z-30";
                } else if (isLast) {
                    // Last tab (right side with left diagonal cut)
                    clipPathClass = "[clip-path:polygon(20px_0,100%_0,100%_100%,0_100%)]";
                    paddingClass = "pl-8 pr-4";
                    marginClass = "-ml-5";
                    zIndexClass = "z-10";
                } else {
                    // Middle tabs (both sides cut diagonally)
                    clipPathClass = "[clip-path:polygon(20px_0,100%_0,calc(100%-20px)_100%,20px_100%)]";
                    paddingClass = "px-8";
                    marginClass = "-mx-5";
                    zIndexClass = "z-20";
                }

                const baseClasses = "py-1 flex-1 relative";
                const activeClasses = isActive ? "bg-gamewhite text-black font-bold" : "cursor-pointer bg-gray-800";

                return (
                    <button
                        key={tab.key}
                        disabled={disabled}
                        className={`${baseClasses} ${clipPathClass} ${paddingClass} ${marginClass} ${zIndexClass} ${activeClasses}`}
                        onClick={() => onTabChange(tab.key)}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
