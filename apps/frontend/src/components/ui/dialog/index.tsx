// components/ui/dialog/index.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { DialogContextProvider, useDialog } from "./_context/dialog.context"; // Ensure this import is correct
import { XMarkIcon } from "@heroicons/react/20/solid";

// DialogOpenButton remains mostly the same, it uses the context from its parent Dialog
export function DialogOpenButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { openDialog } = useDialog(); // openDialog now refers to the specific dialog's open function

  return (
    <button className={className ?? ""} onClick={() => openDialog()}>
      {children}
    </button>
  );
}

// DialogContent now accepts a render prop or direct children, and passes the setOpen function
export function DialogContent({ 
    children 
}: { 
    children: ReactNode | ((args: { close: () => void }) => ReactNode) 
}) {
  const { visible, title, closeDialog } = useDialog(); // closeDialog refers to the specific dialog's close function

  useEffect(() => {
    // Only apply overflow hidden if *this specific dialog* is visible
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      // Be careful with multiple dialogs. If one closes, another might still be open.
      // A more robust solution for body overflow would involve tracking all open dialogs
      // in a global state, or only setting overflow:auto if *no* dialogs are visible.
      // For simplicity, for now, we'll revert if *this* dialog closes.
      // If you have overlapping dialogs, you might need a more sophisticated global mechanism.
      document.body.style.overflow = "auto";
    }
    return () => {
        // Cleanup on unmount, or if component is re-rendered with visible=false
        if (!visible && document.body.style.overflow === "hidden") {
            document.body.style.overflow = "auto";
        }
    }
  }, [visible]);

  return (
    <>
      {visible && (
        <div
          aria-modal="true"
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          // Clicking overlay should close *this* dialog
          onClick={() => closeDialog()} 
        >
          <div
              className="relative bg-neutral-900 rounded-md p-4 shadow-md animate-fade-in-scale
              w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl
              max-h-[calc(100vh-2rem)] flex flex-col neon-border"
              onClick={(e) => e.stopPropagation()} // Prevent clicking inside from closing
            >
            <div className="w-full flex flex-row justify-between">
              <button
                className="absolute top-2 right-2 p-1 transition-colors duration-300 hover:text-rose-500"
                onClick={() => closeDialog()} // Close *this* dialog
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              {/* You might want to add your title here */}
              {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}
            </div>
            {/* Pass closeDialog to children if they are a function */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {typeof children === 'function' ? children({ close: closeDialog }) : children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Dialog component is now responsible for providing the context for its children
export function Dialog({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    // Each Dialog creates its own DialogContextProvider
    <DialogContextProvider dialogTitle={title}>
      {children}
    </DialogContextProvider>
  );
}