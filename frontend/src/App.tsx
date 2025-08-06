import "./App.css";
import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home.tsx";
import Account from "./pages/Account";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import HeaderComponent from "./Components/HeaderComponent/HeaderComponent";
import NavComponent from "./components/NavComponent/NavComponent";
import Explore from "./pages/Explore";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Router>
      <div className="appContainer">
        <HeaderComponent menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <div className="mainContainer">
          <NavComponent menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          <main className="contentContainer">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/account" element={<Account />} />
              <Route path="/explore" element={<Explore />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
