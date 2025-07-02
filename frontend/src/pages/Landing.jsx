import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import "../index.css";
import useTyped from "../components/TypeWriter";

export default function LandingPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-black">
      {/* Particle.js Background */}
      <div className="absolute inset-0 z-0">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: {
              color: {
                value: "#000000",
              },
            },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: {
                  enable: true,
                  mode: "push",
                },
                onHover: {
                  enable: true,
                  mode: "repulse",
                },
                resize: true,
              },
              modes: {
                push: {
                  quantity: 4,
                },
                repulse: {
                  distance: 100,
                  duration: 0.4,
                },
              },
            },
            particles: {
              color: {
                value: "#ff0000",
              },
              links: {
                color: "#ff0000",
                distance: 150,
                enable: true,
                opacity: 0.3,
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: {
                  default: "bounce",
                },
                random: false,
                speed: 2,
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                  area: 800,
                },
                value: 80,
              },
              opacity: {
                value: 0.5,
              },
              shape: {
                type: "circle",
              },
              size: {
                value: { min: 1, max: 3 },
              },
            },
            detectRetina: true,
          }}
        />
      </div>

      {/* Enhanced Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 z-10 relative bg-black/80 backdrop-blur-sm border-b border-red-900/30">
        <div className="text-3xl font-bold text-white flex items-center">
          <span className="text-red-500 animate-pulse"></span>
          <span className="ml-2">
            Meet<span className="text-red-500">Pro</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6 items-center">
          <button
            onClick={() => navigate("/auth")}
            className="text-gray-300 hover:text-red-400 transition-all duration-300 hover:scale-105 flex items-center group"
          >
            <span className="mr-1"></span> Register
            <span className="block w-0 group-hover:w-full h-0.5 bg-red-500 transition-all duration-300 mt-1"></span>
          </button>
          <button
            onClick={() => navigate(userData ? "/home" : "/auth")}
            className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-2 rounded-full hover:from-red-700 hover:to-red-900 transition-all duration-300 shadow-lg hover:shadow-red-500/30 flex items-center"
          >
            <span className="mr-2">{userData ? "" : ""}</span>
            {userData ? "Go to Home" : "Login"}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white focus:outline-none z-30"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? (
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/90 z-20 flex flex-col items-center justify-center space-y-8 pt-20">
          <button
            onClick={() => {
              navigate("/auth");
              setMobileMenuOpen(false);
            }}
            className="text-2xl text-white hover:text-red-500 transition-all flex items-center"
          >
            <span className="mr-3"></span> Register
          </button>
          <button
            onClick={() => {
              navigate(userData ? "/home" : "/auth");
              setMobileMenuOpen(false);
            }}
            className="text-2xl bg-gradient-to-r from-red-600 to-red-800 text-white px-8 py-3 rounded-full hover:from-red-700 hover:to-red-900 transition-all"
          >
            <span className="mr-3">{userData ? "" : ""}</span>
            {userData ? "Go to Home" : "Login"}
          </button>
        </div>
      )}

      {/* Hero Section */}
      <main className="flex flex-col-reverse md:flex-row items-center justify-between flex-1 px-6 py-12 md:px-16 z-10 relative">
        <div className="max-w-2xl space-y-8 text-center md:text-left">
          <div className="inline-block bg-red-900/20 px-4 py-2 rounded-full mb-4 border border-red-900/50">
            <span className="text-red-400 text-sm font-medium">
              Version 2.0 Released
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
              Connect
            </span>{" "}
            with <br />
            <span
              ref={useTyped(
                ["Confidence", "Friends", "Family", "Colleagues", "Loved Ones"],
                {
                  typeSpeed: 100,
                  backSpeed: 50,
                  loop: true,
                  showCursor: true,
                  cursorChar: "|",
                  smartBackspace: true,
                }
              )}
              className=" decoration-red-500"
            />
          </h1>

          <p className="text-xl text-gray-300 max-w-lg">
            Experience crystal clear video calls with our revolutionary
            platform. Fast, secure, and designed for real connections.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              to={userData ? "/home" : "/auth"}
              className=" bg-gradient-to-r from-red-600 to-red-800 text-white px-8 py-4 rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all duration-300 transform hover:scale-105 font-medium flex items-center"
            >
              <span className="mr-2"></span> Get Started
            </Link>
            <button
              onClick={() => navigate("/aljk23")}
              className=" border-2 border-red-500/50 text-white px-8 py-4 rounded-full shadow-lg hover:bg-red-500/10 transition-all duration-300 transform hover:scale-105 font-medium flex items-center"
            >
              <span className="mr-2"></span> Join as Guest
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {[
              { icon: "🔒", name: "Secure", desc: "End-to-End Encrypted" },
              { icon: "🖥️", name: "HD", desc: "Crystal Clear Quality" },
              { icon: "📱", name: "Multi-Device", desc: "Works Everywhere" },
              { icon: "👥", name: "Group", desc: "Up to 50 People" },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-black/30 p-4 rounded-xl border border-red-900/30 hover:border-red-500/50 transition-all group"
              >
                <div className="text-2xl mb-2">{feature.icon}</div>
                <div className="font-bold text-white">{feature.name}</div>
                <div className="text-sm text-gray-400">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Conference Mockup */}
        <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0 relative">
          <div className="relative w-full max-w-lg">
            {/* Conference container */}
            <div className="relative bg-gray-900 rounded-3xl shadow-2xl border-2 border-red-500/30 overflow-hidden transform rotate-2 animate-float">
              {/* Conference grid */}
              <div className="grid grid-cols-2 grid-rows-2 gap-2 p-4 h-96 md:h-[28rem]">
                {/* Participant 1 (You) */}
                <div className="bg-gray-800 rounded-xl relative overflow-hidden flex items-center justify-center border border-red-500/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-red-900/20"></div>
                  <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center animate-pulse shadow-lg z-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    You
                  </div>
                </div>

                {/* Participant 2 */}
                <div className="bg-gray-800 rounded-xl relative overflow-hidden flex items-center justify-center border border-red-500/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-red-900/20"></div>
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center z-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Sarah
                  </div>
                </div>

                {/* Participant 3 */}
                <div className="bg-gray-800 rounded-xl relative overflow-hidden flex items-center justify-center border border-red-500/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-red-900/20"></div>
                  <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center z-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Alex
                  </div>
                </div>

                {/* Participant 4 */}
                <div className="bg-gray-800 rounded-xl relative overflow-hidden flex items-center justify-center border border-red-500/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-red-900/20"></div>
                  <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center z-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Michael
                  </div>
                </div>
              </div>

              {/* Conference controls */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4 px-4">
                <button className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </button>
                <button className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-red-500 rounded-full animate-float-delay-1"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-full animate-float-delay-2"></div>
            </div>

            {/* Connection status */}
            <div className="absolute -top-3 -right-3 flex items-center space-x-1 bg-black/80 rounded-full px-3 py-1 border border-red-500/30">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-white font-medium">Live Call</span>
            </div>
          </div>
        </div>
      </main>

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500 rounded-full filter blur-3xl opacity-10 -z-10 animate-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500 rounded-full filter blur-3xl opacity-10 -z-10 animate-glow-delay"></div>

      {/* Footer */}
      <div className="py-6 text-center text-gray-400 text-sm z-10 border-t border-red-900/30 mt-auto">
        © {new Date().getFullYear()} MeetPro. All rights reserved.
      </div>
    </div>
  );
}
