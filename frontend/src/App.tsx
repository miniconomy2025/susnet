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
							<Route path="/subreddit/:id" element={<Subreddit />} />
						</Routes>
					</main>
				</div>
			</div>
		</Router>
	);
}

export default App;
