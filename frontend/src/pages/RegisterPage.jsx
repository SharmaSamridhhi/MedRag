import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Stethoscope,
  FlaskConical,
  HeartPulse,
  UserRound,
} from "lucide-react";
import MedRAGLogo from "@/components/MedRAGLogo";

const ROLES = [
  { value: "doctor", label: "DOCTOR", Icon: Stethoscope },
  { value: "nurse", label: "NURSE", Icon: HeartPulse },
  { value: "patient", label: "PATIENT", Icon: UserRound },
  { value: "researcher", label: "RESEARCHER", Icon: FlaskConical },
];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    if (!selectedRole) {
      setServerError("Please select a clinical role.");
      return;
    }
    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data, role: selectedRole }),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(
          json.message || "Registration failed. Please try again.",
        );
        return;
      }

      login({
        email: data.email,
        role: selectedRole,
        name: data.name,
        id: json.userId,
        avatarUrl: json.avatarUrl || null,
      });
      navigate("/dashboard");
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className='min-h-screen flex items-center justify-center px-4 py-8'
      style={{ backgroundColor: "#eaf4f4" }}
    >
      <div className='w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-lg'>
        {/* ── Left panel ── */}
        <div
          className='hidden md:flex flex-col gap-y-1.5 w-5/12 p-10'
          style={{ backgroundColor: "#d6ece6" }}
        >
          {/* Logo */}
          <MedRAGLogo size='lg' left={34} />

          {/* Hero text */}
          <div className='mb-8 '>
            <h2
              className='text-5xl font-black leading-tight'
              style={{ color: "#1a2e25" }}
            >
              Clinical
            </h2>
            <h2
              className='text-5xl font-black leading-tight'
              style={{ color: "#6b9080" }}
            >
              Intelligence
            </h2>
            <p
              className='mt-6 text-base leading-relaxed'
              style={{ color: "#4a6b5b" }}
            >
              Access evidence-based insights through our advanced
              retrieval-augmented generation engine designed specifically for
              healthcare professionals.
            </p>
          </div>

          {/* HIPAA badge */}
          <div
            className='flex items-start gap-3 p-4 rounded-xl'
            style={{ backgroundColor: "#c2ddd6" }}
          >
            <Shield
              className='w-5 h-5 mt-0.5 shrink-0'
              style={{ color: "#6b9080" }}
            />
            <div>
              <p className='font-semibold text-sm' style={{ color: "#2d4a3e" }}>
                HIPAA Compliant
              </p>
              <p className='text-xs mt-0.5' style={{ color: "#4a6b5b" }}>
                Enterprise-grade data security protocols
              </p>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className='flex-1 bg-white p-10'>
          <div className='mb-7'>
            <h1 className='text-3xl font-bold' style={{ color: "#1a2e25" }}>
              Create your account
            </h1>
            <p className='text-sm mt-1' style={{ color: "#6b8f7e" }}>
              Join the clinical intelligence network
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className='space-y-5'
          >
            {/* Full Name */}
            <div className='space-y-1.5'>
              <label
                className='text-xs font-semibold tracking-widest uppercase'
                style={{ color: "#4a6b5b" }}
              >
                Full Name
              </label>
              <div className='relative'>
                <User
                  className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4'
                  style={{ color: "#a4c3b2" }}
                />
                <Input
                  placeholder='Dr. Julian Reed'
                  className='pl-10'
                  style={{
                    backgroundColor: "#eaf4f4",
                    border: "1px solid #cce3de",
                    color: "#2d4a3e",
                  }}
                  {...register("name", { required: "Full name is required" })}
                />
              </div>
              {errors.name && (
                <p className='text-xs text-red-500'>{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className='space-y-1.5'>
              <label
                className='text-xs font-semibold tracking-widest uppercase'
                style={{ color: "#4a6b5b" }}
              >
                Email Address
              </label>
              <div className='relative'>
                <Mail
                  className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4'
                  style={{ color: "#a4c3b2" }}
                />
                <Input
                  type='email'
                  placeholder='julian.reed@medical.org'
                  className='pl-10'
                  style={{
                    backgroundColor: "#eaf4f4",
                    border: "1px solid #cce3de",
                    color: "#2d4a3e",
                  }}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className='text-xs text-red-500'>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className='space-y-1.5'>
              <label
                className='text-xs font-semibold tracking-widest uppercase'
                style={{ color: "#4a6b5b" }}
              >
                Password
              </label>
              <div className='relative'>
                <Lock
                  className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4'
                  style={{ color: "#a4c3b2" }}
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder='••••••••••'
                  className='pl-10 pr-10'
                  style={{
                    backgroundColor: "#eaf4f4",
                    border: "1px solid #cce3de",
                    color: "#2d4a3e",
                  }}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((v) => !v)}
                  className='absolute right-3 top-1/2 -translate-y-1/2'
                  style={{ color: "#a4c3b2" }}
                >
                  {showPassword ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className='text-xs text-red-500'>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Role selector */}
            <div className='space-y-2'>
              <label
                className='text-xs font-semibold tracking-widest uppercase'
                style={{ color: "#4a6b5b" }}
              >
                Select Clinical Role
              </label>
              <div className='grid grid-cols-4 gap-2'>
                {ROLES.map(({ value, label, Icon }) => {
                  const active = selectedRole === value;
                  return (
                    <button
                      key={value}
                      type='button'
                      onClick={() => setSelectedRole(value)}
                      className='flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all'
                      style={{
                        backgroundColor: active ? "#eaf4f4" : "white",
                        borderColor: active ? "#6b9080" : "#cce3de",
                        color: active ? "#2d4a3e" : "#7a9e8e",
                        borderWidth: active ? "2px" : "1px",
                      }}
                    >
                      <Icon className='w-5 h-5' />
                      <span className='text-[10px] font-bold tracking-wider'>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {serverError && serverError.includes("role") && (
                <p className='text-xs text-red-500'>{serverError}</p>
              )}
            </div>

            {/* Server error (non-role) */}
            {serverError && !serverError.includes("role") && (
              <p className='text-xs text-red-500 text-center'>{serverError}</p>
            )}

            {/* Submit */}
            <Button
              type='submit'
              className='w-full h-12 text-base font-medium flex items-center justify-center gap-2 mt-2'
              style={{ backgroundColor: "#3d6b56", color: "white" }}
              disabled={loading}
            >
              {loading ? (
                "Creating account…"
              ) : (
                <>
                  Register <ArrowRight className='w-4 h-4' />
                </>
              )}
            </Button>
          </form>

          {/* Sign in link */}
          <p className='text-center text-sm mt-6' style={{ color: "#6b8f7e" }}>
            Already have an account?{" "}
            <Link
              to='/login'
              className='font-semibold hover:underline'
              style={{ color: "#2d4a3e" }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
