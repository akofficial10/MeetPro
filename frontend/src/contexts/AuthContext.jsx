import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { useEffect } from "react";

export const AuthContext = createContext();

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(() => {
    const storedData = localStorage.getItem("authData");
    return storedData ? JSON.parse(storedData) : null;
  });
  const [authError, setAuthError] = useState("");

  const handleGoogleLogin = async () => {
    try {
      setAuthError("");
      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;
      const idToken = await user.getIdToken(true); // Force refresh token

      const res = await client.post("/google-auth", { idToken });

      if (res.status === httpStatus.OK) {
        const authData = {
          token: res.data.token,
          user: res.data.user,
        };

        localStorage.setItem("authData", JSON.stringify(authData));
        localStorage.setItem("token", res.data.token);

        setUserData(res.data.user);
        navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      setAuthError(err.message || "Google Sign-In failed");
      throw err;
    }
  };

  // Add this to your AuthContext
  const verifyToken = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const res = await client.get("/verify-token", {
        params: { token },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.valid && res.data.user) {
        setUserData(res.data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Token verification failed:", err);
      return false;
    }
  };

  // Update your AuthProvider component
  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await verifyToken();
      if (!isValid) {
        logout();
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authData");
    setUserData(null);
    navigate("/");
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
