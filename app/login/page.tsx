"use client";

import { useState } from "react";
import Image from "next/image";
import { User, ShieldUser, ArrowLeft, Eye, EyeOff } from "lucide-react";

type Role = "student" | "admin" | null;

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-background font-sans">
      
      {/* 
        LEFT COLUMN (Form container)
        Translates to the right half when a role is selected 
      */}
      <div 
        className={`absolute top-0 left-0 w-full lg:w-1/2 h-full z-20 bg-slate-50/90 flex flex-col overflow-y-auto transition-transform duration-[800ms] ease-in-out ${
          selectedRole ? "lg:translate-x-full shadow-2xl" : "translate-x-0"
        }`}
      >
        {/* Subtle decorative background blobs to enhance the liquid crystal glassmorphism */}
        <div className="absolute top-[5%] -left-[5%] w-[450px] h-[450px] bg-[#1d4ed8]/15 rounded-full blur-[90px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-[10%] -right-[5%] w-[500px] h-[500px] bg-[#E50000]/15 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        {/* Brand Header */}
        <div className="w-full p-8 sm:p-12 pb-4 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-[#E50000] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            San Agustin Clinic
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full px-4 sm:px-12 md:px-20 pb-16 min-h-max">
          {/* Content Wrapper (Crystal/Clear Container) */}
          <div className="w-full max-w-[500px] relative shrink-0 my-auto bg-gradient-to-br from-white/70 via-white/40 to-white/20 backdrop-blur-[40px] border-[1.5px] border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_0_32px_rgba(255,255,255,0.4)] rounded-[2.5rem] overflow-hidden">
          
          {/* Subtle shiny reflection ring inside the liquid crystal */}
          <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-white/50 pointer-events-none"></div>

          <div className="relative grid grid-cols-1 grid-rows-1 w-full p-8 sm:p-12">
            
            {/* Role Selection View */}
            <div className={`col-start-1 row-start-1 transition-all duration-500 flex flex-col justify-center ${
              selectedRole ? "opacity-0 invisible scale-95" : "opacity-100 visible scale-100"
            }`}>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Welcome, Agustinian!</h1>
              <p className="text-muted-foreground mb-10 text-[15px] leading-relaxed">
                Access your medical records, book appointments, and manage clinic services in one secure location.
              </p>

              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-bold uppercase tracking-wider text-foreground/50">Login as</span>
                <div className="h-px flex-1 bg-neutral-200"></div>
              </div>

              <div className="grid grid-cols-1 gap-4 text-left">
                <button
                  onClick={() => setSelectedRole("student")}
                  className="flex items-center gap-5 p-5 rounded-2xl border border-neutral-200 bg-white hover:border-[#E50000] hover:shadow-md transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:bg-[#E50000] group-hover:text-white transition-colors text-neutral-600 shadow-none">
                    <User size={28} />
                  </div>
                  <div className="text-left w-full">
                    <h3 className="text-xl font-bold text-foreground">Student</h3>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Access your health records</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedRole("admin")}
                  className="flex items-center gap-5 p-5 rounded-2xl border border-neutral-200 bg-white hover:border-[#E50000] hover:shadow-md transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:bg-[#E50000] group-hover:text-white transition-colors text-neutral-600 shadow-none">
                    <ShieldUser size={28} />
                  </div>
                  <div className="text-left w-full">
                    <h3 className="text-xl font-bold text-foreground">Admin</h3>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Manage clinic operations</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Login Form View */}
            <div className={`col-start-1 row-start-1 transition-all duration-500 flex flex-col justify-center delay-200 ${
              selectedRole ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95"
            }`}>
              <button 
                onClick={() => setSelectedRole(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors group w-fit"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-semibold text-sm">Back to roles</span>
              </button>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Sign into your account
              </h2>
              <p className="text-muted-foreground mb-10 text-[15px] capitalize">
                Welcome back, please enter your {selectedRole} details.
              </p>

              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  window.location.href = selectedRole === "admin" ? "/admin" : "/";
                }}
              >
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Phone or Email address"
                      className="w-full px-5 py-4 rounded-xl border border-neutral-200 bg-white text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-[#E50000] focus:border-transparent transition-all shadow-sm"
                      required
                    />
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="w-full px-5 py-4 pr-12 rounded-xl border border-neutral-200 bg-white text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-[#E50000] focus:border-transparent transition-all shadow-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#E50000] transition-colors focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-4">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl text-white font-bold text-[15px] shadow-sm hover:shadow-md hover:bg-neutral-800 transition-all bg-[#0a0a0a]"
                  >
                    Log In
                  </button>
                  <div className="text-center">
                    <a href="#" className="text-sm font-semibold text-muted-foreground hover:text-[#E50000] transition-colors hover:underline">
                      Forgot password?
                    </a>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>

    {/* 
      RIGHT COLUMN (Image container)
      Translates to the left half when a role is selected
    */}
    <div 
        className={`hidden lg:block absolute top-0 right-0 w-1/2 h-full z-0 bg-neutral-900 overflow-hidden transition-transform duration-[800ms] ease-in-out ${
          selectedRole ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/USA.webp"
            alt="University of San Agustin"
            fill
            className="object-cover scale-105"
            priority
          />
          {/* Enhanced darken overlay for better contrast and sleeker look */}
          <div className="absolute inset-0 bg-black/55 z-10"></div>
          
          {/* A sleek subtle red accent glow at the corner to maintain brand connection */}
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#E50000]/40 blur-[100px] rounded-full z-10 mix-blend-screen pointer-events-none"></div>
        </div>
      </div>

    </div>
  );
}
