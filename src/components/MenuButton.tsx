export default function MenuButton({title, color, onClick, disabled} : {title:string, color?:string, onClick?: () => void, disabled?: boolean}) {
    const resolvedColor = color ?? "white";
    return (
        <button disabled={disabled ?? false} type="button" className={`text-xl font-orbitron btn btn-${resolvedColor} text-gamewhite border border-gamewhite px-8 py-1 bg-black hover:bg-gray-800 disabled:bg-gray-500 disabled:text-gray-300`} onClick={onClick}>
            {title}
        </button>
    );
}