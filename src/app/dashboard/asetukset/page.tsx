import { Settings, User, Bell, Shield, Palette } from "lucide-react";

const sections = [
  { icon: User, label: "Profiili", desc: "Nimi, sähköposti, salasana" },
  { icon: Bell, label: "Ilmoitukset", desc: "Sähköposti- ja push-ilmoitukset" },
  { icon: Shield, label: "Tietoturva", desc: "Kaksivaiheinen tunnistautuminen" },
  { icon: Palette, label: "Ulkoasu", desc: "Teema ja värit" },
];

export default function AsetuksetPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Asetukset</h1>
        <p className="text-zinc-500 mt-1">Hallitse tilisi asetuksia</p>
      </div>

      <div className="max-w-2xl space-y-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.label}
              className="bg-white rounded-xl p-5 shadow-sm border border-zinc-100 flex items-center justify-between hover:border-rose-200 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                  <Icon className="w-5 h-5 text-zinc-500 group-hover:text-rose-500 transition-colors" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900">{section.label}</p>
                  <p className="text-sm text-zinc-400">{section.desc}</p>
                </div>
              </div>
              <Settings className="w-4 h-4 text-zinc-300 group-hover:text-rose-400 transition-colors" />
            </div>
          );
        })}
      </div>

      <div className="mt-8 max-w-2xl bg-zinc-900 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">
            RNR
          </div>
          <div>
            <p className="font-semibold text-white text-sm">RNR Business</p>
            <p className="text-xs text-zinc-400">Super Admin · Ilmainen tili</p>
          </div>
        </div>
        <p className="text-xs text-zinc-500">Versio 1.0.0 · Rakennettu Claude AI:lla</p>
      </div>
    </div>
  );
}
