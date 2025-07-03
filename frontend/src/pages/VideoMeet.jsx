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
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  FiberManualRecord,
} from "@mui/icons-material";
import server from "../environment";
import { useAuth } from "../contexts/AuthContext";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const server_url = server;
const peerConfigConnections = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function VideoMeetComponent() {
  const navigate = useNavigate();
  const { userData, addToUserHistory, token } = useAuth();
  const connectionsRef = useRef({});
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoref = useRef();
  const videoRef = useRef([]);
  const chatContainerRef = useRef();
  const participantsContainerRef = useRef();
  const meetingContainerRef = useRef();
  const reconnectAttemptsRef = useRef(0);
  const recordingIntervalRef = useRef(null);

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
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
  const [meetingCode, setMeetingCode] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [meetingTime, setMeetingTime] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [participants, setParticipants] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [loading, setLoading] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  // Extract meeting code from URL
  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    let code = pathParts[pathParts.length - 1];

    if (!code || code.length < 3) {
      code = generateRandomCode();
      navigate(`/meet/${code}`, { replace: true });
    }

    setMeetingCode(code);
    setShowJoinDialog(true);
  }, [navigate]);

  // Timer effects
  useEffect(() => {
    let timer;
    if (connectionStatus === "connected") {
      timer = setInterval(() => {
        setMeetingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [connectionStatus]);

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingIntervalRef.current);
    }

    return () => {
      clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  const formatMeetingTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours > 0 ? hours + ":" : ""}${
      minutes < 10 ? "0" + minutes : minutes
    }:${secs < 10 ? "0" + secs : secs}`;
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setRecordingTime(0);
      showSnackbar("Recording started", "success");
    } else {
      showSnackbar(
        `Recording stopped - Duration: ${formatMeetingTime(recordingTime)}`,
        "info"
      );
    }
  };

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

  const showSnackbar = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleJoinMeeting = () => {
    setShowJoinDialog(false);
    if (!username.trim()) {
      showSnackbar("Please enter your name", "error");
      return;
    }
    setAskForUsername(false);
    getPermissions().then(() => {
      connectToSocketServer();
      getUserMedia();
    });
  };

  const getPermissions = async () => {
    try {
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
        showSnackbar(
          "Camera access was denied. You can enable it later in browser settings.",
          "warning"
        );
      }

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
        showSnackbar(
          "Microphone access was denied. You can enable it later in browser settings.",
          "warning"
        );
      }

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
    } catch (err) {
      console.error("Permissions error:", err);
      showSnackbar("Error checking media permissions", "error");
    }
  };

  const getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    Object.keys(connectionsRef.current).forEach((id) => {
      if (id === socketIdRef.current) return;

      try {
        const senders = connectionsRef.current[id].getSenders();
        senders.forEach((sender) =>
          connectionsRef.current[id].removeTrack(sender)
        );

        stream.getTracks().forEach((track) => {
          connectionsRef.current[id].addTrack(track, stream);
        });

        connectionsRef.current[id]
          .createOffer()
          .then((offer) =>
            connectionsRef.current[id].setLocalDescription(offer)
          )
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({
                sdp: connectionsRef.current[id].localDescription,
              })
            );
          })
          .catch((e) => console.log(e));
      } catch (e) {
        console.log(e);
      }
    });

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        if (track.kind === "video") setVideo(false);
        if (track.kind === "audio") setAudio(false);
      };
    });
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({
          video: video && videoAvailable,
          audio: audio && audioAvailable,
        })
        .then(getUserMediaSuccess)
        .catch((err) => {
          console.error("Error getting user media:", err);
          showSnackbar("Error accessing media devices", "error");
        });
    } else {
      try {
        if (localVideoref.current && localVideoref.current.srcObject) {
          const tracks = localVideoref.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
        }
      } catch (e) {
        console.log(e);
      }
    }
  };

  const getDisplayMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    Object.keys(connectionsRef.current).forEach((id) => {
      if (id === socketIdRef.current) return;

      try {
        const senders = connectionsRef.current[id].getSenders();
        senders.forEach((sender) =>
          connectionsRef.current[id].removeTrack(sender)
        );

        stream.getTracks().forEach((track) => {
          connectionsRef.current[id].addTrack(track, stream);
        });

        connectionsRef.current[id]
          .createOffer()
          .then((offer) =>
            connectionsRef.current[id].setLocalDescription(offer)
          )
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({
                sdp: connectionsRef.current[id].localDescription,
              })
            );
          })
          .catch((e) => console.log(e));
      } catch (e) {
        console.log(e);
      }
    });

    stream.getVideoTracks()[0].onended = () => {
      setScreen(false);
      if (videoAvailable) {
        getUserMedia();
      }
    };
  };

  const getDisplayMedia = () => {
    if (screen) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: audio && audioAvailable })
        .then(getDisplayMediaSuccess)
        .catch((err) => {
          console.error("Screen sharing error:", err);
          setScreen(false);
          if (err.name !== "NotAllowedError") {
            showSnackbar("Failed to share screen. Please try again.", "error");
          }
          if (videoAvailable) {
            getUserMedia();
          }
        });
    }
  };

  const handleReconnect = () => {
    if (reconnectAttemptsRef.current < 5) {
      reconnectAttemptsRef.current += 1;
      const delay = Math.min(1000 * reconnectAttemptsRef.current, 5000);

      showSnackbar(
        `Attempting to reconnect (${reconnectAttemptsRef.current}/5)`,
        "info"
      );

      setTimeout(() => {
        connectToSocketServer();
      }, delay);
    } else {
      showSnackbar(
        "Failed to reconnect after multiple attempts. Please refresh the page.",
        "error"
      );
      setReconnecting(false);
      setConnectionStatus("disconnected");
    }
  };

  const connectToSocketServer = () => {
    if (!meetingCode) return;

    setLoading(true);
    setConnectionStatus("connecting");

    socketRef.current = io.connect(server_url, {
      secure: false,
      query: {
        room: meetingCode,
        username: username,
        token: token,
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: {
        token: token,
      },
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setConnectionStatus("disconnected");
      setLoading(false);
      setReconnecting(true);
      handleReconnect();
    });

    socketRef.current.on("reconnect_failed", () => {
      setConnectionStatus("disconnected");
      setLoading(false);
      setReconnecting(false);
      showSnackbar(
        "Failed to reconnect to server. Please refresh the page.",
        "error"
      );
    });

    socketRef.current.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setConnectionStatus("connected");
      setLoading(false);
      setReconnecting(false);
      reconnectAttemptsRef.current = 0;
      showSnackbar("Reconnected to the meeting", "success");

      if (meetingCode) {
        socketRef.current.emit("join-call", meetingCode);
      }
    });

    socketRef.current.on("connect", () => {
      setConnectionStatus("connected");
      setLoading(false);
      reconnectAttemptsRef.current = 0;
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", meetingCode);
    });

    socketRef.current.on("room-joined", (room) => {
      showSnackbar(`Joined meeting room: ${room}`, "success");
    });

    socketRef.current.on("join-error", (error) => {
      setConnectionStatus("disconnected");
      setLoading(false);
      showSnackbar(`Error joining room: ${error}`, "error");
    });

    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("chat-message", addMessage);

    socketRef.current.on("user-left", (id) => {
      if (connectionsRef.current[id]) {
        connectionsRef.current[id].close();
        delete connectionsRef.current[id];
      }
      setVideos((prev) => prev.filter((v) => v.socketId !== id));
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      showSnackbar(
        `${
          participants.find((p) => p.id === id)?.name || "A participant"
        } left the meeting`,
        "info"
      );
    });

    socketRef.current.on("user-joined", (id, clients) => {
      setParticipants((prev) => {
        const existingParticipants = new Map(prev.map((p) => [p.id, p]));
        const merged = clients.map((client) => {
          return (
            existingParticipants.get(client) || {
              id: client,
              name: client === socketIdRef.current ? username : "Loading...",
            }
          );
        });
        return merged;
      });

      if (id !== socketIdRef.current) {
        showSnackbar(`New participant joined`, "info");
      }

      clients.forEach((socketListId) => {
        if (
          !connectionsRef.current[socketListId] &&
          socketListId !== socketIdRef.current
        ) {
          const peerConnection = new RTCPeerConnection(peerConfigConnections);
          connectionsRef.current[socketListId] = peerConnection;

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
            setVideos((prevVideos) => {
              const videoExists = prevVideos.some(
                (video) => video.socketId === socketListId
              );
              if (videoExists) {
                return prevVideos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.streams[0] }
                    : video
                );
              } else {
                return [
                  ...prevVideos,
                  {
                    socketId: socketListId,
                    stream: event.streams[0],
                    autoplay: true,
                    playsinline: true,
                  },
                ];
              }
            });
          };

          peerConnection.oniceconnectionstatechange = () => {
            if (
              peerConnection.iceConnectionState === "disconnected" ||
              peerConnection.iceConnectionState === "failed"
            ) {
              if (connectionsRef.current[socketListId]) {
                connectionsRef.current[socketListId].close();
                delete connectionsRef.current[socketListId];
              }
              setVideos((prev) =>
                prev.filter((v) => v.socketId !== socketListId)
              );
              setParticipants((prev) =>
                prev.filter((p) => p.id !== socketListId)
              );
            }
          };

          if (window.localStream) {
            window.localStream.getTracks().forEach((track) => {
              peerConnection.addTrack(track, window.localStream);
            });
          }

          if (socketListId > socketIdRef.current) {
            peerConnection
              .createOffer()
              .then((offer) => peerConnection.setLocalDescription(offer))
              .then(() => {
                socketRef.current.emit(
                  "signal",
                  socketListId,
                  JSON.stringify({ sdp: peerConnection.localDescription })
                );
              })
              .catch((err) => {
                console.error("Error creating offer:", err);
                showSnackbar("Error establishing connection", "error");
              });
          }
        }
      });
    });
  };

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);
    if (fromId === socketIdRef.current) return;

    if (!connectionsRef.current[fromId]) {
      const peerConnection = new RTCPeerConnection(peerConfigConnections);
      connectionsRef.current[fromId] = peerConnection;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit(
            "signal",
            fromId,
            JSON.stringify({ ice: event.candidate })
          );
        }
      };

      peerConnection.ontrack = (event) => {
        setVideos((prevVideos) => {
          const videoExists = prevVideos.some(
            (video) => video.socketId === fromId
          );
          if (videoExists) {
            return prevVideos.map((video) =>
              video.socketId === fromId
                ? { ...video, stream: event.streams[0] }
                : video
            );
          } else {
            return [
              ...prevVideos,
              {
                socketId: fromId,
                stream: event.streams[0],
                autoplay: true,
                playsinline: true,
              },
            ];
          }
        });
      };

      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, window.localStream);
        });
      }
    }

    const peerConnection = connectionsRef.current[fromId];

    if (signal.sdp) {
      peerConnection
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          if (signal.sdp.type === "offer") {
            return peerConnection
              .createAnswer()
              .then((answer) => peerConnection.setLocalDescription(answer))
              .then(() => {
                socketRef.current.emit(
                  "signal",
                  fromId,
                  JSON.stringify({ sdp: peerConnection.localDescription })
                );
              });
          }
        })
        .catch((err) => {
          console.error("Error handling SDP:", err);
          showSnackbar("Error establishing connection", "error");
        });
    }

    if (signal.ice) {
      peerConnection
        .addIceCandidate(new RTCIceCandidate(signal.ice))
        .catch((err) => {
          console.error("Error adding ICE candidate:", err);
          showSnackbar("Connection issue detected", "warning");
        });
    }
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

  const handleVideo = () => {
    setVideo((prev) => {
      const newValue = !prev;
      if (newValue && !videoAvailable) {
        showSnackbar(
          "Camera permissions denied. Please enable camera access in your browser settings.",
          "error"
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
        showSnackbar(
          "Microphone permissions denied. Please enable microphone access in your browser settings.",
          "error"
        );
        return false;
      }
      return newValue;
    });
  };

  const handleScreen = () => setScreen((prev) => !prev);

  const handleEndCall = async () => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }

      Object.keys(connectionsRef.current).forEach((id) => {
        if (connectionsRef.current[id]) {
          connectionsRef.current[id].close();
          delete connectionsRef.current[id];
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
          showSnackbar("Failed to save meeting history", "error");
        }
      }

      navigate("/home");
    } catch (err) {
      console.error("Error ending call:", err);
      showSnackbar("Error ending call", "error");
      navigate("/home");
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleCopyMeetingCode = () => {
    navigator.clipboard.writeText(meetingCode);
    showSnackbar("Meeting code copied to clipboard", "success");
  };

  useEffect(() => {
    if (userData) {
      setUsername(userData.name);
      setAskForUsername(false);
    }
  }, [userData]);

  useEffect(() => {
    return () => {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }

      Object.keys(connectionsRef.current).forEach((id) => {
        if (connectionsRef.current[id]) {
          connectionsRef.current[id].close();
          delete connectionsRef.current[id];
        }
      });

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className="flex flex-col w-full h-screen bg-black text-white relative"
      ref={meetingContainerRef}
    >
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

      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500 rounded-full filter blur-3xl opacity-5 -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500 rounded-full filter blur-3xl opacity-5 -z-10"></div>

      <Dialog
        open={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="bg-gray-900 text-white">
          Join Meeting
        </DialogTitle>
        <DialogContent className="bg-gray-900 text-white">
          <div className="flex flex-col items-center py-6">
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
              </div>
            </div>

            <TextField
              fullWidth
              label="Your Name"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                className: "text-white",
              }}
              InputLabelProps={{
                className: "text-gray-400",
              }}
              className="mb-4"
            />

            <div className="flex gap-2 mb-4">
              <Tooltip title={video ? "Turn off camera" : "Turn on camera"}>
                <Button
                  onClick={() => setVideo(!video)}
                  variant={video ? "contained" : "outlined"}
                  color={video ? "primary" : "inherit"}
                  startIcon={video ? <Videocam /> : <VideocamOff />}
                >
                  {video ? "Camera On" : "Camera Off"}
                </Button>
              </Tooltip>

              <Tooltip title={audio ? "Mute microphone" : "Unmute microphone"}>
                <Button
                  onClick={() => setAudio(!audio)}
                  variant={audio ? "contained" : "outlined"}
                  color={audio ? "primary" : "inherit"}
                  startIcon={audio ? <Mic /> : <MicOff />}
                >
                  {audio ? "Mic On" : "Mic Off"}
                </Button>
              </Tooltip>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 text-center w-full">
              <p className="text-sm text-gray-400">Meeting Code</p>
              <p className="font-mono text-lg">{meetingCode}</p>
            </div>
          </div>
        </DialogContent>
        <DialogActions className="bg-gray-900">
          <Button onClick={() => navigate("/home")} color="error">
            Cancel
          </Button>
          <Button
            onClick={handleJoinMeeting}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Join Meeting"}
          </Button>
        </DialogActions>
      </Dialog>

      {(loading || reconnecting) && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="text-center">
            <CircularProgress size={60} />
            <p className="mt-4 text-xl">
              {reconnecting ? "Reconnecting..." : "Connecting to meeting..."}
            </p>
            <p className="text-gray-400">Room: {meetingCode}</p>
            {reconnecting && (
              <p className="text-gray-400 mt-2">
                Attempt {reconnectAttemptsRef.current} of 5
              </p>
            )}
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            connectionStatus === "connected"
              ? "bg-green-500"
              : connectionStatus === "connecting"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        ></div>
        <span className="text-sm">
          {connectionStatus === "connected"
            ? "Connected"
            : connectionStatus === "connecting"
            ? reconnecting
              ? "Reconnecting..."
              : "Connecting..."
            : "Disconnected"}
        </span>
      </div>

      {!showJoinDialog && (
        <div className="flex flex-1 relative h-full overflow-hidden">
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
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800/50"
                  >
                    <Avatar className="bg-gray-700">
                      {participant.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">
                        {participant.name}{" "}
                        {participant.id === socketIdRef.current && "(You)"}
                      </div>
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

          <div className="flex-1 relative bg-black">
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
                onClick={handleCopyMeetingCode}
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

            {(video || videos.length > 0) && (
              <div
                className={`
                  absolute inset-0 p-4 gap-4 overflow-auto grid
                  ${videos.length + (video ? 1 : 0) === 1 ? "grid-cols-1" : ""}
                  ${
                    videos.length + (video ? 1 : 0) === 2
                      ? "sm:grid-cols-2"
                      : ""
                  }
                  ${
                    videos.length + (video ? 1 : 0) > 2
                      ? "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                      : ""
                  }
                  auto-rows-[minmax(150px,1fr)]
                `}
              >
                {video ? (
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
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black">
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <Avatar className="w-20 h-20 text-3xl">
                        {username?.charAt(0).toUpperCase() || "Y"}
                      </Avatar>
                    </div>
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

                {videos.map((videoItem) => {
                  const participant = participants.find(
                    (p) => p.id === videoItem.socketId
                  );
                  const hasVideo = videoItem.stream
                    .getVideoTracks()
                    .some((track) => track.readyState === "live");

                  return (
                    <div
                      key={videoItem.socketId}
                      className="relative rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black"
                    >
                      {hasVideo ? (
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
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                          <Avatar className="w-20 h-20 text-3xl">
                            {participant?.name?.charAt(0).toUpperCase() || "U"}
                          </Avatar>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <div className="flex items-center">
                          <Avatar className="w-8 h-8 mr-2">
                            {participant?.name?.charAt(0).toUpperCase() || "U"}
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">
                              {participant?.name || "User"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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

            <Tooltip title={isRecording ? "Stop recording" : "Start recording"}>
              <IconButton
                onClick={toggleRecording}
                className={`${
                  isRecording ? "text-red-500 animate-pulse" : "text-white"
                }`}
              >
                <FiberManualRecord />
              </IconButton>
            </Tooltip>

            {isRecording && (
              <div className="text-sm text-white px-2">
                {formatMeetingTime(recordingTime)}
              </div>
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
