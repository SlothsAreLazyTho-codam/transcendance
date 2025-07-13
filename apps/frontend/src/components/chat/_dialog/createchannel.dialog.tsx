"use client";

import { useState } from "react";
import { useSession } from "@/lib/context/auth.context";

export function CreateChannelDialog({ className }: { className?: string }) {
  const { session, client } = useSession();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter a channel name.");
      return;
    }
    if (name.length > 16) {
      setError("Channel name must be at most 16 characters.");
      return;
    }

    setLoading(true);
    const channelData = {
      name: name.trim(),
      type: password.trim() ? "PRIVATE" : "PUBLIC",
      password: password.trim() || undefined,
    };

    try {
      await client.postJSON("/api/v1/channel", channelData, { headers: {} });
      setOpen(false);
      setName("");
      setPassword("");
      setError(null);
    } catch (err) {
      setError("Failed to create channel.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className={
          (className || "") +
          " px-4 py-2 font-bold bg-lime-500 hover:bg-lime-600 text-white rounded-lg shadow transition text-lg"
        }
        onClick={() => setOpen(true)}
      >
        Create Channel
      </button>
      {open && (
        <div className="fixed inset-0 flex items-center justify-start pl-8 bg-black/70 z-50">
          <form
            className="
              bg-neutral-900
              neon-border
              rounded-2xl
              shadow-lg
              border
              border-white/10
              px-8 py-8
              w-[350px]
              flex flex-col gap-5
              animate-fadeIn
            "
            style={{ minWidth: 320 }}
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
              Create a Channel
            </h2>
            <p className="h-[3px] w-full bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite] mb-2 rounded" />

            <input
              className="bg-neutral-800 border border-white/10 p-3 rounded-lg text-white text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 transition"
              name="name"
              type="text"
              maxLength={16}
              placeholder="Channel Name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
              disabled={loading}
            />
            <input
              className="bg-neutral-800 border border-white/10 p-3 rounded-lg text-white text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              name="password"
              type="password"
              maxLength={64}
              placeholder="(optional) Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="off"
              disabled={loading}
            />

            {error && (
              <p className="text-rose-500 text-sm font-semibold">{error}</p>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setName("");
                  setPassword("");
                  setError(null);
                }}
                className="px-4 py-2 rounded-lg bg-black/20 text-white font-bold hover:bg-white/10 transition border border-white/10"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg font-bold text-white shadow bg-fuchsia-500 hover:bg-fuchsia-600 transition disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
