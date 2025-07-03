import httpStatus from "http-status";
import { db } from "../firebase.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { admin } from "../firebase.js";

// ================ Register
export const register = async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ message: "Please provide all fields" });
  }

  try {
    // Check if user exists
    const userSnap = await db.collection("users").doc(username).get();
    if (userSnap.exists) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to Firestore
    await db.collection("users").doc(username).set({
      name,
      username,
      password: hashedPassword,
      token: "",
    });

    return res.status(httpStatus.CREATED).json({ message: "User registered" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: `Something went wrong: ${e}` });
  }
};

// ================ Login
export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please provide all fields" });
  }

  try {
    const userRef = db.collection("users").doc(username);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const userData = userSnap.data();
    const isPasswordCorrect = await bcrypt.compare(password, userData.password);

    if (isPasswordCorrect) {
      const token = crypto.randomBytes(20).toString("hex");

      await userRef.update({ token });

      return res.status(httpStatus.OK).json({
        token,
        user: {
          username: userData.username,
          name: userData.name,
        },
      });
    } else {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid username or password" });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: `Something went wrong: ${e}` });
  }
};

// ================ Google Auth
export const googleAuth = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "ID token is required" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (decodedToken.aud !== "meet-pro-d9458") {
      throw new Error("Invalid audience claim");
    }

    const { uid, email, name, picture } = decodedToken;
    const username = email.split("@")[0];

    const userRef = db.collection("users").doc(username);
    const userSnap = await userRef.get();

    let token;
    if (!userSnap.exists) {
      // Create new user with persistent token
      token = crypto.randomBytes(20).toString("hex");
      await userRef.set({
        uid,
        name: name || username,
        username,
        email,
        photoURL: picture || "",
        token,
        authProvider: "google",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Use existing token if it's still valid (not expired)
      const userData = userSnap.data();
      const tokenAge =
        Date.now() - (userData.lastLogin?.toDate()?.getTime() || 0);
      const tokenMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      token =
        userData.token && tokenAge < tokenMaxAge
          ? userData.token
          : crypto.randomBytes(20).toString("hex");

      await userRef.update({
        token,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(httpStatus.OK).json({
      token,
      user: {
        username,
        name: name || username,
        photoURL: picture || "",
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({
      message: `Authentication failed: ${error.message}`,
    });
  }
};

// Add this to your userController.js
export const verifyToken = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  
  if (!token) {
    return res.status(httpStatus.UNAUTHORIZED).json({ 
      valid: false,
      message: "No token provided" 
    });
  }

  try {
    const usersQuery = await db.collection("users")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (usersQuery.empty) {
      return res.status(httpStatus.OK).json({ 
        valid: false,
        message: "Invalid token" 
      });
    }

    // Get user data without sensitive information
    const userData = usersQuery.docs[0].data();
    const { password, token: _, ...safeUserData } = userData;

    return res.status(httpStatus.OK).json({ 
      valid: true,
      user: safeUserData
    });
  } catch (e) {
    console.error("Token verification error:", e);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ 
      valid: false,
      message: `Token verification failed: ${e.message}` 
    });
  }
};

// ================ Add to Meeting History
export const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  if (!token || !meeting_code) {
    return res
      .status(400)
      .json({ message: "Please provide token and meeting code" });
  }

  try {
    // Find user by token
    const usersQuery = await db
      .collection("users")
      .where("token", "==", token)
      .get();

    if (usersQuery.empty) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const user = usersQuery.docs[0].data();

    // Add meeting to Firestore
    await db.collection("meetings").add({
      user_id: user.username,
      meetingCode: meeting_code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res
      .status(httpStatus.CREATED)
      .json({ message: "Added code to history" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: `Something went wrong: ${e}` });
  }
};

// ================ Get User Meeting History
export const getUserHistory = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Please provide token" });
  }

  try {
    // Find user by token
    const usersQuery = await db
      .collection("users")
      .where("token", "==", token)
      .get();

    if (usersQuery.empty) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const user = usersQuery.docs[0].data();

    // Get meetings
    const meetingsSnapshot = await db
      .collection("meetings")
      .where("user_id", "==", user.username)
      .orderBy("createdAt", "desc")
      .get();

    const meetings = meetingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(httpStatus.OK).json(meetings);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: `Something went wrong: ${e}` });
  }
};
