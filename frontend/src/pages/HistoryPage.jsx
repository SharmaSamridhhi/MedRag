import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { MessageSquare, Clock, ChevronRight, Inbox } from "lucide-react";


function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/chat/sessions`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { sessions: [] }))
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const handleResume = (sessionId) => {
    navigate(`/dashboard?sessionId=${sessionId}`);
  };

  return (
    <DashboardLayout>
      <div className='h-full flex flex-col overflow-hidden'>
        {/* Header */}
        <div
          className='flex items-center justify-between px-8 py-5 border-b shrink-0'
          style={{ borderColor: "#cce3de", backgroundColor: "#f6fff8" }}
        >
          <div>
            <h1 className='text-xl font-bold' style={{ color: "#1a2e25" }}>
              Chat History
            </h1>
            <p className='text-sm mt-0.5' style={{ color: "#6b9080" }}>
              Your past clinical intelligence sessions.
            </p>
          </div>
          <span
            className='text-xs font-medium px-3 py-1.5 rounded-full'
            style={{ backgroundColor: "#eaf4f4", color: "#4a6b5b" }}
          >
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto px-8 py-6'>
          {loading ? (
            <div className='flex flex-col gap-3'>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className='h-20 rounded-2xl animate-pulse'
                  style={{ backgroundColor: "#eaf4f4" }}
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-center py-20'>
              <div
                className='w-14 h-14 rounded-2xl flex items-center justify-center mb-4'
                style={{ backgroundColor: "#eaf4f4" }}
              >
                <Inbox className='w-6 h-6' style={{ color: "#6b9080" }} />
              </div>
              <h2
                className='text-base font-semibold mb-1'
                style={{ color: "#1a2e25" }}
              >
                No sessions yet
              </h2>
              <p className='text-sm' style={{ color: "#6b9080" }}>
                Start a chat on the dashboard and it will appear here.
              </p>
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              {sessions.map((session) => (
                <button
                  key={session.sessionId}
                  onClick={() => handleResume(session.sessionId)}
                  className='flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all group hover:shadow-sm'
                  style={{
                    backgroundColor: "white",
                    borderColor: "#cce3de",
                  }}
                >
                  {/* Icon */}
                  <div
                    className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0'
                    style={{ backgroundColor: "#eaf4f4" }}
                  >
                    <MessageSquare
                      className='w-5 h-5'
                      style={{ color: "#6b9080" }}
                    />
                  </div>

                  {/* Title + time */}
                  <div className='flex-1 min-w-0'>
                    <p
                      className='text-sm font-semibold truncate'
                      style={{ color: "#1a2e25" }}
                    >
                      {session.title}
                    </p>
                    <div className='flex items-center gap-1.5 mt-1'>
                      <Clock className='w-3 h-3' style={{ color: "#a4c3b2" }} />
                      <p className='text-xs' style={{ color: "#6b9080" }}>
                        {formatRelativeTime(session.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    className='w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5'
                    style={{ color: "#a4c3b2" }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
