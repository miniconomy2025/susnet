import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home.tsx';
import Account from './pages/Account.tsx';
import Signup from './pages/Signup.tsx';
import Login from './pages/Login.tsx';
import HeaderComponent from './components/HeaderComponent/HeaderComponent.tsx';
import NavComponent from './components/NavComponent/NavComponent.tsx';
import Explore from './pages/Explore.tsx';
import Subreddit from './pages/Subreddit.tsx';
import { useAuth } from './hooks/UseAuth.ts';
import { useUserSubs } from './hooks/UseUserSubs.ts';

function App() {
	const [menuOpen, setMenuOpen] = useState(false);
	const { currentUser, loading: authLoading } = useAuth();
	const { userSubs, loading: subsLoading, refreshSubs } = useUserSubs(currentUser?.name || "");
	
	console.log('App state:', { currentUser: currentUser?.name, userSubs: userSubs.length, subsLoading, authLoading });
	

	return (
		<Router>
			<div className="appContainer">
				<HeaderComponent menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
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
							<Route path="/subreddit/:id" element={<Subreddit />} />
						</Routes>
					</main>
				</div>
			</div>
		</Router>
	);
}

export default App;
