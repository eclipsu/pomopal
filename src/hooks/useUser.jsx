import { useContext } from "react";
import { UserContext } from "@/contexts/UserContext";

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser hook must be used inside a UserProvider");
  }
  return context;
};
