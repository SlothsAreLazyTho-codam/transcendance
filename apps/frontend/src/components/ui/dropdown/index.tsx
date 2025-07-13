"use client";

import {
  DropdownMenuContextProvider,
  useDropdownMenu,
} from "@/components/ui/dropdown/_context/dropdown.context";

import { useRouter } from "next/navigation";
import React from "react";

interface DropdownMenuItemProps {
  className?: string;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

interface DropdownMenuProps {
  children:
    | React.ReactElement<DropdownMenuItemProps>
    | React.ReactElement<DropdownMenuItemProps>[];
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  className,
  children,
  href,
  onClick,
}) => {
  const router = useRouter();

  function navigate() {
    if (!href) return;
    router.push(href);
  }

  return (
    <>
      <button
        className={`px-8 py-2 w-full bg-card border justify-start items-start border-gray-500 ${className} cursor-pointer hover:bg-background text-nowrap`}
        role="menuitem"
        onClick={onClick ?? navigate}
      >
        {children}
      </button>
    </>
  );
};

export function DropdownMenuButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { toggleDropdownMenu } = useDropdownMenu();

  return (
    <>
      <button
        className={`cursor-pointer ${className}`}
        onClick={() => toggleDropdownMenu()}
      >
        {children}
      </button>
    </>
  );
}

export function DropdownMenuContent({ children }: DropdownMenuProps) {
  const { visible } = useDropdownMenu();

  return (
    <div className="flex flex-col absolute py-2 right-0" role="none">
      {visible && children}
    </div>
  );
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const { visible, setVisible } = useDropdownMenu();

  return (
    <DropdownMenuContextProvider>
      <div
        className={`${
          visible ? "bg-black/40" : "pointer-events-none"
        } w-screen h-screen absolute top-0 left-0`}
        onClick={() => setVisible(false)}
      ></div>
      <div className="relative" role="menu">
        {children}
      </div>
    </DropdownMenuContextProvider>
  );
}
