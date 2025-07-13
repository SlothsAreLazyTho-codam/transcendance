import { useState } from "react";
import { useSession } from "@/lib/context/auth.context";
import { Channel } from "@/api/channel/types";

interface ChangePasswordDialogProps {
  channel: Channel;
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordDialog({
  channel,
  open,
  onClose,
}: ChangePasswordDialogProps) {
  const { client } = useSession();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasPassword = channel.type === "PRIVATE" || !!channel.password;

  function reset() {
    setOldPassword("");
    setNewPassword("");
    setConfirm("");
    setError(null);
    setLoading(false);
  }

  if (!open && (oldPassword || newPassword || confirm || error)) {
    setTimeout(reset, 300);
  }

  function validate() {
    if (hasPassword) {
      if (!oldPassword) return "Enter your current password.";
      if (newPassword) {
        if (!confirm) return "Confirm your new password.";
        if (newPassword !== confirm)
          return "New passwords do not match.";
        if (newPassword.length < 3 || newPassword.length > 16)
          return "Password must be 3 to 16 characters.";
      }
    } else {
      if (!newPassword) return "Enter a new password.";
      if (!confirm) return "Confirm your new password.";
      if (newPassword !== confirm)
        return "New passwords do not match.";
      if (newPassword.length < 3 || newPassword.length > 16)
        return "Password must be 3 to 16 characters.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, string> = {};
      if (hasPassword) {
        payload.oldPassword = oldPassword;
        if (newPassword) payload.newPassword = newPassword;
      } else {
        payload.newPassword = newPassword;
      }
      await client.postJSON(`/api/v1/channel/${channel.id}/change/`, payload, {});
      reset();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Action failed.");
    }
    setLoading(false);
  }

  if (!open) return null;

  return (
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
        autoComplete="off"
        style={{ minWidth: 320 }}
      >
        <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
          Manage Password
        </h2>
        <p className="h-[3px] w-full bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite] mb-2 rounded" />

        {hasPassword ? (
          <>
            <input
              type="password"
              placeholder="Current password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="bg-neutral-800 border border-white/10 p-3 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              autoFocus
              required
            />
            <input
              type="password"
              placeholder="New password (leave empty to remove)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="bg-neutral-800 border border-white/10 p-3 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 transition"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="bg-neutral-800 border border-white/10 p-3 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 transition"
              required={!!newPassword}
              disabled={!newPassword}
            />
            <small className={`text-xs mt-0 ${!newPassword ? "text-fuchsia-300" : "text-gray-400"}`}>
              {!newPassword
                ? "Leave 'New password' empty to remove the password."
                : "Enter a new password (3–16 characters)."}
            </small>
          </>
        ) : (
          <>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="bg-neutral-800 border border-white/10 p-3 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 transition"
              autoFocus
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="bg-neutral-800 border border-white/10 p-3 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 transition"
              required
            />
          </>
        )}

        {error && <p className="text-rose-500 text-sm font-semibold">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-black/20 text-white font-bold hover:bg-white/10 transition border border-white/10"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            // Felle, duidelijke roze knop (zoals in jouw dialogs en modals)
            className="px-5 py-2 rounded-lg font-bold text-white shadow bg-fuchsia-500 hover:bg-fuchsia-600 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
