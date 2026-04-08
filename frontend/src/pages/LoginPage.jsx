import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, LogIn, Shield, Brain } from "lucide-react";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (user) {
      window.location.href = "/dashboard";
    }
  }, [user]);
  console.log(user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.message || "Login failed. Please try again.");
        return;
      }
      login({ email: data.email, role: json.role, id: json.userId });
      navigate("/dashboard");
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  {
    if (!isReady) {
      return (
        <div className='flex h-screen items-center justify-center'>
          <Card className='w-full max-w-md p-8 text-center'>
            <Shield className='mx-auto mb-4 h-12 w-12 text-blue-500' />
            <h2 className='mb-2 text-2xl font-bold'>Loading...</h2>
            <p className='text-gray-600'>
              Preparing your secure login experience.
            </p>
          </Card>
        </div>
      );
    }

    return (
      <div
        className='min-h-screen flex flex-col items-center justify-center px-4'
        style={{ backgroundColor: "#f6fff8" }}
      >
        {/* Logo + Brand */}
        <div className='flex flex-col items-center mb-8 gap-3'>
          <div
            className='w-14 h-14 rounded-2xl flex items-center justify-center'
            style={{ backgroundColor: "#6b9080" }}
          >
            <svg width='28' height='28' viewBox='0 0 24 24' fill='white'>
              <path d='M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z' />
              <path d='M13 8h-2v5h2zm0 6h-2v2h2z' opacity='0' />
              {/* Medical cross */}
              <path d='M11 6h2v4h4v2h-4v4h-2v-4H7v-2h4z' />
            </svg>
          </div>
          <div className='text-center'>
            <h1 className='text-2xl font-bold' style={{ color: "#2d4a3e" }}>
              MedRAG AI
            </h1>
            <p className='text-sm' style={{ color: "#6b9080" }}>
              Clinical Intelligence Portal
            </p>
          </div>
        </div>

        {/* Card */}
        <Card
          className='w-full max-w-md p-8 shadow-sm'
          style={{ backgroundColor: "white", border: "1px solid #cce3de" }}
        >
          <div className='mb-6'>
            <h2 className='text-2xl font-semibold' style={{ color: "#1a2e25" }}>
              Welcome Back
            </h2>
            <p className='text-sm mt-1' style={{ color: "#6b8f7e" }}>
              Please enter your clinical credentials
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className='space-y-5'
          >
            {/* Email */}
            <div className='space-y-1.5'>
              <label
                className='text-xs font-semibold tracking-widest uppercase'
                style={{ color: "#4a6b5b" }}
              >
                Email
              </label>
              <div className='relative'>
                <Mail
                  className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4'
                  style={{ color: "#a4c3b2" }}
                />
                <Input
                  type='email'
                  placeholder='clinician@hospital.org'
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
              <div className='flex justify-between items-center'>
                <label
                  className='text-xs font-semibold tracking-widest uppercase'
                  style={{ color: "#4a6b5b" }}
                >
                  Password
                </label>
                <span
                  className='text-xs cursor-pointer hover:underline'
                  style={{ color: "#6b9080" }}
                >
                  Forgot?
                </span>
              </div>
              <div className='relative'>
                <Lock
                  className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4'
                  style={{ color: "#a4c3b2" }}
                />
                <Input
                  type='password'
                  placeholder='••••••••••'
                  className='pl-10'
                  style={{
                    backgroundColor: "#eaf4f4",
                    border: "1px solid #cce3de",
                    color: "#2d4a3e",
                  }}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
              </div>
              {errors.password && (
                <p className='text-xs text-red-500'>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Server Error */}
            {serverError && (
              <p className='text-xs text-red-500 text-center'>{serverError}</p>
            )}

            {/* Submit */}
            <Button
              type='submit'
              className='w-full h-12 text-base font-medium flex items-center justify-center gap-2'
              style={{ backgroundColor: "#6b9080", color: "white" }}
              disabled={loading}
            >
              {loading ? (
                "Signing in…"
              ) : (
                <>
                  Login <LogIn className='w-4 h-4' />
                </>
              )}
            </Button>
          </form>

          {/* Register link */}
          <div
            className='mt-6 text-center text-sm'
            style={{ color: "#6b8f7e" }}
          >
            New to the platform?{" "}
            <Link
              to='/register'
              className='font-semibold hover:underline'
              style={{ color: "#2d4a3e" }}
            >
              Register Now
            </Link>
          </div>
        </Card>

        {/* Footer trust badges */}
        <div className='flex gap-12 mt-10'>
          <div className='flex items-start gap-2'>
            <Shield className='w-5 h-5 mt-0.5' style={{ color: "#6b9080" }} />
            <div>
              <p
                className='text-xs font-semibold tracking-widest uppercase'
                style={{ color: "#4a6b5b" }}
              >
                Secure
              </p>
              <p className='text-xs' style={{ color: "#7a9e8e" }}>
                HIPAA Compliant Data
                <br />
                Handling
              </p>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <Brain className='w-5 h-5 mt-0.5' style={{ color: "#6b9080" }} />
            <div>
              <p
                className='text-xs font-semibold tracking-widest uppercase'
                style={{ color: "#4a6b5b" }}
              >
                Intelligence
              </p>
              <p className='text-xs' style={{ color: "#7a9e8e" }}>
                RAG-Optimized Insights
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
