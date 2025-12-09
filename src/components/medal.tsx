type MedalProps = {
  rank: number;
  className?: string;
};

const medalStyles: Record<number, string> = {
  1: "bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900",
  2: "bg-gradient-to-br from-blue-300 to-blue-500 text-blue-950",
  3: "bg-gradient-to-br from-green-300 to-green-500 text-green-950"
};

export default function Medal({ rank, className }: MedalProps) {
  const base =
    "inline-flex items-center justify-center rounded-full text-xs font-bold w-6 h-6 shadow-sm";
  const color = medalStyles[rank] ?? "bg-gray-200 text-gray-700";

  return (
    <span className={`${base} ${color} ${className ?? ""}`}>
      {rank}
    </span>
  );
}
