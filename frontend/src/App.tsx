import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home.tsx';
import Account from './pages/Account.tsx';
import Login from './pages/Login.tsx';
import HeaderComponent from './components/HeaderComponent/HeaderComponent.tsx';
import NavComponent from './components/NavComponent/NavComponent.tsx';
import Subreddit from './pages/Subreddit.tsx';
import UserProfile from './pages/UserProfile.tsx';
import { AuthProvider, useAuthContext } from './contexts/AuthContext.tsx';
import { AlertProvider } from './contexts/AlertContext.tsx';
import { useUserSubs } from './hooks/UseUserSubs.ts';

function AppWrapper() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, loading: authLoading } = useAuthContext(); // Change this line
    
  const { userSubs, loading: subsLoading, refreshSubs } = useUserSubs(currentUser?.name || "");

  useEffect(() => {
    if (currentUser && !authLoading) {
      refreshSubs();
    }
  }, [currentUser, authLoading]);

  const showSearch = location.pathname !== "/";

  return (
    <div className="appContainer">
      <HeaderComponent menuOpen={menuOpen} setMenuOpen={setMenuOpen} showSearch={showSearch} />
      <div className="mainContainer">
        <NavComponent 
          menuOpen={menuOpen} 
          setMenuOpen={setMenuOpen}
          userSubs={userSubs}
          subsLoading={subsLoading}
          authLoading={authLoading}
        />
        <main className="contentContainer">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<Home refreshSubs={refreshSubs} />} />
            <Route path="/account" element={<Account />} />
            <Route path="/subreddit/:id" element={<Subreddit refreshSubs={refreshSubs} />} />
            <Route path="/user/:username" element={<UserProfile refreshSubs={refreshSubs} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AlertProvider>
          <AppWrapper />
        </AlertProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
