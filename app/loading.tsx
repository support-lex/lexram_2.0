export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] grid place-items-center bg-[#d8cdb8]"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-[#6b1e2d]/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#6b1e2d] animate-spin" />
        </div>
        <span className="font-serif text-[#6b1e2d]/80 text-sm tracking-[0.3em] uppercase">
          LexRam
        </span>
      </div>
    </div>
  );
}
