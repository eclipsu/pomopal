"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, User, AtSign } from "lucide-react";

import Button from "@/components/Button";
import Input from "@/components/Input";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import { useUser } from "@/hooks/useUser";
import axiosClient from "@/utils/axios";

function toFirstNameUsername(name) {
  return (name || "")
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 32);
}

export default function Register() {
  const { register, refetch } = useUser();
  const router = useRouter();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePic: null,
  });
  const [usernameTouched, setUsernameTouched] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [availability, setAvailability] = useState({
    email: null,
    username: null,
  });

  const checkAvailability = async (field, value) => {
    if (!value?.trim()) {
      setAvailability((prev) => ({ ...prev, [field]: null }));
      return;
    }
    try {
      const res = await axiosClient.get(`/user/check-${field}`, {
        params: { [field]: value.trim() },
      });
      setAvailability((prev) => ({
        ...prev,
        [field]: res.data.available ? "available" : "taken",
      }));
      if (!res.data.available) {
        setErrors((prev) => ({
          ...prev,
          [field]:
            field === "email"
              ? "Email already registered."
              : "Username taken.",
        }));
      }
    } catch {
      setAvailability((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && !usernameTouched) {
        next.username = toFirstNameUsername(value);
      }
      if (field === "username") {
        next.username = String(value).toLowerCase().replace(/[^a-z]/g, "").slice(0, 32);
      }
      return next;
    });
    if (field === "username") setUsernameTouched(true);
    if (field === "email" || field === "username") {
      setAvailability((prev) => ({ ...prev, [field]: null }));
    }
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setGeneralError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim() || formData.name.length < 2)
      newErrors.name = "Full name must be at least 2 characters.";

    if (!/^[a-z]{3,32}$/.test(formData.username))
      newErrors.username =
        "Username must be your first name in lowercase letters (3–32).";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) newErrors.email = "Please enter a valid email address.";

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password))
      newErrors.password =
        "Password must be at least 8 characters, include one uppercase letter and one number.";

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    if (availability.email === "taken")
      newErrors.email = "Email already registered.";
    if (availability.username === "taken")
      newErrors.username = "Username taken.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setGeneralError("");

    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.name,
        timezone,
        formData.username,
      );
      if (!result.success) {
        setGeneralError(result.message || "Something went wrong.");
        return;
      }
      if (formData.profilePic instanceof File) {
        try {
          const body = new FormData();
          body.append("image", formData.profilePic);
          await axiosClient.post("/user/avatar", body);
          await refetch();
        } catch (uploadErr) {
          console.error("Avatar upload failed:", uploadErr);
        }
      }
      router.push("/");
    } catch (error) {
      setGeneralError("Something went wrong. Try a different email.");
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
            <h1 className="text-3xl font-bold text-white">Pomopal</h1>
          </div>
        </div>

        {/* Register Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

          {/* ✅ Profile Picture */}
          <div className="flex justify-center mb-6">
            <ProfilePictureUploader
              value={null}
              onChange={(file) => handleChange("profilePic", file)}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Ram Bahadur"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="pl-11 bg-white/10 text-white placeholder:text-gray-500 h-12"
                  required
                />
              </div>
              {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ram"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  onBlur={() => checkAvailability("username", formData.username)}
                  className="pl-11 bg-white/10 text-white placeholder:text-gray-500 h-12"
                  required
                  minLength={3}
                  maxLength={32}
                />
              </div>
              <p className="text-xs text-gray-500">
                First name only, lowercase letters
              </p>
              {errors.username && <p className="text-red-400 text-xs">{errors.username}</p>}
              {!errors.username && availability.username === "available" ? (
                <p className="text-green-400 text-xs">Username available</p>
              ) : null}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="ram@bahadur.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => checkAvailability("email", formData.email)}
                  className="pl-11 bg-white/10 text-white placeholder:text-gray-500 h-12"
                  required
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
              {!errors.email && availability.email === "available" ? (
                <p className="text-green-400 text-xs">Email available</p>
              ) : null}
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
                  required
                  minLength={8}
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  className="pl-11 bg-white/10 text-white placeholder:text-gray-500 h-12"
                  required
                  minLength={8}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs">{errors.confirmPassword}</p>
              )}
            </div>

            {/* General Error */}
            {generalError && <p className="text-red-400 text-sm text-center">{generalError}</p>}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </div>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link
                href={"/login"}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
