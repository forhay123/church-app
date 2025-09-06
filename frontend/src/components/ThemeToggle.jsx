import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" || 
           (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const handleToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <Button
      onClick={handleToggle}
      variant="outline"
      size="icon"
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-background border-2"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-primary" />
      ) : (
        <Moon className="w-5 h-5 text-primary" />
      )}
    </Button>
  );
}