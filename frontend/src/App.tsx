import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/Home'
import Account from './pages/Account'
import Signup from './pages/Signup'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
