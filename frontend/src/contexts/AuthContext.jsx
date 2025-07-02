import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

export const AuthContext = createContext();

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [authError, setAuthError] = useState(""); // Added error state

  /** GOOGLE SIGN-IN */
  const handleGoogleLogin = async () => {
    try {
      setAuthError(""); // Clear any previous errors
      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;
      const idToken = await user.getIdToken();

      // Send to backend
      const res = await client.post("/google-auth", { idToken });

      if (res.status === httpStatus.OK) {
        localStorage.setItem("token", res.data.token);
        setUserData(res.data.user || null);
        navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      setAuthError(err.message || "Google Sign-In failed");
      throw err; // Re-throw for component to handle
    }
  };

  /** REGISTER */
  const handleRegister = async (name, username, password) => {
    try {
      const res = await client.post("/register", {
        name,
        username,
        password,
      });

      if (res.status === httpStatus.CREATED) {
        await handleLogin(username, password);
        return res.data.message;
      }
    } catch (err) {
      throw err.response?.data?.message || "Registration failed";
    }
  };

  /** LOGIN */
  const handleLogin = async (username, password) => {
    try {
      const res = await client.post("/login", { username, password });

      if (res.status === httpStatus.OK) {
        localStorage.setItem("token", res.data.token);
        setUserData(res.data.user || null);
        navigate("/home", { replace: true });
        return true;
      }
    } catch (err) {
      throw err.response?.data?.message || "Login failed";
    }
  };

  /** ADD TO HISTORY */
  const addToUserHistory = async (meetingCode) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !meetingCode)
        throw new Error("Missing token or meeting code");

      const res = await client.post("/add_to_activity", {
        token,
        meeting_code: meetingCode,
      });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || "Failed to add meeting to history";
    }
  };

  /** GET HISTORY */
  const getHistoryOfUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Missing token");

      const res = await client.get("/get_all_activity", {
        params: { token },
      });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || "Failed to fetch history";
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUserData(null);
    navigate("/"); 
  };

  /** CONTEXT VALUE */
  const value = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    handleGoogleLogin,
    logout,
    addToUserHistory,
    getHistoryOfUser,
    authError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
