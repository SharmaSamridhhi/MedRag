import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SquarePen, History, BookOpen, Settings, LogOut } from "lucide-react";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: SquarePen, label: "New Chat", end: true },
    { to: "/history", icon: History, label: "History" },
    { to: "/library", icon: BookOpen, label: "Library" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div
      className='flex h-screen overflow-hidden'
      style={{ backgroundColor: "#f6fff8" }}
    >
      {/* Sidebar */}
      <aside
        className='flex flex-col w-60 shrink-0 h-full border-r'
        style={{ backgroundColor: "#eaf4f4", borderColor: "#cce3de" }}
      >
        {/* Logo */}
        <div
          className='flex items-center gap-2.5 px-5 py-5 border-b'
          style={{ borderColor: "#cce3de" }}
        >
          <div
            className='w-8 h-8 rounded-lg flex items-center justify-center shrink-0'
            style={{ backgroundColor: "#6b9080" }}
          >
            <svg width='16' height='16' viewBox='0 0 24 24' fill='white'>
              <path d='M11 6h2v4h4v2h-4v4h-2v-4H7v-2h4z' />
            </svg>
          </div>
          <div>
            <p
              className='text-sm font-bold leading-none'
              style={{ color: "#1a2e25" }}
            >
              MedRAG
            </p>
            <p
              className='text-[10px] tracking-widest uppercase mt-0.5'
              style={{ color: "#6b9080" }}
            >
              Clinical Intelligence
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className='flex-1 px-3 py-4 space-y-1 overflow-y-auto'>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "hover:bg-white/60"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: "#6b9080", color: "white" }
                  : { color: "#4a6b5b" }
              }
            >
              <Icon className='w-4 h-4 shrink-0' />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className='px-3 py-4 border-t' style={{ borderColor: "#cce3de" }}>
          {user && (
            <div
              className='px-3 py-2 mb-2 rounded-lg'
              style={{ backgroundColor: "#d6ece6" }}
            >
              <p
                className='text-xs font-semibold truncate'
                style={{ color: "#1a2e25" }}
              >
                {user.email || "Clinician"}
              </p>
              <p
                className='text-[10px] tracking-widest mt-0.5 capitalize'
                style={{ color: "#6b9080" }}
              >
                {user.role}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className='flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-red-50'
            style={{ color: "#a05050" }}
          >
            <LogOut className='w-4 h-4 shrink-0' />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className='flex-1 overflow-hidden'>{children}</main>
    </div>
  );
}
