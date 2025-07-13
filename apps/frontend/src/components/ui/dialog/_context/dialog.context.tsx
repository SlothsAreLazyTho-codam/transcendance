// components/ui/dialog/_context/dialog.context.tsx
import { createContext, useContext, useState } from "react";

// The context values will be specific to *each* Dialog instance
interface DialogContextProps {
  visible: boolean;
  setVisible: (visible: boolean) => void; // This setVisible controls *this specific dialog's* visibility

  title: string | undefined; // <--- Maak de title optioneel
  setTitle: (title: string | undefined) => void; // <--- Maak de setTitle parameter ook optioneel
  
  // openDialog and closeDialog here refer to the state of *this particular* dialog instance.
  // They are less "global" now and more "instance-specific" because each <Dialog> creates its own context provider.
  openDialog: () => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextProps>(
  {} as DialogContextProps
);

export function DialogContextProvider({
  children,
  dialogTitle,
}: {
  children: React.ReactNode;
  dialogTitle?: string;
}) {
  const [title, setTitle] = useState<string | undefined>(dialogTitle); // <--- Verwijder de standaardwaarde "Dialog"
  const [visible, setVisible] = useState(false); // <--- Each Dialog gets its own visible state

  const openDialog = () => {
    setVisible(true);
  };
  const closeDialog = () => {
    setVisible(false);
  };

  return (
    <DialogContext.Provider
      value={{ visible, setVisible, title, setTitle, openDialog, closeDialog }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export const useDialog = () => useContext(DialogContext);