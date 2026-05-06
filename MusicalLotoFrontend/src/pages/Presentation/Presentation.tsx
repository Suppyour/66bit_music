import React, { useState } from 'react';
import HeaderLibrary from '../../components/HeaderLibrary/HeaderLibrary';
import './Presentation.css';


import PlayIcon from '../../assets/Presentation/Иконка в кнопке запустить.svg';
import PreviewIcon from '../../assets/Presentation/Иконка в кнопке предпросмотр.svg';



const Presentation: React.FC = () => {
    
    const [gameName] = useState('Корпоратив 2026');



    return (
        <div className="presentation-page">
            <HeaderLibrary />

            <main className="container presentation-main">
                <div className="presentation-content">

                    {}
                    <div className="presentation-left">
                        <div className="presentation-header">
                            <h1 className="game-title">{gameName}</h1>
                            <div className="presentation-actions">
                                <button className="btn-add-slide">
                                    <span className="plus-icon">+</span>
                                    Добавить слайд
                                </button>
                                <button className="btn-preview-scenario">
                                    <img src={PreviewIcon} alt="Preview" />
                                    Предпросмотр
                                </button>
                                <button className="btn-play-scenario">
                                    <img src={PlayIcon} alt="Play" />
                                    Запустить
                                </button>
                            </div>
                        </div>

                        <div className="slides-container">
                            <div className="slides-header">
                                <h2 className="slides-title">Слайды презентации</h2>
                                <span className="drag-hint">Перетаскивайте для изменения порядка</span>
                            </div>
                            <div className="slides-list">
                                {[...Array(6)].map((_, index) => (
                                    <div key={index} className="slide-item">
                                        <div className="slide-drag-handle">
                                            <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="4" cy="4" r="2" fill="#D1D5DB" />
                                                <circle cx="4" cy="12" r="2" fill="#D1D5DB" />
                                                <circle cx="4" cy="20" r="2" fill="#D1D5DB" />
                                                <circle cx="12" cy="4" r="2" fill="#D1D5DB" />
                                                <circle cx="12" cy="12" r="2" fill="#D1D5DB" />
                                                <circle cx="12" cy="20" r="2" fill="#D1D5DB" />
                                            </svg>
                                        </div>

                                        <div className="slide-icon-box empty">
                                            {}
                                        </div>

                                        <div className="slide-texts">
                                            <div className="slide-header-text">
                                                <span className="slide-number">Слайд {index + 1}</span>
                                            </div>
                                            <div className="slide-main-title">Пустой слайд</div>
                                            <div className="slide-subtitle">Нажмите на иконку редактирования, чтобы добавить контент</div>
                                        </div>

                                        <button className="btn-edit-slide">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>


                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Presentation;
