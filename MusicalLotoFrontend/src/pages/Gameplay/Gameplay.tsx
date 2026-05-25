import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HeaderLibrary from '../../components/HeaderLibrary/HeaderLibrary';
import { useMusic, type MusicSong } from '../../context/MusicContext';
import { apiFetch } from '../../utils/api';
import './Gameplay.css';

import PlayHubIcon from '../../assets/Presentation/Иконка в кнопке запустить.svg';

interface Slide {
    id: string;
    type: 'Title' | 'Rules' | 'GameBoard' | 'QrCode' | 'Song' | 'Winner';
    title?: string;
    content?: string;
    backgroundColor?: string;
    backgroundImageUrl?: string;
    order: number;
    isRequired: boolean;
    songId?: string;
}

interface Claim {
    id: string;
    name: string;
    time: string;
    status: 'Pending' | 'Confirmed' | 'Rejected';
}

const Gameplay: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { playSong, isPlaying, togglePlay, currentSong } = useMusic();

    const sessionId = searchParams.get('sessionId');

    const [gameName, setGameName] = useState('Проведение игры');
    const [slides, setSlides] = useState<Slide[]>([]);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const [participantCount, setParticipantCount] = useState(23);
    const [claims, setClaims] = useState<Claim[]>([
        { id: '1', name: 'Игрок №5', time: 'Только что', status: 'Pending' }
    ]);
    const [checkedWinners, setCheckedWinners] = useState<string[]>([]);
    const [currentLotoSong, setCurrentLotoSong] = useState<MusicSong | null>(null);
    const [isLotoRunning, setIsLotoRunning] = useState(false);

    useEffect(() => {
        if (!sessionId) {
            setIsLoading(false);
            return;
        }

        const fetchGameplayDetails = async () => {
            try {
                setIsLoading(true);
                // Fetch presentation details for game scenario
                const response = await apiFetch(`/api/Games/${sessionId}/presentation`);
                if (response.ok) {
                    const data = await response.json();
                    const slidesList = Array.isArray(data) ? data : [];
                    setSlides(slidesList);

                    // Find Title Slide for Game Name
                    const titleSlide = slidesList.find((s: Slide) => {
                        const typeStr = typeof s.type === 'number'
                            ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][s.type]
                            : String(s.type);
                        return typeStr === 'Title';
                    });
                    if (titleSlide && titleSlide.title) {
                        setGameName(titleSlide.title);
                    }
                }

                // Fetch session metadata
                const sessionResponse = await apiFetch(`/api/Games`);
                if (sessionResponse.ok) {
                    const sessions = await sessionResponse.json();
                    const currentSession = sessions.find((s: any) => s.id === sessionId);
                    if (currentSession) {
                        setParticipantCount(currentSession.participantCount || 23);
                    }
                }
            } catch (error) {
                console.error('Ошибка загрузки сценария игры:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGameplayDetails();
    }, [sessionId]);

    const activeSlide = slides[activeSlideIndex];

    const playNextSongApi = async () => {
        if (!sessionId) return;
        setIsLotoRunning(true);
        try {
            const response = await apiFetch('/api/Gameplay/next-song', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });

            if (response.ok) {
                const songData = await response.json();
                if (songData && songData.audioPath) {
                    const songDetails: MusicSong = {
                        id: songData.id,
                        title: songData.title,
                        artist: songData.artist,
                        audioPath: songData.audioPath,
                    };
                    setCurrentLotoSong(songDetails);
                    if (currentSong?.id === songDetails.id) {
                        if (!isPlaying) {
                            togglePlay();
                        }
                    } else {
                        playSong(songDetails);
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка автоматического переключения на следующую песню:', error);
        } finally {
            setIsLotoRunning(false);
        }
    };

    const playPrevSongApi = async () => {
        if (!sessionId) return;
        setIsLotoRunning(true);
        try {
            const response = await apiFetch('/api/Gameplay/previous-song', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });

            if (response.ok) {
                const songData = await response.json();
                if (songData && songData.audioPath) {
                    const songDetails: MusicSong = {
                        id: songData.id,
                        title: songData.title,
                        artist: songData.artist,
                        audioPath: songData.audioPath,
                    };
                    setCurrentLotoSong(songDetails);
                    if (currentSong?.id === songDetails.id) {
                        if (!isPlaying) {
                            togglePlay();
                        }
                    } else {
                        playSong(songDetails);
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка автоматического переключения на предыдущую песню:', error);
        } finally {
            setIsLotoRunning(false);
        }
    };

    const handleNextSlide = async () => {
        if (activeSlideIndex < slides.length - 1) {
            const nextIdx = activeSlideIndex + 1;
            const targetSlide = slides[nextIdx];
            const typeStr = typeof targetSlide.type === 'number'
                ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][targetSlide.type] || 'Title'
                : String(targetSlide.type);

            setActiveSlideIndex(nextIdx);

            if (typeStr === 'Song') {
                await playNextSongApi();
            } else if (isPlaying) {
                togglePlay();
            }
        }
    };

    const handlePrevSlide = async () => {
        if (activeSlideIndex > 0) {
            const prevIdx = activeSlideIndex - 1;
            const targetSlide = slides[prevIdx];
            const typeStr = typeof targetSlide.type === 'number'
                ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][targetSlide.type] || 'Title'
                : String(targetSlide.type);

            setActiveSlideIndex(prevIdx);

            if (typeStr === 'Song') {
                await playPrevSongApi();
            } else if (isPlaying) {
                togglePlay();
            }
        }
    };

    const handleSelectSlide = (idx: number) => {
        setActiveSlideIndex(idx);
    };

    const handleEndGame = () => {
        if (window.confirm('Вы уверены, что хотите завершить игру?')) {
            navigate('/cabinet');
        }
    };

    const handleRunLoto = async () => {
        if (!sessionId) return;
        setIsLotoRunning(true);

        try {
            const response = await apiFetch('/api/Gameplay/next-song', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });

            if (response.ok) {
                const songData = await response.json();
                if (songData && songData.audioPath) {
                    // Update active slide with the song details if it's currently a song slide
                    const songDetails: MusicSong = {
                        id: songData.id,
                        title: songData.title,
                        artist: songData.artist,
                        audioPath: songData.audioPath,
                    };
                    setCurrentLotoSong(songDetails);

                    // Trigger global playback
                    playSong(songDetails);
                } else {
                    alert('Все песни в плейлисте уже были воспроизведены!');
                }
            } else {
                alert('Не удалось запустить лототрон. Возможно, игра окончена.');
            }
        } catch (error) {
            console.error('Ошибка запуска лототрона:', error);
            alert('Сбой сети при запуске лототрона');
        } finally {
            setIsLotoRunning(false);
        }
    };

    const handleCheckBingo = () => {
        // Simulates claims checking
        if (claims.length === 0) return;

        const claim = claims[0];
        alert(`Проверка билета для игрока: ${claim.name}. Все ячейки совпадают с выпавшими песнями!`);
        setCheckedWinners(prev => [...prev, claim.id]);
    };

    const handleConfirmBingo = () => {
        if (claims.length === 0) return;

        setClaims(prev => prev.map(c => c.id === '1' ? { ...c, status: 'Confirmed' as const } : c));
        alert('Бинго успешно подтверждено! Игрок объявляется победителем!');

        // Skip to winner slide
        const winnerIdx = slides.findIndex(s => {
            const typeStr = typeof s.type === 'number'
                ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][s.type]
                : String(s.type);
            return typeStr === 'Winner';
        });
        if (winnerIdx !== -1) {
            setActiveSlideIndex(winnerIdx);
        }
    };

    const getSlideTypeName = (type: string | number) => {
        const typeStr = typeof type === 'number'
            ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][type] || 'Title'
            : String(type);

        switch (typeStr) {
            case 'Title': return 'Титульный экран';
            case 'Rules': return 'Правила игры';
            case 'GameBoard': return 'Игровое поле';
            case 'QrCode': return 'Вход в игру (QR)';
            case 'Song': return 'Песня';
            case 'Winner': return 'Финал игры';
            default: return 'Слайд';
        }
    };

    const renderIcon = (type: string | number) => {
        const typeStr = typeof type === 'number'
            ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][type] || 'Title'
            : String(type);

        switch (typeStr) {
            case 'Title': return '📺';
            case 'Rules': return '📜';
            case 'GameBoard': return '🎮';
            case 'QrCode': return '📱';
            case 'Song': return '🎵';
            case 'Winner': return '🏆';
            default: return '📄';
        }
    };

    if (isLoading) {
        return (
            <div className="gameplay-wrapper loading-screen">
                <HeaderLibrary />
                <div className="loader-container">
                    <span className="spinner"></span>
                    <p>Запуск игрового сценария...</p>
                </div>
            </div>
        );
    }

    if (!sessionId || slides.length === 0) {
        return (
            <div className="gameplay-wrapper empty-screen">
                <HeaderLibrary />
                <div className="empty-message-container container">
                    <h2>Сценарий не найден</h2>
                    <p>Пожалуйста, вернитесь в личный кабинет и выберите корректную игру.</p>
                    <button onClick={() => navigate('/cabinet')} className="btn-play-scenario">
                        Вернуться в кабинет
                    </button>
                </div>
            </div>
        );
    }

    const activeSlideTypeStr = typeof activeSlide.type === 'number'
        ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][activeSlide.type] || 'Title'
        : String(activeSlide.type);

    const activeBackgroundStyle = activeSlide.backgroundImageUrl
        ? { backgroundImage: `url(${activeSlide.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'transparent' }
        : { backgroundColor: activeSlide.backgroundColor || '#2168F5' };

    const playlistSongsCount = slides.filter(s => {
        const t = typeof s.type === 'number' ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][s.type] : String(s.type);
        return t === 'Song';
    }).length;

    return (
        <div className="gameplay-wrapper">
            <HeaderLibrary />

            <div className="gameplay-header-title container">
                <h1>Проведение игры</h1>
                <p>{gameName}</p>
            </div>

            <main className="container gameplay-main-grid">
                {/* 1. Левая колонка: Сценарий */}
                <aside className="gameplay-sidebar scenario-sidebar">
                    <h2 className="sidebar-heading">Сценарий игры</h2>
                    <div className="scenario-list-scroll">
                        {slides.map((slide, idx) => {
                            const typeStr = typeof slide.type === 'number'
                                ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][slide.type] || 'Title'
                                : String(slide.type);
                            const isActive = idx === activeSlideIndex;
                            return (
                                <div
                                    key={slide.id}
                                    className={`scenario-item ${isActive ? 'active' : ''}`}
                                    onClick={() => handleSelectSlide(idx)}
                                >
                                    <div className="scenario-icon-box">
                                        {renderIcon(slide.type)}
                                    </div>
                                    <div className="scenario-info">
                                        <span className="scenario-title">
                                            {typeStr === 'Song' ? `Песня #${idx - 3}` : getSlideTypeName(slide.type)}
                                        </span>
                                        <span className="scenario-desc">
                                            {typeStr === 'Song' ? slide.title : (slide.content ? (slide.content.substring(0, 30) + '...') : 'Инструктаж')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* 2. Центральная колонка: Активный слайд */}
                <section className="gameplay-center">
                    <div className="active-slide-card">
                        <div className="active-slide-label">
                            АКТИВНЫЙ СЛАЙД
                        </div>

                        {/* Сам визуальный слайд */}
                        <div className="slide-preview-box" style={activeBackgroundStyle}>
                            <div className="slide-preview-content">
                                {activeSlideTypeStr === 'Title' && (
                                    <div className="slide-title-view">
                                        <div className="slide-view-logo">🎵</div>
                                        <h2 className="title-view-heading">{activeSlide.title || gameName}</h2>
                                        <p className="title-view-desc">МУЗЫКАЛЬНОЕ ЛОТО</p>
                                    </div>
                                )}

                                {activeSlideTypeStr === 'Rules' && (
                                    <div className="slide-rules-view">
                                        <h2>ПРАВИЛА ИГРЫ</h2>
                                        <div className="rules-markdown-card">
                                            {activeSlide.content ? activeSlide.content.split('\n').map((line, lIdx) => (
                                                <p key={lIdx}>{line}</p>
                                            )) : 'Ознакомьтесь с правилами игры на экране.'}
                                        </div>
                                    </div>
                                )}

                                {activeSlideTypeStr === 'GameBoard' && (
                                    <div className="slide-gameboard-view">
                                        <div className="slide-view-logo">🎮</div>
                                        <h2>ИГРОВОЕ ПОЛЕ</h2>
                                        <p className="gameboard-view-start">{activeSlide.content || 'ИГРА НАЧАЛАСЬ!'}</p>
                                    </div>
                                )}

                                {activeSlideTypeStr === 'QrCode' && (
                                    <div className="slide-qr-view">
                                        <h2>ВХОД В ИГРУ</h2>
                                        <div className="slide-qr-code-placeholder">
                                            {/* Красивый макет QR-кода */}
                                            <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5">
                                                <rect x="2" y="2" width="6" height="6" rx="1" />
                                                <rect x="2" y="16" width="6" height="6" rx="1" />
                                                <rect x="16" y="2" width="6" height="6" rx="1" />
                                                <path d="M16 16h2v2h-2zm4 4h2v2h-2zm0-4h2v2h-2zm-4 4h2v2h-2zm4-2h2v2h-2zm-2 2h2v2h-2z" />
                                            </svg>
                                        </div>
                                        <p className="slide-qr-link">Ссылка: {activeSlide.content || 'musloto/join'}</p>
                                    </div>
                                )}

                                {activeSlideTypeStr === 'Song' && (
                                    <div className="slide-song-view">
                                        <span className="slide-song-badge">АКТИВНАЯ ПЕСНЯ</span>
                                        <h2 className="slide-song-title">{activeSlide.title}</h2>
                                        <p className="slide-song-artist">{activeSlide.content || 'Исполнитель'}</p>

                                        <button
                                            type="button"
                                            className={`btn-run-loto ${isPlaying ? 'playing' : ''}`}
                                            onClick={handleRunLoto}
                                            disabled={isLotoRunning}
                                        >
                                            {isLotoRunning ? (
                                                <span className="spinner"></span>
                                            ) : isPlaying ? (
                                                <>⏸️ Пауза лототрона</>
                                            ) : (
                                                <>
                                                    <img src={PlayHubIcon || '/src/assets/Presentation/Иконка в кнопке запустить.svg'} alt="Play" />
                                                    Запустить лототрон
                                                </>
                                            )}
                                        </button>
                                        {currentLotoSong && currentLotoSong.title === activeSlide.title && (
                                            <p className="loto-status-text">Сейчас играет в плеере 🔊</p>
                                        )}
                                    </div>
                                )}

                                {activeSlideTypeStr === 'Winner' && (
                                    <div className="slide-winner-view">
                                        <div className="slide-view-logo">🏆</div>
                                        <h2>ФИНАЛ ИГРЫ</h2>
                                        <p className="winner-view-congrats">{activeSlide.content || 'Финал и поздравление победителей!'}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Панель управления и шагов */}
                        <div className="slide-navigation-controls">
                            <button
                                type="button"
                                className="btn-nav-step"
                                onClick={handlePrevSlide}
                                disabled={activeSlideIndex === 0}
                            >
                                ◀ НАЗАД
                            </button>

                            <span className="step-info-counter">
                                Шаг {activeSlideIndex + 1} / {slides.length}
                            </span>

                            <button
                                type="button"
                                className="btn-nav-step"
                                onClick={handleNextSlide}
                                disabled={activeSlideIndex === slides.length - 1}
                            >
                                СЛЕДУЮЩИЙ СЛАЙД ▶
                            </button>
                        </div>

                        <div className="center-end-game-wrapper">
                            <button type="button" className="btn-end-game-session" onClick={handleEndGame}>
                                ЗАВЕРШИТЬ ИГРУ
                            </button>
                        </div>
                    </div>

                    {/* Статистика внизу */}
                    <div className="gameplay-stats-grid">
                        <div className="gameplay-stat-box">
                            <div className="stat-icon">👥</div>
                            <div className="stat-info">
                                <span className="stat-val">{participantCount}</span>
                                <span className="stat-lbl">Участников в игре</span>
                            </div>
                        </div>

                        <div className="gameplay-stat-box">
                            <div className="stat-icon">🎵</div>
                            <div className="stat-info">
                                <span className="stat-val">{playlistSongsCount}</span>
                                <span className="stat-lbl">Песен в плейлисте</span>
                            </div>
                        </div>

                        <div className="gameplay-stat-box">
                            <div className="stat-icon">ℹ️</div>
                            <div className="stat-info">
                                <span className="stat-val">100%</span>
                                <span className="stat-lbl">Статус синхронизации</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Правая колонка: Проверка победителей */}
                <aside className="gameplay-sidebar winners-sidebar">
                    <h2 className="sidebar-heading">Проверка победителей</h2>

                    <div className="winner-actions-buttons">
                        <button
                            type="button"
                            className="btn-winner-action check-bingo"
                            onClick={handleCheckBingo}
                            disabled={claims.length === 0}
                        >
                            Проверка бинго
                        </button>
                        <button
                            type="button"
                            className="btn-winner-action confirm-bingo"
                            onClick={handleConfirmBingo}
                            disabled={claims.length === 0 || !checkedWinners.includes(claims[0].id)}
                        >
                            Подтвердить бинго
                        </button>
                    </div>

                    <div className="claims-list-section">
                        <div className="claims-header">Заявки на бинго</div>
                        {claims.length === 0 ? (
                            <div className="empty-claims-text">
                                Ожидание новых заявок...
                            </div>
                        ) : (
                            claims.map(claim => (
                                <div key={claim.id} className={`claim-card ${claim.status.toLowerCase()}`}>
                                    <div className="claim-header-row">
                                        <span className="claim-number">#{claim.id}</span>
                                        <span className="claim-user-name">{claim.name}</span>
                                    </div>
                                    <div className="claim-footer-row">
                                        <span className="claim-time">{claim.time}</span>
                                        <span className={`claim-status-badge ${claim.status.toLowerCase()}`}>
                                            {claim.status === 'Pending' && 'Ожидает проверки'}
                                            {claim.status === 'Confirmed' && 'Бинго подтверждено!'}
                                            {claim.status === 'Rejected' && 'Отклонено'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default Gameplay;
