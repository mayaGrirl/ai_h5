export default function Skeleton({lines = 10,}: {
  lines?: number;
}) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({length: lines}).map((_, i) => (
        <div
          key={i}
          className={`h-4 rounded bg-gray-300 ${
            i % 3 === 0 ? "w-3/4" : i % 3 === 1 ? "w-full" : "w-5/6"
          }`}
        />
      ))}
    </div>
  );
}
