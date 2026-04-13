import React from 'react';
import './CallToAction.css';

import icon from '../../../../assets/MainPage/Значок.svg';

const CallToAction: React.FC = () => {
  return (
    <section className="ctaSection">
      <div className="ctaContainer">
        <img src={icon} alt="Icon" className="ctaIcon" />
        <h2 className="ctaTitle">Готовы начать?</h2>
        <p className="ctaSubtitle">Создайте первую игру за 2 минуты. Бесплатно.</p>
        <button className="ctaButton">
          Начать бесплатно
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className="ctaArrow">
            <path d="M4 8.5H13" stroke="currentColor" strokeWidth="2.0625" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.5 5L13 8.5L9.5 12" stroke="currentColor" strokeWidth="2.0625" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </section>
  );
};

export default CallToAction;
