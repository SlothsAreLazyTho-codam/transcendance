import { createContext, useContext, useState } from "react";

interface DropdownMenuContextProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  toggleDropdownMenu: () => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextProps>(
  {} as DropdownMenuContextProps
);

export function DropdownMenuContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  const toggleDropdownMenu = () => {
    setVisible(!visible);
  };

  return (
    <DropdownMenuContext.Provider value={{ visible, setVisible, toggleDropdownMenu }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

export const useDropdownMenu = () => useContext(DropdownMenuContext);
