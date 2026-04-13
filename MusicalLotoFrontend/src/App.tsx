import './App.css';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header/Header';
import Footer from './components/Layout/Footer/Footer';
import LoginModal from './components/Layout/LoginModal/LoginModal';
import MainPage from './pages/MainPage/MainPage';

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <Router>
      <Header onLoginClick={() => setIsLoginModalOpen(true)} />
      <Routes>
        <Route path="/" element={<MainPage />} />
      </Routes>
      <Footer />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </Router>
  );
}

export default App;
