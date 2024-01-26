import {React, useState}  from 'react'
import { BrowserRouter as Router, Route, Routes} from 'react-router-dom'

import Home from './pages/Home/Home'
import Yoga from './pages/Yoga/Yoga'
import About from './pages/About/About'
import Tutorials from './pages/Tutorials/Tutorials'
import Pain from './pages/pain/Rootpain'
import Mainpain from "./pages/pain/Mainpain"
import Keypain from './pages/pain/Keypain'
import './App.css'
import {
  RecoilRoot
} from 'recoil';
import Choice from './pages/pain/choice'


export default function App() {


  return (
    <RecoilRoot>
       <Router>
      <Routes>
        <Route path='/' element={<Home />}/>
        <Route path='/start' element={<Yoga />} />
        <Route path='/pain' element={<Pain />}/>
        <Route path='/about' element={<About />} />
        <Route path='/keypain' element={<Keypain />} />
        <Route path='/mainpain' element={<Mainpain  />} />
        <Route path='/tutorials' element={<Tutorials />} />
        <Route path='/choice' element={<Choice />} />
      </Routes>
    </Router>
    </RecoilRoot>
   
  )
}


