import './App.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header/Header';
import HeaderLibrary from './components/HeaderLibrary/HeaderLibrary';
import Footer from './components/Layout/Footer/Footer';
import LoginModal from './components/Layout/LoginModal/LoginModal';
import MainPage from './pages/MainPage/MainPage';
import SongLibrary from './pages/SongLibrary/SongLibrary';
import Cabinet from './pages/Cabinet/Cabinet';
import Generator from './pages/Generator/Generator';
import Presentation from './pages/Presentation/Presentation';
import Gameplay from './pages/Gameplay/Gameplay';

import { MusicProvider } from './context/MusicContext';
import MusicPlayer from './components/MusicPlayer/MusicPlayer';

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const openLogin = () => {
    setIsRegisterMode(false);
    setIsLoginModalOpen(true);
  };

  const openRegister = () => {
    setIsRegisterMode(true);
    setIsLoginModalOpen(true);
  };

  return (
    <MusicProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <>
              {isLoggedIn ? (
                <HeaderLibrary />
              ) : (
                <Header onLoginClick={openLogin} onRegisterClick={openRegister} />
              )}
              <MainPage onLoginClick={openLogin} />
              <Footer />
            </>
          } />
          <Route path="/library" element={<SongLibrary />} />
          <Route path="/cabinet" element={<Cabinet />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/presentation" element={<Presentation />} />
          <Route path="/gameplay" element={<Gameplay />} />
        </Routes>
        
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
          initialRegisterMode={isRegisterMode}
        />
        <MusicPlayer />
      </Router>
    </MusicProvider>
  );
}

export default App;
