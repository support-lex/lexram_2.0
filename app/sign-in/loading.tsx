import { Scale } from 'lucide-react';

export default function Loading() {
  return (
    <div className="h-screen w-full grid place-items-center bg-[#fff0df]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-[#680318]">
          <Scale className="w-7 h-7" />
          <span className="font-serif font-bold text-2xl tracking-tight">LexRam</span>
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-[#680318]/10">
          <div className="h-full w-1/3 animate-[loading-bar_1s_ease-in-out_infinite] bg-[#680318]" />
        </div>
        <style>{`
          @keyframes loading-bar {
            0%   { transform: translateX(-100%); }
            50%  { transform: translateX(60%); }
            100% { transform: translateX(220%); }
          }
        `}</style>
      </div>
    </div>
  );
}