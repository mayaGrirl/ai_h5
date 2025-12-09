export default function Today() {
  const list = [
    { rank: 1, name: "清秀的石头", value: "15,273,949" },
    { rank: 2, name: "肯定赢", value: "11,506,811" },
    { rank: 3, name: "666", value: "11,296,844" },
  ];

  return (
    <div className="space-y-2">
      {list.map((item) => (
        <div
          key={item.rank}
          className="flex items-center justify-between p-3 rounded-md bg-white shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-bold">{item.rank}</span>
            <span>{item.name}</span>
          </div>
          <span className="text-red-500 font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
