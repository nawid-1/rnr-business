import {
  Users,
  TrendingUp,
  Receipt,
  Megaphone,
  ArrowUpRight,
  Calendar,
} from "lucide-react";

const stats = [
  {
    label: "Asiakkaat yhteensä",
    value: "0",
    change: "+0%",
    icon: Users,
    color: "bg-blue-500",
  },
  {
    label: "Tämän kuun liikevaihto",
    value: "0 €",
    change: "+0%",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    label: "Avoimet laskut",
    value: "0",
    change: "0 €",
    icon: Receipt,
    color: "bg-orange-500",
  },
  {
    label: "Some-seuraajat",
    value: "–",
    change: "Yhdistä some",
    icon: Megaphone,
    color: "bg-rose-500",
  },
];

const quickActions = [
  { label: "Lisää asiakas", href: "/dashboard/asiakkaat" },
  { label: "Luo lasku", href: "/dashboard/talous" },
  { label: "Julkaise postaus", href: "/dashboard/markkinointi" },
  { label: "Kysy AI:lta", href: "/dashboard/ai" },
];

export default function DashboardPage() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("fi-FI", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">
          Hyvää päivää! 👋
        </h1>
        <p className="text-zinc-500 mt-1 capitalize">{dateStr}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-zinc-400">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100 mb-8">
        <h2 className="font-semibold text-zinc-900 mb-4">Pikatoiminnot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:border-rose-200 hover:bg-rose-50 transition-colors group"
            >
              <span className="text-sm font-medium text-zinc-700 group-hover:text-rose-600">
                {action.label}
              </span>
              <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-rose-500" />
            </a>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900">Tulevat tapahtumat</h2>
        </div>
        <div className="text-center py-8 text-zinc-400">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Ei tulevia tapahtumia</p>
        </div>
      </div>
    </div>
  );
}
