import { Share2, Camera, Plus, Image as ImageIcon, BarChart2 } from "lucide-react";

export default function MarkkinointiPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Markkinointi</h1>
          <p className="text-zinc-500 mt-1">Hallitse some-kanaviasi yhdessä paikassa</p>
        </div>
        <button className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-rose-600 transition-colors">
          <Plus className="w-4 h-4" />
          Uusi postaus
        </button>
      </div>

      {/* Some-kanavat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Facebook</p>
              <p className="text-xs text-zinc-400">Ei yhdistetty</p>
            </div>
          </div>
          <button className="w-full border border-blue-200 text-blue-600 rounded-lg py-2 text-sm hover:bg-blue-50 transition-colors">
            Yhdistä Facebook
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-rose-500 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Instagram</p>
              <p className="text-xs text-zinc-400">Ei yhdistetty</p>
            </div>
          </div>
          <button className="w-full border border-purple-200 text-purple-600 rounded-lg py-2 text-sm hover:bg-purple-50 transition-colors">
            Yhdistä Instagram
          </button>
        </div>
      </div>

      {/* Postaukset */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-4 h-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900">Viimeisimmät postaukset</h2>
        </div>
        <div className="text-center py-8 text-zinc-400">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Yhdistä some-kanavat nähdäksesi postaukset</p>
        </div>
      </div>

      {/* Analytiikka */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900">Analytiikka</h2>
        </div>
        <div className="text-center py-8 text-zinc-400">
          <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Ei dataa vielä — yhdistä some-kanavat</p>
        </div>
      </div>
    </div>
  );
}
