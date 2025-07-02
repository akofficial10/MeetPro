import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import {
  IconButton,
  TextField,
  Button,
  Badge,
  Avatar,
  Tooltip,
} from "@mui/material";
import {
  Videocam,
  VideocamOff,
  CallEnd,
  Mic,
  MicOff,
  ScreenShare,
  StopScreenShare,
  Chat,
  People,
  MoreVert,
  Close,
  Info,
  PersonAdd,
  Settings,
  Fullscreen,
  FullscreenExit,
} from "@mui/icons-material";
import server from "../environment";
import { useAuth } from "../contexts/AuthContext";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const server_url = server;
const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
let connections = {};

export default function VideoMeetComponent() {
  const navigate = useNavigate();
  const { userData, addToUserHistory } = useAuth();
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoref = useRef();
  const videoRef = useRef([]);
  const chatContainerRef = useRef();
  const participantsContainerRef = useRef();
  const meetingContainerRef = useRef();

  const [videoAvailable, setVideoAvailable] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState(userData?.name || "");
  const [videos, setVideos] = useState([]);
  const [meetingCode] = useState(window.location.pathname.split("/").pop());
  const [localStream, setLocalStream] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [meetingTime, setMeetingTime] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (!askForUsername && !isConnecting) {
      timer = setInterval(() => {
        setMeetingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [askForUsername, isConnecting]);

  // Format meeting time
  const formatMeetingTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours > 0 ? hours + ":" : ""}${
      minutes < 10 ? "0" + minutes : minutes
    }:${secs < 10 ? "0" + secs : secs}`;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!fullscreen) {
      if (meetingContainerRef.current.requestFullscreen) {
        meetingContainerRef.current.requestFullscreen();
      } else if (meetingContainerRef.current.webkitRequestFullscreen) {
        meetingContainerRef.current.webkitRequestFullscreen();
      }
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      setFullscreen(false);
    }
  };

  useEffect(() => {
    getPermissions();
    if (userData) {
      setUsername(userData.name);
      setAskForUsername(false);
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      Object.values(connections).forEach((peer) => peer && peer.close());
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      getUserMedia();
    }
  }, [video, audio, videoAvailable, audioAvailable]);

  useEffect(() => {
    if (screen) {
      getDisplayMedia();
    } else if (
      localStream &&
      localStream.getVideoTracks()[0]?.kind === "screen"
    ) {
      getUserMedia();
    }
  }, [screen]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const getPermissions = async () => {
    try {
      // Check video permissions
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoStream.getTracks().forEach((track) => track.stop());
        setVideoAvailable(true);
      } catch (err) {
        console.warn("Video permissions denied:", err);
        setVideoAvailable(false);
        setVideo(false);
      }

      // Check audio permissions
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStream.getTracks().forEach((track) => track.stop());
        setAudioAvailable(true);
      } catch (err) {
        console.warn("Audio permissions denied:", err);
        setAudioAvailable(false);
        setAudio(false);
      }

      // Check screen sharing availability
      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      // Show warning if neither media is available
      if (!videoAvailable && !audioAvailable) {
        setMediaError(
          "Please enable camera or microphone permissions to participate in the call"
        );
      }
    } catch (err) {
      console.error("Permissions error:", err);
      setMediaError("Error checking media permissions");
    }
  };

  const getUserMedia = async () => {
    try {
      const constraints = {
        video: video && videoAvailable,
        audio: audio && audioAvailable,
      };

      // Skip if neither video nor audio is requested
      if (!constraints.video && !constraints.audio) {
        console.log("No media requested - skipping getUserMedia");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      handleUserMediaSuccess(stream);
      setMediaError(null);
    } catch (err) {
      console.error("Error getting user media:", err);
      setMediaError(
        "Failed to access media devices. Please check permissions."
      );

      if (err.name === "NotAllowedError") {
        setMediaError(
          "Please allow microphone and camera permissions to continue"
        );
      }
    }
  };

  const getDisplayMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: audio && audioAvailable,
      });
      handleUserMediaSuccess(stream);
      setMediaError(null);

      stream.getVideoTracks()[0].onended = () => {
        setScreen(false);
      };
    } catch (err) {
      console.error("Error getting display media:", err);
      setScreen(false);
      if (err.name !== "NotAllowedError") {
        setMediaError("Failed to share screen");
      }
    }
  };

  const handleUserMediaSuccess = (stream) => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Ensure audio tracks are properly enabled/disabled
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      audioTracks[0].enabled = audio;
    }

    setLocalStream(stream);
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    // Update all peer connections with the new stream
    Object.keys(connections).forEach((id) => {
      if (id === socketIdRef.current || !connections[id]) return;

      try {
        const sender = connections[id].getSenders();
        sender.forEach((s) => connections[id].removeTrack(s));

        stream.getTracks().forEach((track) => {
          connections[id].addTrack(track, stream);
        });

        connections[id]
          .createOffer()
          .then((offer) => connections[id].setLocalDescription(offer))
          .then(() => {
            socketRef.current?.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((err) => {
            console.error("Error renegotiating connection:", err);
          });
      } catch (err) {
        console.error("Error updating peer connection:", err);
      }
    });

    // Handle track ending
    stream.getTracks().forEach((track) => {
      track.onended = () => {
        if (track.kind === "video") setVideo(false);
        if (track.kind === "audio") setAudio(false);
      };
    });
  };

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", window.location.href);
      setIsConnecting(false);
    });

    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("chat-message", addMessage);

    socketRef.current.on("user-left", (id) => {
      if (connections[id]) {
        connections[id].close();
        delete connections[id];
      }
      setVideos((prev) => prev.filter((v) => v.socketId !== id));
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    });

    socketRef.current.on("user-joined", (id, clients) => {
      setParticipants(
        clients.map((client) => ({
          id: client,
          name:
            client === socketIdRef.current
              ? username
              : `User ${client.substring(0, 4)}`,
        }))
      );

      clients.forEach((socketListId) => {
        if (!connections[socketListId]) {
          const peerConnection = new RTCPeerConnection(peerConfigConnections);
          connections[socketListId] = peerConnection;

          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          peerConnection.ontrack = (event) => {
            addRemoteStream(socketListId, event.streams[0]);
          };

          peerConnection.oniceconnectionstatechange = () => {
            if (
              peerConnection.iceConnectionState === "disconnected" ||
              peerConnection.iceConnectionState === "failed"
            ) {
              if (connections[socketListId]) {
                connections[socketListId].close();
                delete connections[socketListId];
              }
              setVideos((prev) =>
                prev.filter((v) => v.socketId !== socketListId)
              );
              setParticipants((prev) =>
                prev.filter((p) => p.id !== socketListId)
              );
            }
          };

          if (localStream) {
            localStream.getTracks().forEach((track) => {
              peerConnection.addTrack(track, localStream);
            });
          }
        }
      });
    });

    // Detect active speaker
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;

    const detectActiveSpeaker = () => {
      const audioLevels = {};

      videos.forEach(({ socketId, stream }) => {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          const source = audioContext.createMediaStreamSource(
            new MediaStream([audioTrack])
          );
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);

          const level =
            dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          audioLevels[socketId] = level;

          source.disconnect();
        }
      });

      if (Object.keys(audioLevels).length > 0) {
        const maxId = Object.keys(audioLevels).reduce((a, b) =>
          audioLevels[a] > audioLevels[b] ? a : b
        );

        if (audioLevels[maxId] > 10) {
          // Threshold
          setActiveSpeaker(maxId);
        } else {
          setActiveSpeaker(null);
        }
      }

      requestAnimationFrame(detectActiveSpeaker);
    };

    detectActiveSpeaker();
  };

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);
    if (fromId === socketIdRef.current) return;

    if (signal.sdp) {
      connections[fromId]
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          if (signal.sdp.type === "offer") {
            connections[fromId].createAnswer().then((description) => {
              connections[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit(
                  "signal",
                  fromId,
                  JSON.stringify({ sdp: connections[fromId].localDescription })
                );
              });
            });
          }
        });
    }

    if (signal.ice) {
      connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
    }
  };

  const addRemoteStream = (socketId, stream) => {
    setVideos((prev) => {
      if (prev.some((v) => v.socketId === socketId)) return prev;
      return [...prev, { socketId, stream }];
    });
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prev) => [...prev, { sender, data, timestamp: new Date() }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socketRef.current.emit("chat-message", message, username);
      setMessage("");
    }
  };

  const connect = () => {
    setIsConnecting(true);
    setAskForUsername(false);
    connectToSocketServer();

    // Only try to get media if permissions are available
    if (videoAvailable || audioAvailable) {
      getUserMedia();
    }
  };

  const handleEndCall = async () => {
    try {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }

      Object.keys(connections).forEach((id) => {
        if (connections[id]) {
          connections[id].close();
          delete connections[id];
        }
      });

      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      if (userData && meetingCode) {
        try {
          await addToUserHistory(meetingCode);
        } catch (err) {
          console.error("Failed to add meeting to history:", err);
        }
      }

      navigate("/home");
    } catch (err) {
      console.error("Error ending call:", err);
      navigate("/home");
    }
  };

  const handleVideo = () => {
    setVideo((prev) => {
      const newValue = !prev;
      if (newValue && !videoAvailable) {
        setMediaError(
          "Camera permissions denied. Please enable camera access in your browser settings."
        );
        return false;
      }
      return newValue;
    });
  };

  const handleAudio = () => {
    setAudio((prev) => {
      const newValue = !prev;
      if (newValue && !audioAvailable) {
        setMediaError(
          "Microphone permissions denied. Please enable microphone access in your browser settings."
        );
        return false;
      }
      return newValue;
    });
  };

  const handleScreen = () => setScreen((prev) => !prev);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Pre-meeting controls component
  const PreMeetingControls = () => (
    <div className="flex flex-col items-center justify-center flex-1 p-6 space-y-6 z-10">
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center mb-6">
          Join <span className="text-red-500">Meeting</span>
        </h2>

        <div className="mb-6 flex justify-center">
          <div className="relative w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            {video ? (
              <video
                ref={localVideoref}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                  <Avatar className="w-16 h-16 text-3xl">
                    {username.charAt(0).toUpperCase()}
                  </Avatar>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
              <Tooltip title={video ? "Turn off camera" : "Turn on camera"}>
                <button
                  onClick={handleVideo}
                  className={`p-2 rounded-full ${
                    video
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {video ? (
                    <Videocam className="text-white" />
                  ) : (
                    <VideocamOff className="text-white" />
                  )}
                </button>
              </Tooltip>
              <Tooltip title={audio ? "Mute microphone" : "Unmute microphone"}>
                <button
                  onClick={handleAudio}
                  className={`p-2 rounded-full ${
                    audio
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {audio ? (
                    <Mic className="text-white" />
                  ) : (
                    <MicOff className="text-white" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {mediaError && (
          <div className="text-red-400 bg-red-900/30 p-3 rounded-lg mb-4 border border-red-900/50">
            {mediaError}
          </div>
        )}

        <TextField
          label="Your Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          variant="outlined"
          fullWidth
          className="mb-6"
          InputProps={{
            className: "text-white",
          }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={connect}
          disabled={!username.trim() || isConnecting}
          className={`w-full py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 ${
            isConnecting ? "opacity-70" : ""
          }`}
        >
          {isConnecting ? "Joining..." : "Join Now"}
        </Button>
      </div>
    </div>
  );

  return (
    <div
      className="flex flex-col w-full h-screen bg-black text-white relative"
      ref={meetingContainerRef}
    >
      {/* Particle Background */}
      <div className="absolute inset-0 z-0">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: { color: { value: "#000000" } },
            fpsLimit: 60,
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
                opacity: 0.2,
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: 1,
                straight: false,
              },
              number: {
                density: { enable: true, area: 800 },
                value: 40,
              },
              opacity: { value: 0.3 },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 3 } },
            },
            detectRetina: true,
          }}
        />
      </div>

      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500 rounded-full filter blur-3xl opacity-5 -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500 rounded-full filter blur-3xl opacity-5 -z-10"></div>

      {askForUsername && !userData ? (
        <PreMeetingControls />
      ) : (
        <div className="flex flex-1 relative h-full overflow-hidden">
          {/* Chat Panel */}
          {showChat && (
            <div className="absolute md:relative z-20 w-full md:w-96 h-full bg-gray-900/90 backdrop-blur-md border-r border-gray-800 flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-gray-800">
                <h2 className="text-xl font-bold">Meeting Chat</h2>
                <IconButton
                  onClick={() => setShowChat(false)}
                  className="text-white"
                >
                  <Close />
                </IconButton>
              </div>
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.length ? (
                  messages.map((item, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        item.sender === username
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs rounded-lg p-3 ${
                          item.sender === username
                            ? "bg-red-600/90"
                            : "bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold">{item.sender}</span>
                          <span className="text-xs text-gray-300">
                            {formatTime(item.timestamp)}
                          </span>
                        </div>
                        <p>{item.data}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">No messages yet</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message"
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      className: "text-white",
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={sendMessage}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Participants Panel */}
          {showParticipants && (
            <div className="absolute md:relative z-20 w-full md:w-80 h-full bg-gray-900/90 backdrop-blur-md border-r border-gray-800 flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-gray-800">
                <h2 className="text-xl font-bold">
                  Participants ({participants.length})
                </h2>
                <IconButton
                  onClick={() => setShowParticipants(false)}
                  className="text-white"
                >
                  <Close />
                </IconButton>
              </div>
              <div
                ref={participantsContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg ${
                      activeSpeaker === participant.id
                        ? "bg-red-900/20"
                        : "hover:bg-gray-800/50"
                    }`}
                  >
                    <Avatar
                      className={`${
                        activeSpeaker === participant.id
                          ? "bg-red-600"
                          : "bg-gray-700"
                      }`}
                    >
                      {participant.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">
                        {participant.name}{" "}
                        {participant.id === socketIdRef.current && "(You)"}
                      </div>
                      {activeSpeaker === participant.id && (
                        <div className="text-xs text-red-400 flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                          Speaking
                        </div>
                      )}
                    </div>
                    <IconButton size="small" className="text-gray-400">
                      <MoreVert />
                    </IconButton>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-800">
                <Button
                  fullWidth
                  startIcon={<PersonAdd />}
                  className="bg-gray-800 hover:bg-gray-700 text-white"
                >
                  Add people
                </Button>
              </div>
            </div>
          )}

          {/* Main Video Area */}
          <div className="flex-1 relative bg-black">
            {/* Meeting Info and Controls */}
            <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 shadow-md flex items-center space-x-3">
              <Info className="text-blue-300" fontSize="small" />
              <div className="flex flex-col">
                <span className="text-xs text-white/80">Meeting Code</span>
                <span className="font-mono text-sm text-blue-100">
                  {meetingCode}
                </span>
              </div>
              <Button
                variant="outlined"
                size="small"
                className="text-blue-200 border-blue-400/40 hover:border-blue-300 hover:bg-blue-400/20 transition"
                onClick={() => navigator.clipboard.writeText(meetingCode)}
              >
                Copy
              </Button>
            </div>

            <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 shadow-md text-white/80 text-sm">
                {formatMeetingTime(meetingTime)}
              </div>
              <IconButton
                onClick={toggleFullscreen}
                className="text-white/80 hover:text-white"
                size="small"
              >
                {fullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
              <IconButton
                className="text-white/80 hover:text-white"
                size="small"
              >
                <Settings />
              </IconButton>
            </div>

            {/* Waiting screen if no remote videos and local video off */}
            {!video && videos.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                  <People className="w-12 h-12" />
                </div>
                <h3 className="text-xl mb-2">Waiting for others to join</h3>
                <p className="text-gray-400">
                  Share this meeting code:{" "}
                  <span className="font-mono text-white">{meetingCode}</span>
                </p>
              </div>
            )}

            {/* Video Grid */}
            {(video || videos.length > 0) && (
              <div
                className={`
      absolute inset-0 p-4 gap-4 overflow-auto grid
      ${videos.length + (video ? 1 : 0) === 1 ? "grid-cols-1" : ""}
      ${videos.length + (video ? 1 : 0) === 2 ? "sm:grid-cols-2" : ""}
      ${
        videos.length + (video ? 1 : 0) > 2
          ? "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          : ""
      }
      auto-rows-[minmax(150px,1fr)]
    `}
              >
                {/* Local video */}
                {video && (
                  <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black">
                    <video
                      ref={localVideoref}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <div className="text-sm font-medium text-white truncate">
                        {username} (You){" "}
                        {!audio && (
                          <MicOff
                            className="text-red-500 ml-1"
                            style={{ fontSize: "1rem" }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Remote participants */}
                {videos.map((videoItem) => {
                  const participant = participants.find(
                    (p) => p.id === videoItem.socketId
                  );
                  const isActiveSpeaker = activeSpeaker === videoItem.socketId;

                  return (
                    <div
                      key={videoItem.socketId}
                      className={`relative rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black ${
                        isActiveSpeaker ? "ring-4 ring-red-500" : ""
                      }`}
                    >
                      <video
                        ref={(ref) => {
                          if (ref && videoItem.stream) {
                            ref.srcObject = videoItem.stream;
                          }
                        }}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <div className="flex items-center">
                          <Avatar className="w-8 h-8 mr-2">
                            {participant?.name?.charAt(0).toUpperCase() || "U"}
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">
                              {participant?.name || "User"}
                            </div>
                            {isActiveSpeaker && (
                              <div className="text-xs text-red-400 flex items-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                                Speaking
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/80 backdrop-blur-sm rounded-full p-2 flex items-center space-x-2 shadow-xl border border-gray-800">
            <Tooltip title={video ? "Turn off camera" : "Turn on camera"}>
              <IconButton
                onClick={handleVideo}
                className={`${video ? "text-white" : "text-red-500"}`}
              >
                {video ? <Videocam /> : <VideocamOff />}
              </IconButton>
            </Tooltip>

            <Tooltip title={audio ? "Mute microphone" : "Unmute microphone"}>
              <IconButton
                onClick={handleAudio}
                className={`${audio ? "text-white" : "text-red-500"}`}
              >
                {audio ? <Mic /> : <MicOff />}
              </IconButton>
            </Tooltip>

            {screenAvailable && (
              <Tooltip title={screen ? "Stop sharing" : "Share screen"}>
                <IconButton
                  onClick={handleScreen}
                  className={`${screen ? "text-red-500" : "text-white"}`}
                >
                  {screen ? <StopScreenShare /> : <ScreenShare />}
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Participants">
              <IconButton
                onClick={() => {
                  setShowParticipants(!showParticipants);
                  setShowChat(false);
                }}
                className={`text-white ${
                  showParticipants ? "bg-red-600/30" : ""
                }`}
              >
                <Badge badgeContent={participants.length} color="error">
                  <People />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Chat">
              <IconButton
                onClick={() => {
                  setShowChat(!showChat);
                  setShowParticipants(false);
                  setNewMessages(0);
                }}
                className={`text-white ${showChat ? "bg-red-600/30" : ""}`}
              >
                <Badge badgeContent={newMessages} color="error">
                  <Chat />
                </Badge>
              </IconButton>
            </Tooltip>

            <div className="w-px h-8 bg-gray-700 mx-1"></div>

            <Tooltip title="End call">
              <IconButton
                onClick={handleEndCall}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <CallEnd />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
