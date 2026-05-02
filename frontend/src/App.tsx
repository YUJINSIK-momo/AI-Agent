import { useState, type ReactNode } from "react"
import { Building2, LayoutDashboard, Settings2 } from "lucide-react"
import AIAgentDashboard from "@/components/AIAgentDashboard"
import OfficeScene from "@/components/OfficeScene"
import { CompanySettingsScreen } from "@/components/CompanySettingsPanel"
import "./index.css"

type View = "dashboard" | "office" | "settings"

export default function App() {
  const [view, setView] = useState<View>("dashboard")

  return (
    <div className="flex min-h-screen flex-col bg-[#06070f] text-white">
      <header className="sticky top-0 z-[100] flex h-11 shrink-0 items-center justify-center border-b border-white/10 bg-[#080910]/95 px-3 backdrop-blur-md">
        <nav
          className="flex flex-wrap items-center justify-center gap-0.5 rounded-xl border border-white/12 bg-black/45 p-0.5 shadow-lg shadow-black/30"
          aria-label="앱 화면 전환"
        >
          <ViewBtn
            label="대시보드"
            icon={<LayoutDashboard className="h-3.5 w-3.5" aria-hidden />}
            active={view === "dashboard"}
            onClick={() => setView("dashboard")}
          />
          <ViewBtn
            label="오피스"
            icon={<Building2 className="h-3.5 w-3.5" aria-hidden />}
            active={view === "office"}
            onClick={() => setView("office")}
          />
          <ViewBtn
            label="회사 설정"
            icon={<Settings2 className="h-3.5 w-3.5" aria-hidden />}
            active={view === "settings"}
            onClick={() => setView("settings")}
          />
        </nav>
      </header>
      <div
        className={`flex min-h-0 w-full flex-1 flex-col ${
          view === "office" ? "overflow-hidden" : "overflow-x-hidden overflow-y-auto"
        }`}
      >
        {view === "office" && <OfficeScene />}
        {view === "dashboard" && <AIAgentDashboard />}
        {view === "settings" && <CompanySettingsScreen />}
      </div>
    </div>
  )
}

function ViewBtn({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
        active ? "bg-amber-500 text-black shadow-md shadow-amber-500/25" : "text-white/45 hover:bg-white/10 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
