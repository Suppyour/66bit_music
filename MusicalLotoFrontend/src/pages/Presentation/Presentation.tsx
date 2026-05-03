import React, { useState } from 'react';
import HeaderLibrary from '../../components/HeaderLibrary/HeaderLibrary';
import './Presentation.css';

// We will use standard SVG or text if icons are not exported properly, but let's try to use the provided ones for the buttons.
import PlayIcon from '../../assets/Presentation/Иконка в кнопке запустить.svg';
import PreviewIcon from '../../assets/Presentation/Иконка в кнопке предпросмотр.svg';

type SlideType = 'title' | 'rules' | 'song' | 'qr' | 'winner';

interface Slide {
    id: string;
    type: SlideType;
    title: string;
    subtitle: string;
    isRequired: boolean;
}

const Presentation: React.FC = () => {
    // In a real app, this would come from a global state or API based on the selected game
    const [gameName] = useState('Корпоратив 2026');

    const slides: Slide[] = [
        { id: '1', type: 'title', title: 'Титульный слайд', subtitle: `Название ${gameName}`, isRequired: true },
        { id: '2', type: 'rules', title: 'Правила игры', subtitle: `Название ${gameName}`, isRequired: true },
        { id: '3', type: 'song', title: 'Подмосковные вечера', subtitle: 'Владимир Трошин', isRequired: false },
        { id: '4', type: 'qr', title: 'QR-код для входа', subtitle: 'Ссылка: musloto/join', isRequired: true },
        { id: '5', type: 'song', title: 'Катюша', subtitle: 'Лидия Русланова', isRequired: false },
        { id: '6', type: 'winner', title: 'Слайд победителя', subtitle: 'Финал и поздравления', isRequired: false },
    ];

    return (
        <div className="presentation-page">
            <HeaderLibrary />
            
            <main className="container presentation-main">
                <div className="presentation-content">
                    
                    {/* Left Column */}
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
                                {slides.map((slide, index) => (
                                    <div key={slide.id} className="slide-item">
                                        <div className="slide-drag-handle">
                                            {/* 6 dots icon */}
                                            <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="4" cy="4" r="2" fill="#D1D5DB"/>
                                                <circle cx="4" cy="12" r="2" fill="#D1D5DB"/>
                                                <circle cx="4" cy="20" r="2" fill="#D1D5DB"/>
                                                <circle cx="12" cy="4" r="2" fill="#D1D5DB"/>
                                                <circle cx="12" cy="12" r="2" fill="#D1D5DB"/>
                                                <circle cx="12" cy="20" r="2" fill="#D1D5DB"/>
                                            </svg>
                                        </div>
                                        
                                        <div className={`slide-icon-box type-${slide.type}`}>
                                            {slide.type === 'title' && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                                            )}
                                            {slide.type === 'rules' && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                            )}
                                            {slide.type === 'song' && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                                            )}
                                            {slide.type === 'qr' && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                            )}
                                            {slide.type === 'winner' && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 21h8"></path><path d="M12 17v4"></path><path d="M7 4h10c1.66 0 3 1.34 3 3v2c0 2.76-2.24 5-5 5H9c-2.76 0-5-2.24-5-5V7c0-1.66 1.34-3 3-3z"></path></svg>
                                            )}
                                        </div>

                                        <div className="slide-texts">
                                            <div className="slide-header-text">
                                                <span className="slide-number">Слайд {index + 1}</span>
                                                {slide.isRequired && <span className="slide-badge">Обязательный</span>}
                                            </div>
                                            <div className="slide-main-title">{slide.title}</div>
                                            <div className="slide-subtitle">{slide.subtitle}</div>
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
