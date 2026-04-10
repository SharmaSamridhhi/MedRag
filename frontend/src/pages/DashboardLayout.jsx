import { NavLink, useNavigate } from "react-router-dom";
import MedRAGLogo from "@/components/MedRAGLogo";
import { useAuth } from "@/context/AuthContext";
import {
  SquarePen,
  History,
  BookOpen,
  Settings,
  LogOut,
  Camera,
  Loader2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function getInitials(name, email) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

export default function DashboardLayout({ children }) {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hovering, setHovering] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.avatarUrl) setAvatarUrl(user.avatarUrl);
  }, [user?.avatarUrl]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setAvatarUrl(dataUrl);
      setUploadingAvatar(true);
      try {
        const res = await fetch(`${API_URL}/auth/avatar`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ avatarUrl: dataUrl }),
        });
        if (res.ok) {
          login({ ...user, avatarUrl: dataUrl });
        }
      } catch (err) {
        console.error("Avatar upload error:", err);
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const initials = getInitials(user?.name, user?.email);
  const displayName = user?.name || user?.email || "Clinician";

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
        <div className='px-5 py-3 border-b' style={{ borderColor: "#cce3de" }}>
          <MedRAGLogo size='md' />
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
              className='flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl'
              style={{ backgroundColor: "#d6ece6" }}
            >
              {/* Avatar */}
              <div
                className='relative shrink-0 cursor-pointer'
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                onClick={() =>
                  !uploadingAvatar && fileInputRef.current?.click()
                }
                title='Change profile picture'
              >
                <div
                  className='w-9 h-9 rounded-full flex items-center justify-center overflow-hidden text-xs font-bold select-none'
                  style={{
                    backgroundColor: avatarUrl ? "transparent" : "#6b9080",
                    color: "white",
                    border: "2px solid #a4c3b2",
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt='Profile'
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    initials
                  )}
                </div>
                {/* Hover overlay */}
                {(hovering || uploadingAvatar) && (
                  <div
                    className='absolute inset-0 rounded-full flex items-center justify-center'
                    style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className='w-3.5 h-3.5 text-white animate-spin' />
                    ) : (
                      <Camera className='w-3.5 h-3.5 text-white' />
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Name + role */}
              <div className='min-w-0'>
                <p
                  className='text-xs font-semibold truncate'
                  style={{ color: "#1a2e25" }}
                >
                  {displayName}
                </p>
                <p
                  className='text-[10px] tracking-widest mt-0.5 capitalize'
                  style={{ color: "#6b9080" }}
                >
                  {user.role}
                </p>
              </div>
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
