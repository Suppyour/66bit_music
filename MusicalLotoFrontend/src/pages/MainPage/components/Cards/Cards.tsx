import React from 'react';
import './Cards.css';

import icon1 from '../../../../assets/MainPage/1-я карточка.svg';
import icon2 from '../../../../assets/MainPage/2-я карточка.svg';
import icon3 from '../../../../assets/MainPage/3-я карточка.svg';

import checkBlue from '../../../../assets/MainPage/Синяя галочка.svg';
import checkGreen from '../../../../assets/MainPage/Зеленая галочка.svg';
import checkYellow from '../../../../assets/MainPage/Желтая галочка.svg';

const cardsData = [
  {
    icon: icon1,
    title: 'Для организаторов мероприятий',
    subtitle: 'Автоматизация и профессиональный софт',
    checkIcon: checkBlue,
    items: [
      'Генерация карточек за секунды',
      'Встроенный лото-барабан',
      'Печать и экспорт карточек'
    ]
  },
  {
    icon: icon2,
    title: 'Для корпоративных клиентов',
    subtitle: 'Тимбилдинг и праздники',
    checkIcon: checkGreen,
    items: [
      'Корпоративный брендинг',
      'До 20 участников',
      'Статистика и аналитика'
    ]
  },
  {
    icon: icon3,
    title: 'Для частных ведущих',
    subtitle: 'Лёгкий старт и удобное управление',
    checkIcon: checkYellow,
    items: [
      'Быстрый старт без регистрации',
      'Мобильный интерфейс',
      'Простое управление'
    ]
  }
];

const Cards: React.FC = () => {
  return (
    <section className="cardsSection">
      <div className="cardsContainer">
        {cardsData.map((card, index) => (
          <div className="featureCard" key={index}>
            <div className="featureCard-header">
              <img src={card.icon} alt="icon" className="featureCard-icon" />
              <h3 className="featureCard-title">{card.title}</h3>
              <p className="featureCard-subtitle">{card.subtitle}</p>
            </div>
            <ul className="featureCard-list">
              {card.items.map((item, itemIdx) => (
                <li key={itemIdx} className="featureCard-listItem">
                  <img src={card.checkIcon} alt="check" className="featureCard-checkIcon" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Cards;
