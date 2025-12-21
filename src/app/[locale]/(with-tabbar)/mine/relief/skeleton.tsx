export default function Skeleton() {
  return (
    <div className="grid grid-cols-[0.1fr_0.5fr_1fr] px-3 py-3 border-b text-sm items-center animate-pulse">
      {/* 等级 icon */}
      <div className="flex items-center justify-center">
        <div className="h-4 w-4 rounded-full bg-gray-300" />
      </div>

      {/* 可领取金币 */}
      <div className="flex justify-center">
        <div className="h-4 w-12 rounded bg-gray-300" />
      </div>

      {/* 说明 */}
      <div className="flex justify-center">
        <div className="h-4 w-40 rounded bg-gray-300" />
      </div>
    </div>
  );
}
