import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

interface HeroProps {
  onLoginClick?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleActionClick = () => {
    if (isLoggedIn) {
      navigate('/cabinet');
    } else if (onLoginClick) {
      onLoginClick();
    }
  };

  return (
    <section className="heroSection">
      <div className="heroContent">
        <h1 className="heroTitle">
          Музыкальное <span className="highlight">Лото</span>
        </h1>
        <p className="heroSubtitle">
          Интерактивная музыкальная игра в формате бинго для<br />
          корпоративов, мероприятий, тимбилдинга и образования.<br />
          Создавайте сессии в реальном времени, загружайте треки,<br />
          синхронизируйте участников через QR-код.
        </p>
        <button className="btnPanel" onClick={handleActionClick}>
          {isLoggedIn ? 'Перейти в кабинет' : 'Войти в панель управления'}
        </button>
      </div>
      <div className="heroBackground"></div>
    </section>
  );
};

export default Hero;
