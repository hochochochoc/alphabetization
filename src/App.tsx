import "./index.css";
import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landingPage/LandingPage";
import TestPage from "./pages/testPage/TestPage";
import ProfilePage from "./pages/profilePage/ProfilePage";
import MenuPage from "./pages/menuPage/MenuPage";
import ResultsPage from "./pages/resultsPage/ResultsPage";
import WritingTestPage from "./pages/writingTestPage.tsx/writingTest";
import WritingInputPage from "./pages/writingInputPage/writingInputPage";
import WritingModelPage from "./pages/writingInputPage/writingModelPage";
import ReadingTestPage from "./pages/readingTestPage/ReadingTest";

// import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    // <AuthProvider>
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/" element={<MenuPage />} />
      <Route path="/history" element={<ResultsPage />} />
      <Route path="/writing" element={<WritingTestPage />} />
      <Route path="/writinginput" element={<WritingInputPage />} />
      <Route path="/writingmodel" element={<WritingModelPage />} />
      <Route path="/reading" element={<ReadingTestPage />} />
    </Routes>
    // </AuthProvider>
  );
}

export default App;
