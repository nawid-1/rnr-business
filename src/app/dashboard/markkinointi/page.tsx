"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  Camera,
  Plus,
  Image as ImageIcon,
  BarChart2,
  MessageSquare,
  Send,
  Eye,
  Heart,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import type { SocialAccount, Post, Message } from "@/lib/supabase";

type Tab = "kanavat" | "postaukset" | "viestit" | "analytiikka";

export default function MarkkinointiPage() {
  const [tab, setTab] = useState<Tab>("kanavat");
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ content: "", platform: "both" });
  const [aiPrompt, setAiPrompt] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing");
      const data = await res.json();
      setAccounts(data.accounts || []);
      setPosts(data.posts || []);
      setMessages(data.messages || []);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  const fbAccount = accounts.find((a) => a.platform === "facebook");
  const igAccount = accounts.find((a) => a.platform === "instagram");
  const unreadMessages = messages.filter((m) => !m.is_read).length;

  function connectMeta() {
    window.location.href = "/api/auth/meta/login";
  }

  function connectInstagram() {
    window.location.href = "/api/auth/instagram/login";
  }

  async function disconnect(platform: "facebook" | "instagram") {
    const name = platform === "facebook" ? "Facebook" : "Instagram";
    if (!confirm(`Haluatko varmasti katkaista ${name}-yhteyden?`)) return;
    await fetch("/api/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect", platform }),
    });
    fetchData();
  }

  async function markAsRead(messageId: string) {
    await fetch("/api/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", messageId }),
    });
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, is_read: true } : m));
  }

  const statusIcon = (status: string) => {
    if (status === "published") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === "scheduled") return <Clock className="w-4 h-4 text-blue-500" />;
    if (status === "failed") return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <ImageIcon className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Markkinointi</h1>
          <p className="text-zinc-500 mt-1">Hallitse some-kanaviasi yhdessä paikassa</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-zinc-500" />
          </button>
          <button
            onClick={() => setShowNewPost(true)}
            className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-rose-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Uusi postaus
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-100 p-1 rounded-lg w-fit">
        {(["kanavat", "postaukset", "viestit", "analytiikka"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize relative ${
              tab === t ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t}
            {t === "viestit" && unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* KANAVAT */}
      {tab === "kanavat" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Facebook */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Facebook</p>
                {fbAccount ? (
                  <p className="text-xs text-green-500">✓ {fbAccount.page_name || fbAccount.account_name}</p>
                ) : (
                  <p className="text-xs text-zinc-400">Ei yhdistetty</p>
                )}
              </div>
            </div>
            {fbAccount ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Tili</span>
                  <span className="font-medium">{fbAccount.account_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Status</span>
                  <span className="text-green-500 font-medium">Aktiivinen</span>
                </div>
                <button
                  onClick={() => disconnect("facebook")}
                  className="w-full border border-red-200 text-red-600 rounded-lg py-2 text-sm hover:bg-red-50 transition-colors mt-2"
                >
                  Katkaise yhteys
                </button>
              </div>
            ) : (
              <button
                onClick={() => connectMeta()}
                className="w-full border border-blue-200 text-blue-600 rounded-lg py-2 text-sm hover:bg-blue-50 transition-colors"
              >
                Yhdistä Facebook
              </button>
            )}
          </div>

          {/* Instagram */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-rose-500 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Instagram</p>
                {igAccount ? (
                  <p className="text-xs text-green-500">✓ @{igAccount.account_name}</p>
                ) : (
                  <p className="text-xs text-zinc-400">Ei yhdistetty</p>
                )}
              </div>
            </div>
            {igAccount ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Tili</span>
                  <span className="font-medium">@{igAccount.account_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Status</span>
                  <span className="text-green-500 font-medium">Aktiivinen</span>
                </div>
                <button
                  onClick={() => disconnect("instagram")}
                  className="w-full border border-red-200 text-red-600 rounded-lg py-2 text-sm hover:bg-red-50 transition-colors mt-2"
                >
                  Katkaise yhteys
                </button>
              </div>
            ) : (
              <button
                onClick={() => connectInstagram()}
                className="w-full border border-purple-200 text-purple-600 rounded-lg py-2 text-sm hover:bg-purple-50 transition-colors"
              >
                Yhdistä Instagram
              </button>
            )}
          </div>
        </div>
      )}

      {/* POSTAUKSET */}
      {tab === "postaukset" && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-zinc-400">Ladataan...</div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-zinc-100">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-zinc-400 text-sm">Ei postauksia vielä</p>
              <button
                onClick={() => setShowNewPost(true)}
                className="mt-4 text-rose-500 text-sm hover:underline"
              >
                Luo ensimmäinen postaus
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl p-5 border border-zinc-100 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {statusIcon(post.status)}
                      <span className="text-xs text-zinc-400 capitalize">{post.platform}</span>
                      <span className="text-xs text-zinc-300">·</span>
                      <span className="text-xs text-zinc-400">
                        {new Date(post.created_at).toLocaleDateString("fi-FI")}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700">{post.content}</p>
                  </div>
                  <div className="flex gap-4 text-xs text-zinc-400 shrink-0">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes_count}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.comments_count}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.reach}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIESTIT */}
      {tab === "viestit" && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-zinc-400">Ladataan...</div>
          ) : messages.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-zinc-100">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-zinc-400 text-sm">Ei viestejä vielä</p>
              <p className="text-zinc-300 text-xs mt-1">Yhdistä some-kanavat nähdäksesi viestit</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition-colors ${
                  !msg.is_read ? "border-rose-200 bg-rose-50/30" : "border-zinc-100"
                }`}
                onClick={() => markAsRead(msg.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-zinc-900">{msg.sender_name}</span>
                      <span className="text-xs text-zinc-400 capitalize">{msg.message_type}</span>
                      {!msg.is_read && (
                        <span className="w-2 h-2 bg-rose-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-zinc-600">{msg.content}</p>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {new Date(msg.received_at).toLocaleDateString("fi-FI")}
                  </span>
                </div>
                {msg.is_replied && (
                  <div className="mt-2 pl-3 border-l-2 border-rose-200">
                    <p className="text-xs text-zinc-400">Vastattu: {msg.reply_content}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ANALYTIIKKA */}
      {tab === "analytiikka" && (
        <div className="bg-white rounded-xl p-12 text-center border border-zinc-100">
          <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-zinc-400 text-sm">Analytiikka näkyy kun some-kanavat on yhdistetty</p>
        </div>
      )}

      {/* Uusi postaus modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Uusi postaus</h2>

            {/* AI-avustaja */}
            <div className="mb-4 p-3 bg-rose-50 rounded-lg border border-rose-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-medium text-rose-700">AI kirjoittaa puolestasi</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="esim. tarjous hiustenleikkauksesta 20%"
                  className="flex-1 px-3 py-2 text-sm border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                <button
                  onClick={() => {
                    setNewPost((p) => ({
                      ...p,
                      content: `✨ Erikoistarjous! ${aiPrompt} - Varaa aikasi nyt! 📞 Ota yhteyttä tai varaa suoraan verkossa. #RNRSalonki #Kauneus #Hyvinvointi`,
                    }));
                    setAiPrompt("");
                  }}
                  className="px-3 py-2 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>

            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))}
              placeholder="Kirjoita postauksen teksti..."
              rows={5}
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
            />

            <div className="flex gap-2 mb-4">
              {["both", "facebook", "instagram"].map((p) => (
                <button
                  key={p}
                  onClick={() => setNewPost((prev) => ({ ...prev, platform: p }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    newPost.platform === p
                      ? "bg-rose-500 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {p === "both" ? "Molemmat" : p === "facebook" ? "Facebook" : "Instagram"}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewPost(false)}
                className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Peruuta
              </button>
              <button
                onClick={async () => {
                  if (!newPost.content.trim()) return;
                  await fetch("/api/marketing", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "create_post",
                      content: newPost.content,
                      platform: newPost.platform,
                    }),
                  });
                  setShowNewPost(false);
                  setNewPost({ content: "", platform: "both" });
                  fetchData();
                  setTab("postaukset");
                }}
                className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-sm hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Tallenna luonnos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
