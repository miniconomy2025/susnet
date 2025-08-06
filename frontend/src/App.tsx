import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Account from './pages/Account';
import Signup from './pages/Signup';
import Login from './pages/Login';
import HeaderComponent from './Components/HeaderComponent/HeaderComponent';
import NavComponent from './components/NavComponent/NavComponent';
import Explore from './pages/Explore';
import Subreddit from './pages/Subreddit';

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
							<Route path="/" element={<Signup />} />
							<Route path="/login" element={<Login />} />
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
