import { useState, useEffect, useRef } from "react";


export function useDocumentStatus(documentId) {
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!documentId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}/status`, {
          credentials: "include",
        });
        const data = await res.json();
        setStatus(data.status);

        if (data.status === "ready" || data.status === "failed") {
          setError(data.error || null);
          clearInterval(intervalRef.current);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => clearInterval(intervalRef.current);
  }, [documentId]);

  return { status, error };
}
