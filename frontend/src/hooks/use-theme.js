import { useState } from "react";

// A custom hook to manage theme (light/dark)
export const useTheme = () => {
  const [theme, setTheme] = useState("light"); // Default theme is 'light'

  return { theme, setTheme };
};
