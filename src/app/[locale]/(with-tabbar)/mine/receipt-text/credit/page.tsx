import Image from "next/image";

export default function CreditPage() {
  return (
    <div
      key={1}
      className="grid grid-cols-[1.2fr_0.8fr_1fr] px-3 py-3 border-b text-sm items-center"
    >
      {/* 来源 + 时间 */}
      <div className="leading-tight">
        <div className="text-foreground">签到</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          12-15 16:07:12
        </div>
      </div>

      {/* 金额 */}
      <div className="text-center font-medium text-red-500">
        200
      </div>

      {/* 余额 */}
      <div className="flex justify-end items-center gap-1 text-red-500 font-medium">
        20000
        <Image
          src="/ranking/coin.png"
          alt="coin"
          width={14}
          height={14}
          className="inline-block"
        />
      </div>
    </div>
  )
}
