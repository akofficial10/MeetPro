import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import WithAuth from "../utils/WithAuth";
import { ClockIcon } from "@heroicons/react/24/outline";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory, logout } = useContext(AuthContext);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);

  // Simulate active users count
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(Math.floor(Math.random() * 5000) + 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  const generateMeetingCode = () => {
    setIsGenerating(true);

    const chars = "abcdefghijklmnopqrstuvwxyz23456789"; 

    const generateGroup = (length) => {
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const part1 = generateGroup(3);
    const part2 = generateGroup(4);
    const part3 = generateGroup(3);

    // assemble the full link
    const meetingLink = `${part1}-${part2}-${part3}`;

    setTimeout(() => {
      setMeetingCode(meetingLink);
      setIsGenerating(false);
    }, 800);
  };
  

  const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) return;

    try {
      await addToUserHistory(meetingCode);
      navigate(`/${meetingCode}`);
    } catch (error) {
      console.error("Error joining meeting:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black overflow-hidden">
      {/* Particle Background */}
      <div className="absolute inset-0 z-0">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: { color: { value: "#000000" } },
            fpsLimit: 120,
            interactivity: {
              events: {
                onHover: { enable: true, mode: "repulse" },
                resize: true,
              },
              modes: { repulse: { distance: 100, duration: 0.4 } },
            },
            particles: {
              color: { value: "#ff0000" },
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
                outModes: { default: "bounce" },
                random: false,
                speed: 2,
                straight: false,
              },
              number: {
                density: { enable: true, area: 800 },
                value: 80,
              },
              opacity: { value: 0.5 },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 3 } },
            },
            detectRetina: true,
          }}
        />
      </div>

      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500 rounded-full filter blur-3xl opacity-10 -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500 rounded-full filter blur-3xl opacity-10 -z-10"></div>

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-6 z-10">
        <div className="text-3xl font-bold text-white">
          <span className="text-red-500"></span> Meet
          <span className="text-red-500">Pro</span>
        </div>
        <div className="flex items-center space-x-6">
          <button
            onClick={() => navigate("/history")}
            className="flex items-center space-x-2 text-gray-300 hover:text-red-400 transition group"
          >
            <div className="relative">
              <ClockIcon className="h-6 w-6 group-hover:text-red-500 transition" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </div>
            <span className="font-medium">History</span>
          </button>
          <button
            onClick={logout}
            className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-2 rounded-full hover:from-red-700 hover:to-red-900 transition-all shadow-lg flex items-center space-x-2"
          >
            <span>Logout</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 py-12 md:px-16 z-10">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-1/2 max-w-2xl space-y-10">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
                Connect
              </span>{" "}
              Instantly
            </h1>
            <p className="text-xl text-gray-300">
              Join or create high-quality video meetings with one click
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                placeholder="Enter meeting code"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg font-mono tracking-wider"
              />
              {meetingCode && (
                <button
                  onClick={() => setMeetingCode("")}
                  className="absolute right-4 top-4 text-gray-400 hover:text-white transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleJoinVideoCall}
                disabled={!meetingCode.trim()}
                className={`py-4 rounded-xl flex items-center justify-center space-x-2 transition-all ${
                  meetingCode.trim()
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-900 cursor-not-allowed"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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
                <span className="font-medium">Join Meeting</span>
              </button>

              <button
                onClick={generateMeetingCode}
                disabled={isGenerating}
                className="py-4 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-800 hover:border-red-500/50 flex items-center justify-center space-x-2 transition-all"
              >
                {isGenerating ? (
                  <svg
                    className="animate-spin h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                )}
                <span className="font-medium">
                  {isGenerating ? "Generating..." : "New Meeting"}
                </span>
              </button>
            </div>
          </div>

          {/* Active Users Counter */}
          <div className="mt-12 p-6 bg-gray-900/50 rounded-xl border border-gray-800 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 bg-red-500 rounded-full opacity-75 animate-ping"></div>
                </div>
                <span className="text-gray-300">Active meetings</span>
              </div>
              <span className="text-2xl font-bold text-red-400">
                {activeUsers.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel - Visual Element */}
        <div className="w-full lg:w-1/2 flex justify-center items-center mt-16 lg:mt-0">
          <div className="relative w-full max-w-xl">
            {/* Floating Conference Room */}
            <div className="relative">
              {/* Main screen */}
              <div className="bg-gray-900/80 border-2 border-red-500/30 rounded-3xl p-1 shadow-2xl transform rotate-1">
                <div className="bg-gray-900 rounded-2xl overflow-hidden h-96 w-full relative">
                  {/* Grid of participants */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-gray-800/50 rounded-md flex items-center justify-center"
                      >
                        <div
                          className={`w-10 h-10 rounded-full ${
                            i % 3 === 0
                              ? "bg-red-600"
                              : i % 3 === 1
                              ? "bg-blue-600"
                              : "bg-purple-600"
                          } flex items-center justify-center`}
                        >
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
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Spotlight effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Floating controls */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <div className="bg-gray-900 border border-red-500/30 rounded-full p-3 shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-500"
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
                </div>
                <div className="bg-red-600 rounded-full p-4 shadow-lg transform hover:scale-110 transition">
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
                </div>
                <div className="bg-gray-900 border border-red-500/30 rounded-full p-3 shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-500"
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
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-red-500 rounded-full opacity-20 animate-float-delay-1"></div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-red-500 rounded-full opacity-20 animate-float-delay-2"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default WithAuth(HomeComponent);
