import { useState, useEffect } from "react";

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("attendance_auth") === "true";
  });

  const login = () => {
    localStorage.setItem("attendance_auth", "true");
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem("attendance_auth");
    setIsLoggedIn(false);
  };

  return { isLoggedIn, login, logout };
}