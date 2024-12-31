import React from "react";
import { Routes, Route } from "react-router-dom";
// import HomePage from "./pages/HomePage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import EditorPage from "./pages/EditorPage.tsx";

const App: React.FC = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
};

export default App;