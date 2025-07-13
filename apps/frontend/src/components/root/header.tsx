import { Pages } from "@/env";
import Link from "next/link";
import { getSession } from "@/lib/auth";

import { Dialog, DialogContent, DialogOpenButton } from "../ui/dialog";
import ChatComponent from "../chat";

// import { ChatBubbleBottomCenterIcon } from "s@heroicons/react/20/solid";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";

import {
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown";

export default async function Header() {
  const session = await getSession();

  return (
    <div className="bg-neutral-950/80 border-b border-b-neutral-600/70 shadow-lg relative">
      <div className="lg:w-3/4 lg:mx-auto">
        <div className="flex  items-center p-6 justify-between px-8">
          
          <Link href="/" className="font-bold text-4xl break-keep bg-gradient-to-br from-lime-300 via-cyan-300 to-fuchsia-300 bg-[length:50%_120%] animate-gradient bg-clip-text text-transparent"
            style={{ animationDuration: "3s" }}
          >
            Trans-&-Dance
          </Link>

          <div className="md:hidden flex flex-row gap-x-2 items-center">
            <Dialog key="chat-browser" title="Chats!">
              <DialogOpenButton>
                <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
              </DialogOpenButton>
              <DialogContent>
                <ChatComponent />
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuButton>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6 text-gray"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </DropdownMenuButton>
              <DropdownMenuContent>
                {Pages.map((page) => (
                  <Link className="relative z-20" href={page.href} key={page.href}>
                    <DropdownMenuItem key={page.href}>
                      {page.label}
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-row justify-end hidden md:flex items-center">
            {Pages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="py-1 px-2 mx-4 text-lg font-semibold text-neutral-300 hover:bg-fuchsia-300 hover:text-black rounded-md duration-300"
              >
                {page.label}
              </Link>
            ))}

            <div className="flex border rounded-lg p-1 gap-x-2 neon-border">
              <Dialog key="chat-browser">
                <DialogOpenButton>
                  <ChatBubbleBottomCenterTextIcon className="p-1 w-10 h-10 rounded transition-colors duration-300 text-green-300 hover:bg-lime-300 hover:text-black " />
                </DialogOpenButton>
                <DialogContent>
                  <ChatComponent />
                </DialogContent>
              </Dialog>

              <Link
                href="/settings"
                className="py-1 px-2 mx-4 text-lg font-semibold text-neutral-300 hover:bg-fuchsia-300 hover:text-black rounded-md duration-300"
              >
                {" "}
                <span className="font-semibold text-2xl">
                  {(session?.user?.username ?? "").length > 8
                    ? (session?.user?.username ?? "").slice(0, 8) + "..."
                    : session?.user?.username ?? ""}
                </span>
              </Link>
            </div>

            
          </div>
        </div>
      </div>
      <div className="w-full h-[3px] bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite]" />
    </div>
  );
}
