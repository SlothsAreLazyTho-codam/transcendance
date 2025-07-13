"use client";

import { useChatService } from "../../../lib/context/chat.context";

export default function ChatInput() {
  const { sendMessage, getCurrentChannel, getCurrentDMChannel } = useChatService();

  return (
    <div className="w-full px-2 py-4 bg-neutral-900 border-t border-white/10">
      <form
        className="flex flex-col sm:flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const formData = new FormData(e.currentTarget);
          const message = formData.get("chatbox")?.toString().trim();
          if (!message) return;

          if (getCurrentChannel) {
            sendMessage(message, "CHANNEL");
          } else if (getCurrentDMChannel) {
            sendMessage(message, "USER");
          } else {
            alert("Select a chat first!");
          }
          e.currentTarget.reset();
        }}
      >
        <input
          className="p-2 w-full text-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md bg-neutral-700 text-white"
          name="chatbox"
          type="text"
          maxLength={64}
          placeholder="Send a message..."
        />
        <button className="px-4 py-2 text-xl font-semibold transition-colors duration-300 bg-blue-500/50 hover:bg-cyan-300/90 hover:text-black rounded-md">
          &#10148;
        </button>
      </form>
    </div>
  );
}
