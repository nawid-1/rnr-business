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

type AnalyticsRow = {
  id: string;
  platform: string;
  date: string;
  followers_count: number;
  total_likes: number;
  total_comments: number;
  media_count: number;
  total_reach: number;
  total_impressions: number;
};

type FeedItem = {
  platform: "facebook" | "instagram";
  id: string;
  message: string;
  created_time: string;
  image: string | null;
  permalink: string | null;
  likes: number | null;
  comments: number | null;
  media_type: string | null;
};

type Tab = "kanavat" | "postaukset" | "viestit" | "analytiikka";

export default function MarkkinointiPage() {
  const [tab, setTab] = useState<Tab>("kanavat");
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>("");

  async function fetchFeed() {
    setFeedLoading(true);
    try {
      const res = await fetch("/api/marketing/feed");
      const data = await res.json();
      setFeedItems(data.items || []);
    } catch {
      // ignore
    }
    setFeedLoading(false);
    setFeedLoaded(true);
  }

  async function refreshAnalytics() {
    setRefreshingAnalytics(true);
    try {
      await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh_analytics" }),
      });
      await fetchData();
    } catch {
      // ignore
    }
    setRefreshingAnalytics(false);
  }
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ content: "", platform: "both", image_url: "" });
  const [aiPrompt, setAiPrompt] = useState("");
  const [publishing, setPublishing] = useState<string | null>(null);

  async function publishPost(postId: string) {
    setPublishing(postId);
    try {
      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish_post", postId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Julkaisu epäonnistui: " + (data.error || "tuntematon virhe"));
      }
      await fetchData();
    } catch (e) {
      alert("Julkaisu epäonnistui: " + String(e));
    }
    setPublishing(null);
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Päivitä analytiikka automaattisesti kun välilehti avataan ensimmäisen kerran.
  // Näin luvut ovat aina tuoreita ilman että käyttäjän tarvitsee klikata mitään.
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  useEffect(() => {
    if (tab === "analytiikka" && !autoRefreshed && accounts.length > 0) {
      setAutoRefreshed(true);
      refreshAnalytics();
    }
    if (tab === "postaukset" && !feedLoaded && accounts.length > 0) {
      fetchFeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, accounts.length]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing");
      const data = await res.json();
      setAccounts(data.accounts || []);
      setPosts(data.posts || []);
      setMessages(data.messages || []);
      setAnalytics(data.analytics || []);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  const fbAccount = accounts.find((a) => a.platform === "facebook");
  const igAccount = accounts.find((a) => a.platform === "instagram");
  const draftPosts = posts.filter((p) => p.status !== "published");
  const unreadMessages = messages.filter((m) => !m.is_read).length;
  const activeChannel = selectedChannel || accounts[0]?.platform || "";

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
    // Poista katkaistun kanavan julkaisut myös feed-listalta heti
    setFeedItems((prev) => prev.filter((i) => i.platform !== platform));
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
        <div className="space-y-8">
          {/* OSIO 1 — Luonnokset & ajastetut (alustalla luodut, ei vielä julkaistut) */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Luonnokset & ajastetut</h2>
                <p className="text-xs text-zinc-400">Alustalla luodut postaukset, joita ei ole vielä julkaistu</p>
              </div>
              <button
                onClick={() => setShowNewPost(true)}
                className="flex items-center gap-1.5 text-sm text-rose-500 hover:text-rose-600"
              >
                <Plus className="w-4 h-4" />
                Uusi
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-zinc-400 text-sm">Ladataan…</div>
            ) : draftPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-dashed border-zinc-200">
                <ImageIcon className="w-7 h-7 mx-auto mb-2 opacity-30" />
                <p className="text-zinc-400 text-sm">Ei luonnoksia</p>
                <button
                  onClick={() => setShowNewPost(true)}
                  className="mt-3 text-rose-500 text-sm hover:underline"
                >
                  Luo ensimmäinen postaus
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {draftPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl p-5 border border-zinc-100 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {statusIcon(post.status)}
                          <span className="text-xs text-zinc-400 capitalize">{post.platform}</span>
                          <span className="text-xs text-zinc-300">·</span>
                          <span className="text-xs text-zinc-400">
                            {new Date(post.created_at).toLocaleDateString("fi-FI")}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-700">{post.content}</p>
                        {post.image_url && (
                          <p className="text-xs text-zinc-400 mt-1 truncate">🖼 {post.image_url}</p>
                        )}
                      </div>
                      <button
                        onClick={() => publishPost(post.id)}
                        disabled={publishing === post.id}
                        className="flex items-center gap-1.5 bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-rose-600 transition-colors disabled:opacity-50 shrink-0"
                      >
                        <Send className="w-3 h-3" />
                        {publishing === post.id ? "Julkaistaan…" : "Julkaise"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* OSIO 2 — Julkaistut some-kanavilla (haetaan suoraan Facebookista & Instagramista) */}
          {accounts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">Julkaistut some-kanavilla</h2>
                  <p className="text-xs text-zinc-400">Eritelty kanavittain — seuraa yhdistettyjä kanavia automaattisesti</p>
                </div>
                <button
                  onClick={fetchFeed}
                  disabled={feedLoading}
                  className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${feedLoading ? "animate-spin" : ""}`} />
                  Päivitä
                </button>
              </div>

              {feedLoading && feedItems.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-sm">Ladataan julkaisuja…</div>
              ) : (
                <div>
                  {/* Kanavavalitsin (välilehdet) */}
                  <div className="flex gap-1 mb-4 bg-zinc-100 p-1 rounded-lg w-fit">
                    {accounts.map((acc) => {
                      const isFb = acc.platform === "facebook";
                      const active = activeChannel === acc.platform;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => setSelectedChannel(acc.platform)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            active ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                          }`}
                        >
                          <span className={`w-4 h-4 rounded flex items-center justify-center ${isFb ? "bg-blue-600" : "bg-gradient-to-br from-purple-500 to-rose-500"}`}>
                            {isFb ? <Share2 className="w-2.5 h-2.5 text-white" /> : <Camera className="w-2.5 h-2.5 text-white" />}
                          </span>
                          <span className="capitalize">{acc.platform}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Valitun kanavan sisältö */}
                  {(() => {
                    const acc = accounts.find((a) => a.platform === activeChannel);
                    if (!acc) return null;
                    const isFb = acc.platform === "facebook";
                    const channelItems = feedItems.filter((i) => i.platform === activeChannel);
                    const latest = analytics
                      .filter((a) => a.platform === activeChannel)
                      .sort((a, b) => b.date.localeCompare(a.date))[0];
                    const totalLikes = channelItems.reduce((s, i) => s + (i.likes ?? 0), 0);
                    const totalComments = channelItems.reduce((s, i) => s + (i.comments ?? 0), 0);
                    const hasEngagement = channelItems.some((i) => i.likes !== null);

                    return (
                      <div>
                        {/* Tilastot valitulle kanavalle */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div className="bg-white rounded-xl p-4 border border-zinc-100 shadow-sm text-center">
                            <p className="text-xl font-bold text-zinc-900">{latest ? latest.followers_count.toLocaleString("fi-FI") : "–"}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Seuraajaa</p>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-zinc-100 shadow-sm text-center">
                            <p className="text-xl font-bold text-zinc-900">{channelItems.length}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Julkaisua</p>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-zinc-100 shadow-sm text-center">
                            <p className="text-xl font-bold text-zinc-900">{hasEngagement ? totalLikes : "–"}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Tykkäystä</p>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-zinc-100 shadow-sm text-center">
                            <p className="text-xl font-bold text-zinc-900">{hasEngagement ? totalComments : "–"}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Kommenttia</p>
                          </div>
                        </div>

                        {/* Julkaisut valitulta kanavalta */}
                        {channelItems.length === 0 ? (
                          <div className="bg-white rounded-xl p-8 text-center border border-dashed border-zinc-200 text-sm text-zinc-400">
                            Ei julkaisuja tällä kanavalla
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl border border-zinc-100 shadow-sm divide-y divide-zinc-50">
                            {channelItems.map((item) => (
                              <a
                                key={item.id}
                                href={item.permalink || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 hover:bg-zinc-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                              >
                                {item.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                    <ImageIcon className="w-5 h-5 text-zinc-300" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-zinc-400 mb-0.5">
                                    {item.created_time ? new Date(item.created_time).toLocaleDateString("fi-FI") : ""}
                                  </p>
                                  <p className="text-sm text-zinc-700 truncate">
                                    {item.message || "(ei tekstiä)"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0 pl-2">
                                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                                    <Heart className="w-3 h-3" />
                                    {item.likes ?? "–"}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                                    <MessageSquare className="w-3 h-3" />
                                    {item.comments ?? "–"}
                                  </span>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                        {isFb && !hasEngagement && (
                          <p className="text-xs text-zinc-400 mt-2">
                            Facebookin tykkäykset ja kommentit avautuvat App Review -hyväksynnän jälkeen.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>
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
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-zinc-100">
              <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-zinc-400 text-sm">Yhdistä some-kanavat nähdäksesi analytiikan</p>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={refreshAnalytics}
                  disabled={refreshingAnalytics}
                  className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingAnalytics ? "animate-spin" : ""}`} />
                  {refreshingAnalytics ? "Päivitetään..." : "Päivitä luvut"}
                </button>
              </div>

              {/* Seuraajat per kanava */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map((acc) => {
                  const latest = analytics
                    .filter((a) => a.platform === acc.platform)
                    .sort((a, b) => b.date.localeCompare(a.date))[0];
                  const isFb = acc.platform === "facebook";
                  return (
                    <div key={acc.id} className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isFb ? "bg-blue-600" : "bg-gradient-to-br from-purple-500 to-rose-500"}`}>
                          {isFb ? <Share2 className="w-5 h-5 text-white" /> : <Camera className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 capitalize">{acc.platform}</p>
                          <p className="text-xs text-zinc-400">{isFb ? acc.page_name : "@" + acc.account_name}</p>
                        </div>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-zinc-900">
                          {latest ? latest.followers_count.toLocaleString("fi-FI") : "–"}
                        </span>
                        <span className="text-sm text-zinc-500 mb-1">seuraajaa</span>
                      </div>
                      {latest && (
                        <p className="text-xs text-zinc-400 mt-1">
                          Päivitetty {new Date(latest.date).toLocaleDateString("fi-FI")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Yhteenveto-luvut */}
              {analytics.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-amber-700">
                    Klikkaa <strong>Päivitä luvut</strong> hakeaksesi tilastot Metasta.
                  </p>
                </div>
              ) : (
                <>
                  {/* Sitoutuminen (25 viimeisintä postausta) */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Sitoutuminen (25 viimeisintä postausta)</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {(() => {
                        const hasMedia = analytics.some(a => a.media_count !== null);
                        const hasLikes = analytics.some(a => a.total_likes !== null);
                        const hasComments = analytics.some(a => a.total_comments !== null);
                        const hasReach = analytics.some(a => a.total_reach > 0);
                        return (
                          <>
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100 text-center">
                              <p className="text-2xl font-bold text-zinc-900">
                                {hasMedia ? analytics.reduce((s, a) => s + (a.media_count ?? 0), 0).toLocaleString("fi-FI") : "–"}
                              </p>
                              <p className="text-sm text-zinc-500 mt-1">Julkaisuja (Instagram)</p>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100 text-center">
                              <p className="text-2xl font-bold text-rose-500">
                                {hasLikes ? analytics.reduce((s, a) => s + (a.total_likes ?? 0), 0).toLocaleString("fi-FI") : "–"}
                              </p>
                              <p className="text-sm text-zinc-500 mt-1">Tykkäystä</p>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100 text-center">
                              <p className="text-2xl font-bold text-zinc-900">
                                {hasComments ? analytics.reduce((s, a) => s + (a.total_comments ?? 0), 0).toLocaleString("fi-FI") : "–"}
                              </p>
                              <p className="text-sm text-zinc-500 mt-1">Kommenttia</p>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100 text-center">
                              <p className="text-2xl font-bold text-blue-500">
                                {hasReach ? analytics.reduce((s, a) => s + (a.total_reach ?? 0), 0).toLocaleString("fi-FI") : "–"}
                              </p>
                              <p className="text-sm text-zinc-500 mt-1">Tavoitettu (28pv)</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Per-alusta erittely */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Erittely alustoittain</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-100">
                            <th className="text-left px-5 py-3 text-zinc-500 font-medium">Alusta</th>
                            <th className="text-right px-5 py-3 text-zinc-500 font-medium">Seuraajat</th>
                            <th className="text-right px-5 py-3 text-zinc-500 font-medium">Julkaisuja</th>
                            <th className="text-right px-5 py-3 text-zinc-500 font-medium">Tykkäyksiä</th>
                            <th className="text-right px-5 py-3 text-zinc-500 font-medium">Kommentteja</th>
                            <th className="text-right px-5 py-3 text-zinc-500 font-medium">Tavoitettu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((acc) => {
                            const latest = analytics
                              .filter((a) => a.platform === acc.platform)
                              .sort((a, b) => b.date.localeCompare(a.date))[0];
                            const isFb = acc.platform === "facebook";
                            return (
                              <tr key={acc.id} className="border-b border-zinc-50 last:border-0">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center ${isFb ? "bg-blue-600" : "bg-gradient-to-br from-purple-500 to-rose-500"}`}>
                                      {isFb ? <Share2 className="w-3 h-3 text-white" /> : <Camera className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-zinc-900 capitalize">{acc.platform}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-right font-semibold text-zinc-900">
                                  {latest ? latest.followers_count.toLocaleString("fi-FI") : "–"}
                                </td>
                                <td className="px-5 py-4 text-right text-zinc-600">
                                  {latest?.media_count != null ? latest.media_count.toLocaleString("fi-FI") : "–"}
                                </td>
                                <td className="px-5 py-4 text-right text-rose-500 font-medium">
                                  {latest?.total_likes != null ? latest.total_likes.toLocaleString("fi-FI") : "–"}
                                </td>
                                <td className="px-5 py-4 text-right text-zinc-600">
                                  {latest?.total_comments != null ? latest.total_comments.toLocaleString("fi-FI") : "–"}
                                </td>
                                <td className="px-5 py-4 text-right text-blue-500 font-medium">
                                  {latest?.total_reach ? latest.total_reach.toLocaleString("fi-FI") : "–"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
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

            <input
              type="url"
              value={newPost.image_url}
              onChange={(e) => setNewPost((p) => ({ ...p, image_url: e.target.value }))}
              placeholder="Kuvan URL (pakollinen Instagramille)"
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 mb-2"
            />
            <p className="text-xs text-zinc-400 mb-4">
              ℹ️ Instagram vaatii aina kuvan. Facebook toimii myös pelkällä tekstillä.
            </p>

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
                      image_url: newPost.image_url,
                    }),
                  });
                  setShowNewPost(false);
                  setNewPost({ content: "", platform: "both", image_url: "" });
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
