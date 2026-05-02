import { getFallbackRooms } from "@/lib/officeLayout"

type OfficeFloorProps = {
  /** root: absolute inset-0 (씬 안) | static (미니맵용 래퍼가 relative일 때) */
  variant?: "absolute" | "fill"
  className?: string
  roundedClassName?: string
}

/**
 * office_background.png + 폴백 격자. 메인 오피스 / 대시보드 미니맵 공통.
 */
export function OfficeFloor({ variant = "absolute", className = "", roundedClassName = "rounded-xl" }: OfficeFloorProps) {
  const wrap =
    variant === "absolute"
      ? `absolute inset-0 overflow-hidden ${roundedClassName} ${className}`
      : `relative h-full w-full overflow-hidden ${roundedClassName} ${className}`

  return (
    <div className={wrap}>
      <div className="absolute inset-0" style={{ background: "#0d0f1c" }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
            backgroundSize: "36px 36px",
            opacity: 0.5,
          }}
        />
        {getFallbackRooms().map(r => (
          <div
            key={r.label}
            className="absolute flex items-end justify-center pb-1.5"
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: `${r.w}%`,
              height: `${r.h}%`,
              border: `1.5px solid ${r.color}35`,
              background: `${r.color}0d`,
              borderRadius: "8px",
            }}
          >
            <span className="text-[8px] font-bold tracking-widest uppercase" style={{ color: `${r.color}55` }}>
              {r.label}
            </span>
          </div>
        ))}
      </div>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/img/office_background.png')" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 100px rgba(0,0,0,0.22)" }}
        aria-hidden
      />
    </div>
  )
}
