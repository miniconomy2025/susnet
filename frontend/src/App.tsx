import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/Home'
import Account from './pages/Account'
import Signup from './pages/Signup'
import Login from './pages/Login'
import HeaderComponent from './Components/HeaderComponent/HeaderComponent'
import NavComponent from './components/NavComponent/NavComponent'
import Explore from './pages/Explore'

function App() {
  const [count, setCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <Router>
      <div className="mainContainer">
        <HeaderComponent menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <div className='page'>
          <NavComponent menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          <Routes>
            <Route path="/" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/account" element={<Account />} />
            <Route path="/explore" element={<Explore />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App;
