import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/Home'
import Account from './pages/Account'
import Signup from './pages/Signup'
import Login from './pages/Login'
import HeaderComponent from './components/HeaderComponent/HeaderComponent'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <div className="page">
        <HeaderComponent />
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App;
