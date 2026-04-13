import React from 'react';
import './HowItWorks.css';


const steps = [
  {
    number: '01',
    title: 'Создайте игру',
    description: 'Укажите название и количество участников'
  },
  {
    number: '02',
    title: 'Добавьте песни',
    description: 'Загрузите библиотеку треков'
  },
  {
    number: '03',
    title: 'Генерируйте карточки',
    description: 'Уникальные 5×5 билеты для каждого'
  },
  {
    number: '04',
    title: 'Играйте!',
    description: 'Запустите презентацию и крутите барабан'
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section className="howItWorksSection">
      <div className="howItWorksHeader">
        <h2 className="howItWorksTitle">Как это работает?</h2>
        <p className="howItWorksSubtitle">Четыре шага до незабываемого мероприятия</p>
      </div>
      <div className="howItWorksSteps">
        {steps.map((step, index) => (
          <div className="howItWorksCard" key={index}>
            <div className="howItWorksCard-number">{step.number}</div>
            <h3 className="howItWorksCard-title">{step.title}</h3>
            <p className="howItWorksCard-desc">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
