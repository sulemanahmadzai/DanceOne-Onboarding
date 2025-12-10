"use client";

import { createContext, useContext, ReactNode } from "react";

export interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

const UserContext = createContext<UserData | null>(null);

export function UserProvider({
  children,
  userData,
}: {
  children: ReactNode;
  userData: UserData;
}) {
  return (
    <UserContext.Provider value={userData}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

// Optional: Hook that returns null instead of throwing if no user
export function useOptionalUser() {
  return useContext(UserContext);
}
