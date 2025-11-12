"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, User } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useUser } from "@/hooks/useUser";

export default function Login() {
  const { login } = useUser();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" })); // clear specific error when typing
  };

  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Please enter your password.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    // console.log("Login attempt:", formData);

    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setErrors({ password: result.message });
        setIsLoading(false);
        return;
      }

      router.push("/");
    } catch (error) {
      setErrors({ password: error.message });
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#1a2332" }}
    >
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">🍅</span>
            </div>
            <Link href="/">
              <h1 className="text-3xl font-bold text-white">Pomopal</h1>
            </Link>
          </div>
        </div>

        {/* Register Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6">Login to your Account</h2>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Ram@Bahadur.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="pl-11 bg-white/10 text-white placeholder:text-gray-500 h-12"
                  error={errors.email}
                  required
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="pl-11 bg-white/10 text-white placeholder:text-gray-500 h-12"
                  error={errors.password}
                  required
                  minLength={8}
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
            </div>

            {/* Terms */}
            {/* <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-white/20 bg-white/10 mt-0.5"
                required
              />
              <label className="text-gray-300">
                I agree to the{" "}
                <button
                  type="button"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Privacy Policy
                </button>
              </label>
            </div> */}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Login
                </div>
              )}
            </Button>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link
                href={"/register"}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Register
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        {/* <p className="text-center text-gray-500 text-xs mt-8">
          © 2025 Pomopal. All rights reserved.
        </p> */}
      </div>
    </div>
  );
}
