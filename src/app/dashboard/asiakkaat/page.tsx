import { Users, Plus, Search } from "lucide-react";

export default function AsiakkaatPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Asiakkaat</h1>
          <p className="text-zinc-500 mt-1">Hallitse asiakasrekisteriäsi</p>
        </div>
        <button className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-rose-600 transition-colors">
          <Plus className="w-4 h-4" />
          Lisää asiakas
        </button>
      </div>

      {/* Haku */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Hae asiakkaita..."
          className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      {/* Asiakastaulukko */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-zinc-50 border-b border-zinc-100 text-xs font-medium text-zinc-500 uppercase tracking-wide">
          <span>Nimi</span>
          <span>Puhelin</span>
          <span>Viimeinen käynti</span>
          <span>Status</span>
        </div>
        <div className="text-center py-16 text-zinc-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Ei asiakkaita vielä</p>
          <p className="text-xs mt-1">Lisää ensimmäinen asiakas yllä olevasta napista</p>
        </div>
      </div>
    </div>
  );
}
