import { Warehouse } from "lucide-react";

export function TriatraLogo() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-600 shadow-lg">
        <Warehouse className="w-7 h-7 text-white" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
          WH<span className="text-orange-600">TIX</span>
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
          Warehouse Ticketing
        </p>
      </div>
    </div>
  )
}
