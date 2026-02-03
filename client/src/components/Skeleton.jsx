export default function Skeleton({ className = '', variant = 'text' }) {
    const baseClass = "bg-slate-800/50 animate-pulse rounded";

    const variants = {
        text: "h-4 w-full",
        title: "h-8 w-3/4 mb-4",
        circle: "h-12 w-12 rounded-full",
        rectangle: "h-32 w-full"
    };

    return (
        <div
            className={`${baseClass} ${variants[variant] || ''} ${className}`}
            aria-hidden="true"
        />
    );
}
