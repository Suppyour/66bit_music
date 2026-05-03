import './App.css';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header/Header';
import Footer from './components/Layout/Footer/Footer';
import LoginModal from './components/Layout/LoginModal/LoginModal';
import MainPage from './pages/MainPage/MainPage';
import SongLibrary from './pages/SongLibrary/SongLibrary';
import Cabinet from './pages/Cabinet/Cabinet';
import Generator from './pages/Generator/Generator';
import Presentation from './pages/Presentation/Presentation';

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <>
            <Header onLoginClick={() => setIsLoginModalOpen(true)} />
            <MainPage />
            <Footer />
          </>
        } />
        <Route path="/library" element={<SongLibrary />} />
        {/* Placeholder routes for others links in HeaderLibrary */}
        <Route path="/cabinet" element={<Cabinet />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/presentation" element={<Presentation />} />
      </Routes>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </Router>
  );
}

export default App;
