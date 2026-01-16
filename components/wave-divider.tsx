export default function WaveDivider({ color = '#ffffff', flip = false, className = '' }: { color?: string; flip?: boolean; className?: string }) {
    return (
        <div className={`overflow-hidden leading-0 ${className}`} aria-hidden>
            <svg
                viewBox="0 0 1440 100"
                preserveAspectRatio="none"
                className="h-full w-full"
            >
                <path
                    d="M0,60 C480,120 960,0 1440,60 L1440,101 L0,101 Z"
                    fill={color}
                    transform={flip ? `rotate(180 720 50)` : undefined}
                />
            </svg>
        </div>
    )
}
