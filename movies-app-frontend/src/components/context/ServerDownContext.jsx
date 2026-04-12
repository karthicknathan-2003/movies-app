import { createContext, useContext, useState } from "react";

const ServerDownContext = createContext();

export function ServerDownProvider({ children }) {
   const [errorState, setErrorState] = useState(null);

  return (
    <ServerDownContext.Provider value={{ errorState, setErrorState }}>
      {children}
    </ServerDownContext.Provider>
  );
}

export const useServerDownStatus = () => useContext(ServerDownContext);
