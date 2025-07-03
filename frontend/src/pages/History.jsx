import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { HomeIcon, ClockIcon } from "@heroicons/react/24/solid";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export default function History() {
  const { getHistoryOfUser, logout } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch {
        // TODO: implement toast/snackbar
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} • ${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
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
      <nav className="flex justify-between items-center px-8 py-6 relative z-10">
        <div className="text-3xl font-bold text-white">
          <span className="text-red-500">Meet</span>
          <span className="text-red-500">Pro</span>
        </div>
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
      </nav>

      {/* Header (Improved) */}
      <header className="sticky top-0 z-20 bg-black/60 backdrop-blur-sm border-b border-gray-800 px-6 md:px-12 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-gray-300 hover:text-red-400 transition"
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-lg font-medium">Back to Home</span>
        </button>
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
            Meeting
          </span>{" "}
          History
        </h2>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 z-10 relative">
        {meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting, index) => (
              <div
                key={index}
                className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-red-500/50 transition-all shadow-lg hover:shadow-red-500/10 hover:scale-[1.02] cursor-pointer"
                onClick={() => navigate(`/${meeting.meetingCode}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-600/20 p-2 rounded-lg">
                      <ClockIcon className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {meeting.meetingCode}
                    </h3>
                  </div>
                  <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded-full">
                    #{index + 1}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {formatDate(meeting.date)}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end">
                  <button className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center">
                    Join Again
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-12 border-2 border-dashed border-gray-800 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <ClockIcon className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">
              No Meetings Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Your meeting history will appear here
            </p>
            <button
              onClick={() => navigate("/home")}
              className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-900 transition shadow-lg"
            >
              Start a New Meeting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
