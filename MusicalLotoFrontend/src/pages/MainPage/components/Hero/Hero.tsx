import React from 'react';
import './Hero.css';

const Hero: React.FC = () => {
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
        <button className="btnPanel">
          Войти в панель управления
        </button>
      </div>
      <div className="heroBackground"></div>
    </section>
  );
};

export default Hero;
