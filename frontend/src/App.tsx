import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Account from './pages/Account';
import Signup from './pages/Signup';

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Signup />} />
				<Route path="/home" element={<Home />} />
				<Route path="/account" element={<Account />} />
			</Routes>
		</Router>
	);
}

export default App;
