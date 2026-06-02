import { Receipt, Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const summaryCards = [
  { label: "Liikevaihto (kk)", value: "0 €", icon: TrendingUp, color: "bg-green-500" },
  { label: "Kulut (kk)", value: "0 €", icon: TrendingDown, color: "bg-red-500" },
  { label: "Avoimet laskut", value: "0 €", icon: Receipt, color: "bg-orange-500" },
  { label: "Tulos (kk)", value: "0 €", icon: DollarSign, color: "bg-blue-500" },
];

export default function TalousPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Talous</h1>
          <p className="text-zinc-500 mt-1">Laskut, kulut ja raportit</p>
        </div>
        <button className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-rose-600 transition-colors">
          <Plus className="w-4 h-4" />
          Luo lasku
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100">
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-zinc-900">{card.value}</p>
              <p className="text-sm text-zinc-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">Laskut</h2>
        </div>
        <div className="text-center py-16 text-zinc-400">
          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Ei laskuja vielä</p>
          <p className="text-xs mt-1">Luo ensimmäinen lasku yllä olevasta napista</p>
        </div>
      </div>
    </div>
  );
}
