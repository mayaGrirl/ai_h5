import Image from "next/image";
import Medal from "@/components/medal";

export default function LastWeek() {
  const data = [
    {rank: 1, level: 1, name: "胡萝卜5266", score: "7,409,929"},
    {rank: 2, level: 2, name: "极大极小。", score: "7,373,236"},
    {rank: 3, level: 3, name: "妹子", score: "7,339,776"},
    {rank: 4, level: 4, name: "赢点外快", score: "7,083,357"},
    {rank: 5, level: 5, name: "清秀的石头", score: "6,987,563"},
    {rank: 6, level: 6, name: "kWntpdA06076", score: "6,944,932"},
    {rank: 7, level: 7, name: "一场空", score: "6,893,473"},
    {rank: 8, level: 8, name: "黑猫524", score: "6,777,962"},
    {rank: 9, level: 9, name: "感动的跳跳糖", score: "6,768,791"},
    {rank: 10, level: 2, name: "仙人掌2472", score: "6,756,124"},
    {rank: 11, level: 4, name: "草你大爷", score: "6,722,628"},
    {rank: 12, level: 6, name: "kWntpdA06076", score: "6,944,932"},
    {rank: 13, level: 7, name: "一场空", score: "6,893,473"},
    {rank: 14, level: 8, name: "黑猫524", score: "6,777,962"},
    {rank: 15, level: 9, name: "感动的跳跳糖", score: "6,768,791"},
    {rank: 16, level: 2, name: "仙人掌2472", score: "6,756,124"},
    {rank: 17, level: 4, name: "草你大爷", score: "6,722,628"},
    {rank: 18, level: 8, name: "黑猫524", score: "6,777,962"},
    {rank: 19, level: 9, name: "感动的跳跳糖", score: "6,768,791"},
    {rank: 20, level: 9, name: "跳跳糖", score: "6,768,791"},
    {rank: 30, level: 2, name: "仙人掌2472", score: "6,756,124"},
    {rank: 31, level: 4, name: "草你大爷", score: "6,722,628"},
    {rank: 32, level: 6, name: "kWntpdA06076", score: "6,944,932"},
    {rank: 33, level: 7, name: "一场空", score: "6,893,473"},
    {rank: 34, level: 8, name: "黑猫524", score: "6,777,962"},
    {rank: 35, level: 9, name: "感动的跳跳糖", score: "6,768,791"},
    {rank: 36, level: 2, name: "仙人掌2472", score: "6,756,124"},
    {rank: 37, level: 4, name: "草你大爷", score: "6,722,628"},
    {rank: 38, level: 8, name: "黑猫524", score: "6,777,962"},
    {rank: 39, level: 9, name: "感动的跳跳糖", score: "6,768,791"},
    {rank: 40, level: 9, name: "跳跳糖", score: "6,768,791"},
  ];

  return (
    <div className="bg-white">
      {data.map((item) => (
        <div
          key={item.rank}
          className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
        >
          {/* 左侧：排名 + 图标 + 名称 */}
          <div className="flex items-center space-x-3">
            <Medal rank={item.rank}/>

            {/* 图标 */}
            <Image className="inline-block" src={`/ranking/vip/${item.level}.png`} alt={item.name} width={20}
                   height={20}/>

            {/* 名称 */}
            <div className="text-gray-800 text-sm">{item.name}</div>
          </div>

          {/* 右侧：分数 */}
          <div className="flex items-center space-x-1">
            <span className="text-red-500 font-semibold text-sm">
              {item.score}
            </span>
            <Image
              className="inline-block w-[13px] h-[13px]"
              src="/ranking/coin.png"
              alt="gold"
              width={13}
              height={13}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
