"use client";

import { useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

const suggestions = [
  "Analysoi tämän kuun myynti",
  "Kirjoita Instagram-postaus salonkini tarjouksesta",
  "Mitä asiakkaita minun pitäisi kontaktoida tällä viikolla?",
  "Luo markkinointisuunnitelma ensi kuulle",
];

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      {
        role: "assistant",
        content:
          "AI-yhteys avataan pian. Supabase ja API-avaimet täytyy ensin konfiguroida.",
      },
    ]);
    setInput("");
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">AI Assistentti</h1>
        <p className="text-zinc-500 mt-1">Claude hallitsee bisnesäsi puolestasi</p>
      </div>

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">Miten voin auttaa?</h2>
          <p className="text-zinc-500 text-sm mb-8">Kysy mitä tahansa bisneseesi liittyvää</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="flex items-center gap-2 p-3 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors text-left"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-4 mb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-md px-4 py-3 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-rose-500 text-white rounded-tr-sm"
                    : "bg-white border border-zinc-100 text-zinc-700 rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Kirjoita viesti..."
          className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
        <button
          onClick={() => sendMessage(input)}
          className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-600 transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
