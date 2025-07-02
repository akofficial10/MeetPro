import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing";
import Authentication from "./pages/Authentication";
import { AuthProvider } from "./contexts/AuthContext";
import VideoMeetComponent from "./pages/VideoMeet";
import HomeComponent from "./pages/Home";
import History from "./pages/History";

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path="/home" element={<HomeComponent />} />
            <Route path="/history" element={<History />} />
            <Route path="/:url" element={<VideoMeetComponent />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
