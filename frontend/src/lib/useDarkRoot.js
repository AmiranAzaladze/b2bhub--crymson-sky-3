import { useEffect } from "react";

/** Toggles `html.dark` for the duration this component is mounted.
 *  Used to apply dark theme to admin routes only (landing stays light). */
export default function useDarkRoot() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    return () => {
      root.classList.remove("dark");
    };
  }, []);
}
