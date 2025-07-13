import { useChatService } from "../../../lib/context/chat.context";
import { useState } from "react";

export function JoinChannelDialog({ className }: { className?: string }) {
  const { joinChannel, allChannels } = useChatService();
  const [open, setOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<number | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChannel) {
      setError("Select a channel.");
      return;
    }
    joinChannel(selectedChannel, password);
    setOpen(false);
    setSelectedChannel(undefined);
    setPassword("");
    setError(null);
  }

  // ESC sluit dialog (optioneel)
  // useEffect(() => {
  //   if (!open) return;
  //   function esc(e: KeyboardEvent) {
  //     if (e.key === "Escape") setOpen(false);
  //   }
  //   window.addEventListener("keydown", esc);
  //   return () => window.removeEventListener("keydown", esc);
  // }, [open]);

  return (
    <>
      <button
        className={
          (className || "") +
          " px-4 py-2 font-bold bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-lg shadow transition text-lg"
        }
        onClick={() => setOpen(true)}
      >
        Join Channel
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
            onSubmit={handleSubmit}
            style={{ minWidth: 320 }}
          >
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
              Join a Channel
            </h2>
            <p className="h-[3px] w-full bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite] mb-2 rounded" />

            <select
              className="bg-neutral-800 border border-white/10 p-3 rounded-lg text-white text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 transition"
              name="channel"
              required
              value={selectedChannel ?? ""}
              onChange={e => setSelectedChannel(Number(e.target.value))}
              autoFocus
            >
              <option value="" disabled>
                Select a channel...
              </option>
              {allChannels?.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
            <input
              type="password"
              placeholder="Password (if needed)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-neutral-800 border border-white/10 p-3 rounded-lg text-white text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              name="password"
            />

            {error && <p className="text-rose-500 text-sm font-semibold">{error}</p>}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSelectedChannel(undefined);
                  setPassword("");
                  setError(null);
                }}
                className="px-4 py-2 rounded-lg bg-black/20 text-white font-bold hover:bg-white/10 transition border border-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg font-bold text-white shadow bg-fuchsia-500 hover:bg-fuchsia-600 transition"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
