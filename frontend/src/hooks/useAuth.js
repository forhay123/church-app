import { useState, useEffect } from "react";

// Dummy example — in real life, fetch from localStorage or context
export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Example: load user from localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return { user, setUser };
}
