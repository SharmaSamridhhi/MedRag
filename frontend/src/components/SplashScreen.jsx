import { useEffect, useState } from "react";
import MedRAGLogo from "@/components/MedRAGLogo";

export default function SplashScreen({ onDone, ready }) {
  const [phase, setPhase] = useState("entering");

  const MIN_MS = 800;

  useEffect(() => {
    let minTimer;
    let minElapsed = false;
    let appReady = false;

    function tryLeave() {
      if (minElapsed && appReady) {
        setPhase("leaving");
        setTimeout(() => onDone?.(), 420);
      }
    }

    minTimer = setTimeout(() => {
      minElapsed = true;
      tryLeave();
    }, MIN_MS);

    if (ready) {
      appReady = true;
    }

    return () => clearTimeout(minTimer);
  }, []); // eslint-disable-line

  // When ready flips to true after mount
  useEffect(() => {
    if (!ready) return;

    let minElapsed = false;
    const minTimer = setTimeout(() => {
      minElapsed = true;
      setPhase((prev) => {
        if (prev === "leaving") return prev;
        return "leaving";
      });
      setTimeout(() => onDone?.(), 420);
    }, MIN_MS);

    return () => clearTimeout(minTimer);
  }, [ready]); // eslint-disable-line

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#f6fff8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        opacity: phase === "leaving" ? 0 : 1,
        transition:
          phase === "entering"
            ? "opacity 350ms ease-in"
            : "opacity 400ms ease-out",
      }}
    >
      {/* Logo — slightly larger than login page "lg" for impact */}
      <div
        style={{
          opacity: phase === "leaving" ? 0 : 1,
          transform: phase === "leaving" ? "translateY(-6px)" : "translateY(0)",
          transition: "opacity 400ms ease-out, transform 400ms ease-out",
        }}
      >
        <MedRAGLogo size='xl' />
      </div>

      {/* Subtle divider line that grows in */}
      <div
        style={{
          marginTop: 24,
          height: 1,
          backgroundColor: "#cce3de",
          width: phase === "entering" ? 0 : 80,
          transition: "width 600ms ease-out",
          transitionDelay: "200ms",
          opacity: phase === "leaving" ? 0 : 1,
        }}
      />
    </div>
  );
}
