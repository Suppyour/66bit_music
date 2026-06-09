import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HeaderLibrary from '../../components/HeaderLibrary/HeaderLibrary';
import DialogModal from '../../components/DialogModal/DialogModal';
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

interface SimulatedCell {
    row: number;
    col: number;
    songId: string;
    title: string;
    artist: string;
}

interface SimulatedCard {
    id: string;
    playerName: string;
    cells: SimulatedCell[];
}

interface Claim {
    id: string;
    name: string;
    time: string;
    status: 'Pending' | 'Confirmed' | 'Rejected';
    card?: SimulatedCard;
}

const Gameplay: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { playSong, isPlaying, togglePlay, currentSong, closePlayer } = useMusic();

    const sessionId = searchParams.get('sessionId');
    const isPreview = searchParams.get('preview') === 'true';

    const [gameName, setGameName] = useState('Проведение игры');
    const [slides, setSlides] = useState<Slide[]>([]);
    const [activeSlideIndex, setActiveSlideIndex] = useState<number>(() => {
        if (!sessionId) return 0;
        try {
            const saved = localStorage.getItem(`loto_active_slide_${sessionId}`);
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            console.error(e);
            return 0;
        }
    });
    const [isLoading, setIsLoading] = useState(true);

    const [participantCount, setParticipantCount] = useState(23);
    const [claims, setClaims] = useState<Claim[]>(() => {
        if (!sessionId) return [];
        try {
            const saved = localStorage.getItem(`loto_claims_${sessionId}`);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error(e);
            return [];
        }
    });
    const [currentLotoSong, setCurrentLotoSong] = useState<MusicSong | null>(null);
    const [isLotoRunning, setIsLotoRunning] = useState(false);
    const [activeCheckingClaim, setActiveCheckingClaim] = useState<Claim | null>(null);
    const [cards, setCards] = useState<any[]>([]);
    const [manualCardQuery, setManualCardQuery] = useState('');
    const [isEndGameConfirmOpen, setIsEndGameConfirmOpen] = useState(false);
    const [isPresenterActive, setIsPresenterActive] = useState(false);
    const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
    const [isRandomizerMode, setIsRandomizerMode] = useState<boolean>(false);
    const [isRolling, setIsRolling] = useState<boolean>(false);
    const [rollingNumber, setRollingNumber] = useState<number | null>(null);
    const [boardIndex, setBoardIndex] = useState<number>(0);

    const [playedSongs, setPlayedSongs] = useState<string[]>(() => {
        if (!sessionId) return [];
        try {
            const saved = localStorage.getItem(`loto_played_songs_${sessionId}`);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error(e);
            return [];
        }
    });

    const { songs: allLibrarySongs } = useMusic();

    useEffect(() => {
        if (sessionId) {
            localStorage.setItem(`loto_played_songs_${sessionId}`, JSON.stringify(playedSongs));
        }
    }, [playedSongs, sessionId]);

    const handleRollRandomSong = () => {
        const songSlides = slides.filter(s => {
            const type = typeof s.type === 'number'
                ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][s.type]
                : String(s.type);
            return type === 'Song';
        });

        const unplayedSongSlides = songSlides.filter(s => !playedSongs.includes(s.id));

        if (unplayedSongSlides.length === 0) {
            alert('Все песни уже сыграны!');
            return;
        }

        const randomIndex = Math.floor(Math.random() * unplayedSongSlides.length);
        const chosenSlide = unplayedSongSlides[randomIndex];
        const targetBoardIndex = songSlides.findIndex(s => s.id === chosenSlide.id) + 1;

        setIsRolling(true);
        setRollingNumber(null);
        setBoardIndex(targetBoardIndex);

        let iterations = 0;
        const maxIterations = 20;
        const intervalId = setInterval(() => {
            const tempNum = Math.floor(Math.random() * songSlides.length) + 1;
            setRollingNumber(tempNum);
            iterations++;
            if (iterations >= maxIterations) {
                clearInterval(intervalId);
                setRollingNumber(targetBoardIndex);
                
                setTimeout(() => {
                    setIsRolling(false);
                    setRollingNumber(null);
                    
                    const originalIndex = slides.findIndex(s => s.id === chosenSlide.id);
                    if (!playedSongs.includes(chosenSlide.id)) {
                        setPlayedSongs(prev => [...prev, chosenSlide.id]);
                    }
                    setActiveSlideIndex(originalIndex);
                }, 1100);
            }
        }, 80);
    };

    const handleSelectSongFromBoard = async (songSlide: Slide, slideIndex: number) => {
        setActiveSlideIndex(slideIndex);
        if (!playedSongs.includes(songSlide.id)) {
            setPlayedSongs(prev => [...prev, songSlide.id]);
        }

        // Play the music using the global music context
        if (songSlide.songId) {
            const librarySong = allLibrarySongs.find(s => s.id === songSlide.songId);
            if (librarySong) {
                playSong(librarySong);
            } else {
                try {
                    const response = await apiFetch(`/api/Songs/${songSlide.songId}`);
                    if (response.ok) {
                        const songData = await response.json();
                        if (songData && songData.audioPath) {
                            playSong({
                                id: songData.id,
                                title: songData.title,
                                artist: songData.artist,
                                audioPath: songData.audioPath
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch clicked song for playback:", err);
                }
            }
        }
    };

    // Block global keyboard slide transitions using arrows
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

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
                    const filteredSlides = slidesList.filter((s: Slide) => {
                        const typeStr = typeof s.type === 'number'
                            ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][s.type]
                            : String(s.type);
                        return typeStr !== 'QrCode';
                    });
                    setSlides(filteredSlides);

                    // Find Title Slide for Game Name
                    const titleSlide = filteredSlides.find((s: Slide) => {
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

                // Fetch actual session cards
                const cardsResponse = await apiFetch(`/api/Games/${sessionId}/cards`);
                if (cardsResponse.ok) {
                    const cardsData = await cardsResponse.json();
                    setCards(cardsData || []);
                }
            } catch (error) {
                console.error('Ошибка загрузки сценария игры:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGameplayDetails();
    }, [sessionId]);


    useEffect(() => {
        if (sessionId) {
            localStorage.setItem(`loto_active_slide_${sessionId}`, String(activeSlideIndex));
        }
    }, [activeSlideIndex, sessionId]);

    useEffect(() => {
        if (sessionId) {
            localStorage.setItem(`loto_claims_${sessionId}`, JSON.stringify(claims));
        }
    }, [claims, sessionId]);

    // Synchronize browser fullscreen changes (e.g. exit fullscreen via Esc key)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsBrowserFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.body.classList.remove('presenter-active');
        };
    }, []);

    // Keyboard shortcuts for presenter mode
    useEffect(() => {
        if (!isPresenterActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                // Blocked
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                // Blocked
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsPresenterActive(false);
                document.body.classList.remove('presenter-active');
            } else if (e.key === ' ') {
                const targetSlide = slides[activeSlideIndex];
                if (targetSlide) {
                    const typeStr = typeof targetSlide.type === 'number'
                        ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][targetSlide.type] || 'Title'
                        : String(targetSlide.type);
                    if (typeStr === 'Song') {
                        e.preventDefault();
                        handleLotoButtonClick();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isPresenterActive, activeSlideIndex, slides, isPlaying, currentSong, isLotoRunning]);
    const handleManualCardCheck = () => {
        if (!manualCardQuery.trim()) return;
        if (cards.length === 0) {
            alert('Карточки сессии еще не загружены или отсутствуют в базе.');
            return;
        }

        const query = manualCardQuery.trim().toLowerCase();

        // Try searching by index (1-based)
        const index = parseInt(query);
        let foundCard = null;

        if (!isNaN(index) && index >= 1 && index <= cards.length) {
            foundCard = cards[index - 1];
        } else {
            // Search by full/short UUID or CuteName (case-insensitive)
            foundCard = cards.find(c =>
                c.id.toLowerCase() === query ||
                c.id.toLowerCase().includes(query) ||
                (c.cuteName && c.cuteName.toLowerCase() === query) ||
                (c.cuteName && c.cuteName.toLowerCase().includes(query))
            );
        }

        if (!foundCard) {
            alert('Билет с таким ID, номером или именем не найден!');
            return;
        }

        // Map to Claim and open the check modal
        const checkClaim: Claim = {
            id: `manual-${foundCard.id.substring(0, 8)}`,
            name: foundCard.cuteName ? `Билет: ${foundCard.cuteName}` : `Билет №${cards.indexOf(foundCard) + 1}`,
            time: 'Ручной ввод',
            status: 'Pending',
            card: {
                id: foundCard.id,
                playerName: foundCard.cuteName ? `Билет: ${foundCard.cuteName}` : `Билет №${cards.indexOf(foundCard) + 1}`,
                cells: foundCard.cells.map((c: any) => ({
                    row: c.row,
                    col: c.column !== undefined ? c.column : c.col,
                    songId: c.songId,
                    title: c.title,
                    artist: c.artist
                }))
            }
        };

        setActiveCheckingClaim(checkClaim);
        setManualCardQuery('');
    };


    const activeSlide = slides[activeSlideIndex];




    const handleSelectSlide = (idx: number) => {
        setActiveSlideIndex(idx);
    };

    const handleEndGame = () => {
        setIsEndGameConfirmOpen(true);
    };

    const confirmEndGame = async () => {
        setIsEndGameConfirmOpen(false);
        if (sessionId) {
            try {
                await apiFetch(`/api/Games/${sessionId}/complete`, {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Ошибка при завершении игры:', error);
            }
        }
        navigate('/cabinet');
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

    const handleLotoButtonClick = () => {
        if (isPlaying) {
            togglePlay();
        } else {
            if (currentSong && currentSong.id === activeSlide.songId) {
                togglePlay();
            } else {
                handleRunLoto();
            }
        }
    };

    const togglePresenterMode = () => {
        setIsPresenterActive(prev => {
            const nextVal = !prev;
            document.body.classList.toggle('presenter-active', nextVal);
            return nextVal;
        });
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsBrowserFullscreen(true);
            }).catch(err => console.error(err));
        } else {
            document.exitFullscreen().then(() => {
                setIsBrowserFullscreen(false);
            }).catch(err => console.error(err));
        }
    };

    const checkWinStatus = (card: SimulatedCard, playedIds: string[]) => {
        const size = Math.max(...card.cells.map(c => Math.max(c.row, c.col))) + 1;
        const grid: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));

        card.cells.forEach(cell => {
            if (playedIds.includes(cell.songId)) {
                grid[cell.row][cell.col] = true;
            }
        });

        const lines: string[] = [];

        // Check horizontal
        for (let r = 0; r < size; r++) {
            if (grid[r].every(v => v)) {
                lines.push(`Горизонталь (ряд ${r + 1})`);
            }
        }

        // Check vertical
        for (let c = 0; c < size; c++) {
            let win = true;
            for (let r = 0; r < size; r++) {
                if (!grid[r][c]) {
                    win = false;
                    break;
                }
            }
            if (win) {
                lines.push(`Вертикаль (колонна ${c + 1})`);
            }
        }

        // Check diagonal 1
        let diag1 = true;
        for (let i = 0; i < size; i++) {
            if (!grid[i][i]) {
                diag1 = false;
                break;
            }
        }
        if (diag1) {
            lines.push("Диагональ ↖-↘");
        }

        // Check diagonal 2
        let diag2 = true;
        for (let i = 0; i < size; i++) {
            if (!grid[i][size - 1 - i]) {
                diag2 = false;
                break;
            }
        }
        if (diag2) {
            lines.push("Диагональ ↗-↙");
        }

        // Check full card
        let full = true;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (!grid[r][c]) {
                    full = false;
                    break;
                }
            }
        }
        if (full) {
            lines.push("Вся Карточка!");
        }

        return lines;
    };

    const handleConfirmBingo = (claimId: string) => {
        setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'Confirmed' as const } : c));
        setActiveCheckingClaim(null);

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

    const handleRejectBingo = (claimId: string) => {
        setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'Rejected' as const } : c));
        setActiveCheckingClaim(null);
    };

    const parseMarkdownLine = (line: string) => {
        let html = line;
        html = html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
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

            {isPreview && (
                <div className="preview-top-banner" style={{ background: '#3B82F6', color: '#FFFFFF', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', fontSize: '15px' }}>
                    <span>👀 РЕЖИМ ПРЕДПРОСМОТРА • Звуковые эффекты и интерактивное управление отключены</span>
                    <button className="btn-back-editor" onClick={() => navigate(`/presentation?sessionId=${sessionId}`)} style={{ background: '#FFFFFF', color: '#3B82F6', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s' }}>
                        Вернуться к редактированию
                    </button>
                </div>
            )}

            <div className="gameplay-header-title container">
                <h1>Проведение игры</h1>
                <p>{gameName}</p>
            </div>

            <main className={`container gameplay-main-grid ${isPreview ? 'preview-active' : ''}`}>
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
                                            {typeStr === 'Song' ? `Песня # ${idx - 2}` : getSlideTypeName(slide.type)}
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
                        <div className="active-slide-header">
                            <div className="active-slide-label">АКТИВНЫЙ СЛАЙД</div>
                            <div className="slide-mode-actions">
                                <button
                                    type="button"
                                    className="btn-slide-action presenter-btn"
                                    onClick={togglePresenterMode}
                                    title="Запустить режим презентации"
                                >
                                    🖥️ Презентация
                                </button>
                                <button
                                    type="button"
                                    className="btn-slide-action"
                                    onClick={toggleFullscreen}
                                    title="Полноэкранный режим"
                                >
                                    {isBrowserFullscreen ? '🔍 Свернуть' : '📺 Во весь экран'}
                                </button>
                            </div>
                        </div>

                        {/* Сам визуальный слайд */}
                        <div className="slide-preview-box" style={activeBackgroundStyle}>
                            {activeSlide.backgroundImageUrl && <div className="slide-image-overlay"></div>}
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
                                                <p key={lIdx}>{parseMarkdownLine(line)}</p>
                                            )) : 'Ознакомьтесь с правилами игры на экране.'}
                                        </div>
                                    </div>
                                )}

                                {activeSlideTypeStr === 'GameBoard' && (
                                    <div className="gameboard-container-custom" style={{ position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                                            <h2 className="gameboard-title-custom" style={{ margin: 0 }}>Игровое поле</h2>
                                            <div className="loto-mode-toggle" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '20px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: !isRandomizerMode ? '#FFF' : '#94A3B8' }}>Бочонки</span>
                                                <div 
                                                    className="toggle-switch" 
                                                    onClick={() => setIsRandomizerMode(!isRandomizerMode)}
                                                    style={{
                                                        width: '44px',
                                                        height: '24px',
                                                        backgroundColor: isRandomizerMode ? '#10B981' : '#475569',
                                                        borderRadius: '12px',
                                                        position: 'relative',
                                                        cursor: 'pointer',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                >
                                                    <div 
                                                        style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            backgroundColor: '#FFF',
                                                            borderRadius: '50%',
                                                            position: 'absolute',
                                                            top: '3px',
                                                            left: isRandomizerMode ? '23px' : '3px',
                                                            transition: 'left 0.2s'
                                                        }}
                                                    />
                                                </div>
                                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: isRandomizerMode ? '#FFF' : '#94A3B8' }}>Рандомайзер</span>
                                            </div>
                                        </div>

                                        {isRandomizerMode && (
                                            <div className="randomizer-control-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px', width: '100%' }}>
                                                <button
                                                    type="button"
                                                    className="btn-run-loto"
                                                    onClick={handleRollRandomSong}
                                                    disabled={isRolling || isLotoRunning}
                                                    style={{
                                                        background: '#10B981',
                                                        color: '#FFF',
                                                        padding: '14px 28px',
                                                        fontSize: '16px',
                                                        fontWeight: 'bold',
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 8px 16px rgba(16,185,129,0.3)',
                                                        transition: 'all 0.2s',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    {isRolling ? (
                                                        <span className="spinner" style={{ borderTopColor: '#FFF' }}></span>
                                                    ) : '🎲 Выбрать случайную песню'}
                                                </button>
                                            </div>
                                        )}

                                        <div className="gameboard-grid-custom" style={{ pointerEvents: isRandomizerMode ? 'none' : 'auto', opacity: isRandomizerMode ? 0.7 : 1 }}>
                                            {slides.filter(s => {
                                                const type = typeof s.type === 'number'
                                                    ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][s.type]
                                                    : String(s.type);
                                                return type === 'Song';
                                            }).map((songSlide, index) => {
                                                const isPlayed = playedSongs.includes(songSlide.id);
                                                const originalIndex = slides.findIndex(s => s.id === songSlide.id);
                                                return (
                                                    <div
                                                        key={songSlide.id}
                                                        className={`gameboard-cell-custom ${isPlayed ? 'played' : ''}`}
                                                        onClick={() => {
                                                            if (isPreview) {
                                                                setActiveSlideIndex(originalIndex);
                                                            } else {
                                                                handleSelectSongFromBoard(songSlide, originalIndex);
                                                            }
                                                        }}
                                                    >
                                                        <div className="gameboard-cell-dots">
                                                            <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                                                                <circle cx="2" cy="2" r="1.2" fill="#D1D5DB" />
                                                                <circle cx="2" cy="6" r="1.2" fill="#D1D5DB" />
                                                                <circle cx="2" cy="10" r="1.2" fill="#D1D5DB" />
                                                                <circle cx="6" cy="2" r="1.2" fill="#D1D5DB" />
                                                                <circle cx="6" cy="6" r="1.2" fill="#D1D5DB" />
                                                                <circle cx="6" cy="10" r="1.2" fill="#D1D5DB" />
                                                            </svg>
                                                        </div>
                                                        <span className="gameboard-cell-number">{index + 1}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Rolling Overlay */}
                                        {(isRolling || rollingNumber !== null) && (
                                            <div className="rolling-overlay" style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: 'rgba(15, 23, 42, 0.95)',
                                                backdropFilter: 'blur(10px)',
                                                zIndex: 200,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '24px'
                                            }}>
                                                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>
                                                    {isRolling && rollingNumber !== boardIndex ? 'Случайный выбор бочонка' : 'Результат розыгрыша'}
                                                </span>
                                                <div className="rolling-number-glow" style={{
                                                    fontSize: '140px',
                                                    fontWeight: '900',
                                                    color: (isRolling && rollingNumber !== boardIndex) ? '#3B82F6' : '#10B981',
                                                    textShadow: (isRolling && rollingNumber !== boardIndex) 
                                                        ? '0 0 40px rgba(59,130,246,0.6)' 
                                                        : '0 0 50px rgba(16,185,129,0.8)',
                                                    transition: 'color 0.3s'
                                                }}>
                                                    {rollingNumber}
                                                </div>
                                                {rollingNumber === boardIndex && (
                                                     <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFF', marginTop: '20px' }}>
                                                         Переход к песне #{boardIndex}...
                                                     </div>
                                                )}
                                            </div>
                                        )}
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

                                        {!isPreview && (
                                            <>
                                                <button
                                                    type="button"
                                                    className={`btn-run-loto ${isPlaying ? 'playing' : ''}`}
                                                    onClick={handleLotoButtonClick}
                                                    disabled={isLotoRunning}
                                                    style={{ marginTop: '20px' }}
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
                                            </>
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
                            {activeSlideTypeStr === 'Song' ? (
                                <button
                                    type="button"
                                    className="btn-return-gameboard"
                                    onClick={() => {
                                        closePlayer();
                                        const idx = slides.findIndex(s => {
                                            const type = typeof s.type === 'number'
                                                ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][s.type]
                                                : String(s.type);
                                            return type === 'GameBoard';
                                        });
                                        if (idx !== -1) setActiveSlideIndex(idx);
                                    }}
                                    style={{
                                        background: '#2168F5',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 12px rgba(33, 104, 245, 0.2)'
                                    }}
                                >
                                    Вернуться в игровое поле
                                </button>
                            ) : (
                                <>
                                    <span className="step-info-counter">
                                        Шаг {activeSlideIndex + 1} / {slides.length}
                                    </span>
                                </>
                            )}
                        </div>

                        {!isPreview && (
                            <div className="center-end-game-wrapper">
                                <button type="button" className="btn-end-game-session" onClick={handleEndGame}>
                                    ЗАВЕРШИТЬ ИГРУ
                                </button>
                            </div>
                        )}
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

                <DialogModal
                    isOpen={isEndGameConfirmOpen}
                    title="Завершение игры"
                    message="Вы уверены, что хотите завершить игру?"
                    isDanger={true}
                    confirmText="Завершить"
                    onConfirm={confirmEndGame}
                    onCancel={() => setIsEndGameConfirmOpen(false)}
                />

                {/* 3. Правая колонка: Проверка победителей */}
                {!isPreview && (
                    <aside className="gameplay-sidebar winners-sidebar">
                        <h2 className="sidebar-heading">Проверка победителей</h2>

                        <div className="card-manual-check">
                            <div className="manual-check-title">Быстая проверка билета</div>
                            <div className="manual-check-form">
                                <input
                                    type="text"
                                    placeholder="ID билета (например, 1, 2...)"
                                    value={manualCardQuery}
                                    onChange={(e) => setManualCardQuery(e.target.value)}
                                    className="manual-check-input"
                                />
                                <button
                                    type="button"
                                    onClick={handleManualCardCheck}
                                    className="btn-manual-check-submit"
                                >
                                    Проверить билет
                                </button>
                            </div>
                        </div>

                        <div className="claims-list-section">
                            <div className="claims-header">Заявки на бинго (кликните для проверки)</div>
                            {claims.length === 0 ? (
                                <div className="empty-claims-text">
                                    Ожидание новых заявок...
                                </div>
                            ) : (
                                claims.map(claim => (
                                    <div
                                        key={claim.id}
                                        className={`claim-card ${claim.status.toLowerCase()}`}
                                        onClick={() => setActiveCheckingClaim(claim)}
                                        style={{ cursor: 'pointer' }}
                                    >
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
                )}
            </main>



            {isPresenterActive && (
                <div className="presenter-mode-overlay">
                    {/* Floating Claims Panel in Presentation Mode */}
                    {claims.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '24px',
                            right: '24px',
                            background: 'rgba(15, 23, 42, 0.85)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid #334155',
                            borderRadius: '16px',
                            padding: '16px',
                            width: '280px',
                            maxHeight: '80vh',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            zIndex: 100
                        }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>
                                Заявки на Бинго ({claims.filter(c => c.status === 'Pending').length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                                {claims.map(claim => (
                                    <div
                                        key={claim.id}
                                        onClick={() => setActiveCheckingClaim(claim)}
                                        style={{
                                            background: claim.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.2)' : claim.status === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            border: `1px solid ${claim.status === 'Confirmed' ? '#10B981' : claim.status === 'Rejected' ? '#EF4444' : '#3B82F6'}`
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFF', fontSize: '13px', marginBottom: '4px' }}>
                                            <strong>#{claim.id}</strong>
                                            <span>{claim.name}</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#E2E8F0' }}>
                                            {claim.status === 'Pending' && 'Ожидает проверки'}
                                            {claim.status === 'Confirmed' && 'Бинго подтверждено!'}
                                            {claim.status === 'Rejected' && 'Отклонено'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="presenter-slide-viewport" style={activeBackgroundStyle}>
                        {activeSlide.backgroundImageUrl && <div className="slide-image-overlay"></div>}

                        <div className="presenter-slide-content">
                            {activeSlideTypeStr === 'Title' && (
                                <div className="presenter-slide-view title-view">
                                    <div className="presenter-logo">🎵</div>
                                    <h1 className="presenter-heading">{activeSlide.title || gameName}</h1>
                                    <p className="presenter-subheading">МУЗЫКАЛЬНОЕ ЛОТО</p>
                                </div>
                            )}

                            {activeSlideTypeStr === 'Rules' && (
                                <div className="presenter-slide-view rules-view">
                                    <h1 className="presenter-heading">📜 ПРАВИЛА ИГРЫ</h1>
                                    <div className="presenter-rules-box">
                                        {activeSlide.content ? activeSlide.content.split('\n').map((line, lIdx) => (
                                            <p key={lIdx}>{parseMarkdownLine(line)}</p>
                                        )) : 'Ознакомьтесь с правилами игры на экране.'}
                                    </div>
                                </div>
                            )}

                            {activeSlideTypeStr === 'GameBoard' && (
                                <div className="presenter-slide-view gameboard-view-fullscreen" style={{ width: '100%', maxWidth: '900px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '24px' }}>
                                        <h1 className="presenter-heading" style={{ margin: 0 }}>Игровое поле</h1>
                                        <button
                                            type="button"
                                            className="btn-run-loto"
                                            onClick={handleRollRandomSong}
                                            disabled={isRolling || isLotoRunning}
                                            style={{
                                                background: '#10B981',
                                                color: '#FFF',
                                                padding: '12px 24px',
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                borderRadius: '12px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                boxShadow: '0 8px 16px rgba(16,185,129,0.3)',
                                                transition: 'all 0.2s',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            {isRolling ? (
                                                <span className="spinner" style={{ borderTopColor: '#FFF' }}></span>
                                            ) : 'Случайная песня'}
                                        </button>
                                    </div>
                                    <div className="gameboard-grid-custom" style={{ width: '100%', gap: '20px', pointerEvents: isRolling ? 'none' : 'auto' }}>
                                        {slides.filter(s => {
                                            const type = typeof s.type === 'number'
                                                ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][s.type]
                                                : String(s.type);
                                            return type === 'Song';
                                        }).map((songSlide, index) => {
                                            const isPlayed = playedSongs.includes(songSlide.id);
                                            const originalIndex = slides.findIndex(s => s.id === songSlide.id);
                                            return (
                                                <div
                                                    key={songSlide.id}
                                                    className={`gameboard-cell-custom ${isPlayed ? 'played' : ''}`}
                                                    onClick={() => {
                                                        if (isPreview) {
                                                            setActiveSlideIndex(originalIndex);
                                                        } else {
                                                            handleSelectSongFromBoard(songSlide, originalIndex);
                                                        }
                                                    }}
                                                    style={{ height: '100px', cursor: isPlayed ? 'default' : 'pointer' }}
                                                >
                                                    <div className="gameboard-cell-dots">
                                                        <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                                                            <circle cx="2" cy="2" r="1.2" fill="#D1D5DB" />
                                                            <circle cx="2" cy="6" r="1.2" fill="#D1D5DB" />
                                                            <circle cx="2" cy="10" r="1.2" fill="#D1D5DB" />
                                                            <circle cx="6" cy="2" r="1.2" fill="#D1D5DB" />
                                                            <circle cx="6" cy="6" r="1.2" fill="#D1D5DB" />
                                                            <circle cx="6" cy="10" r="1.2" fill="#D1D5DB" />
                                                        </svg>
                                                    </div>
                                                    <span className="gameboard-cell-number" style={{ fontSize: '28px' }}>{index + 1}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Presenter Rolling Overlay */}
                                    {(isRolling || rollingNumber !== null) && (
                                        <div className="rolling-overlay" style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'rgba(15, 23, 42, 0.95)',
                                            backdropFilter: 'blur(10px)',
                                            zIndex: 200,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '24px'
                                        }}>
                                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>
                                                {isRolling && rollingNumber !== boardIndex ? 'Случайный выбор бочонка' : 'Результат розыгрыша'}
                                            </span>
                                            <div className="rolling-number-glow" style={{
                                                fontSize: '180px',
                                                fontWeight: '900',
                                                color: (isRolling && rollingNumber !== boardIndex) ? '#3B82F6' : '#10B981',
                                                textShadow: (isRolling && rollingNumber !== boardIndex) 
                                                    ? '0 0 50px rgba(59,130,246,0.6)' 
                                                    : '0 0 60px rgba(16,185,129,0.8)',
                                                transition: 'color 0.3s'
                                            }}>
                                                {rollingNumber}
                                            </div>
                                            {rollingNumber === boardIndex && (
                                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFF', marginTop: '20px' }}>
                                                    Переход к песне #{boardIndex}...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSlideTypeStr === 'QrCode' && (
                                <div className="presenter-slide-view qr-view">
                                    <h1 className="presenter-heading">📱 ВХОД В ИГРУ</h1>
                                    <div className="presenter-qr-box">
                                        <svg width="240" height="240" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5">
                                            <rect x="2" y="2" width="6" height="6" rx="1" />
                                            <rect x="2" y="16" width="6" height="6" rx="1" />
                                            <rect x="16" y="2" width="6" height="6" rx="1" />
                                            <path d="M16 16h2v2h-2zm4 4h2v2h-2zm0-4h2v2h-2zm-4 4h2v2h-2zm4-2h2v2h-2zm-2 2h2v2h-2z" />
                                        </svg>
                                    </div>
                                    <p className="presenter-qr-link">Ссылка: {activeSlide.content || 'musloto/join'}</p>
                                </div>
                            )}

                            {activeSlideTypeStr === 'Song' && (
                                <div className="presenter-slide-view song-view">
                                    <span className="presenter-song-badge">🎵 АКТИВНАЯ ПЕСНЯ</span>
                                    <h1 className="presenter-song-title">
                                        {activeSlide.title}
                                    </h1>
                                    <p className="presenter-song-artist">
                                        {activeSlide.content || 'Исполнитель'}
                                    </p>

                                    <div className="presenter-song-controls" style={{ marginTop: '30px' }}>
                                        <button
                                            type="button"
                                            className="btn-presenter-action return-gameboard-presenter"
                                            onClick={() => {
                                                closePlayer();
                                                const idx = slides.findIndex(s => {
                                                    const type = typeof s.type === 'number'
                                                        ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][s.type]
                                                        : String(s.type);
                                                    return type === 'GameBoard';
                                                });
                                                if (idx !== -1) setActiveSlideIndex(idx);
                                            }}
                                            style={{
                                                background: '#2168F5',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                padding: '16px 36px',
                                                borderRadius: '12px',
                                                fontSize: '18px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 4px 15px rgba(33, 104, 245, 0.3)'
                                            }}
                                        >
                                            Вернуться в игровое поле
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeSlideTypeStr === 'Winner' && (
                                <div className="presenter-slide-view winner-view">
                                    <div className="presenter-logo-winner">🏆</div>
                                    <h1 className="presenter-heading text-winner">ФИНАЛ ИГРЫ</h1>
                                    <p className="presenter-winner-text">{activeSlide.content || 'Финал и поздравление победителей!'}</p>
                                </div>
                            )}
                        </div>

                        <div className="presenter-toolbar">
                            <div className="presenter-toolbar-section left" style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                                    {gameName}
                                </span>
                                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                                    <input
                                        type="text"
                                        placeholder="ID билета"
                                        value={manualCardQuery}
                                        onChange={(e) => setManualCardQuery(e.target.value)}
                                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#1E293B', color: '#F8FAFC', fontSize: '12px', width: '90px', outline: 'none' }}
                                    />
                                    <button
                                        className="btn-toolbar-action fullscreen"
                                        style={{ padding: '0px 16px', width: 'auto' }}
                                        onClick={handleManualCardCheck}
                                    >
                                        Проверить
                                    </button>
                                </div>
                            </div>

                            <div className="presenter-toolbar-section center">
                                <span className="presenter-toolbar-counter">
                                    Слайд {activeSlideIndex + 1} из {slides.length}
                                </span>
                            </div>

                            <div className="presenter-toolbar-section right">
                                <button
                                    type="button"
                                    className="btn-toolbar-action"
                                    onClick={handleEndGame}
                                    title="Завершить игру"
                                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0 16px', marginRight: '8px' }}
                                >
                                    Финал
                                </button>
                                <button
                                    type="button"
                                    className="btn-toolbar-action fullscreen"
                                    onClick={toggleFullscreen}
                                    title="Полноэкранный режим браузера"
                                    style={{ padding: '0 16px', width: 'auto' }}
                                >
                                    {isBrowserFullscreen ? 'Свернуть' : 'Развернуть'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-toolbar-action close"
                                    onClick={togglePresenterMode}
                                    title="Выйти из презентации"
                                >
                                    Выйти
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeCheckingClaim && activeCheckingClaim.card && (
                <div className="verification-modal-overlay" onClick={() => setActiveCheckingClaim(null)}>
                    <div className="verification-modal-card" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setActiveCheckingClaim(null)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                color: '#94A3B8',
                                fontSize: '24px',
                                cursor: 'pointer'
                            }}
                        >
                            &times;
                        </button>
                        <div className="verification-modal-header">
                            <h3 className="verification-modal-title">Проверка билета</h3>
                            <p className="verification-modal-subtitle">Игрок: {activeCheckingClaim.name} | ID: {activeCheckingClaim.card.id}</p>
                        </div>

                        {/* 5x5 card representation */}
                        <div className="verification-card-grid">
                            {activeCheckingClaim.card.cells.map((cell, idx) => {
                                const playedSongIds = slides
                                    .filter(s => playedSongs.includes(s.id))
                                    .map(s => s.songId || s.id);
                                const isPlayed = playedSongIds.includes(cell.songId);
                                return (
                                    <div
                                        key={idx}
                                        className={`verification-cell ${isPlayed ? 'played' : ''}`}
                                    >
                                        <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>
                                            {cell.row + 1}-{cell.col + 1}
                                        </div>
                                        <div style={{ lineHeight: '1.2' }}>{cell.title}</div>
                                        <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>{cell.artist}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Verification details */}
                        <div className="verification-status-panel">
                            <div className="verification-status-title">Результат анализа комбинаций:</div>
                            {(() => {
                                const playedSongIds = slides
                                    .filter(s => playedSongs.includes(s.id))
                                    .map(s => s.songId || s.id);
                                const winningLines = checkWinStatus(activeCheckingClaim.card!, playedSongIds);
                                if (winningLines.length > 0) {
                                    return (
                                        <div className="verification-status-result">
                                            Бинго! Найдены выигрышные линии:
                                            <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                                                {winningLines.map((line, lIdx) => (
                                                    <li key={lIdx}>{line}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="verification-status-result invalid">
                                            Совпадений недостаточно для выигрышной комбинации.
                                        </div>
                                    );
                                }
                            })()}
                        </div>

                        <div className="verification-modal-footer">
                            <button
                                className="btn-verification-reject"
                                onClick={() => handleRejectBingo(activeCheckingClaim.id)}
                            >
                                Отклонить
                            </button>
                            <button
                                className="btn-verification-confirm"
                                onClick={() => handleConfirmBingo(activeCheckingClaim.id)}
                            >
                                Подтвердить победу
                            </button>
                            <button
                                className="btn-verification-close"
                                onClick={() => setActiveCheckingClaim(null)}
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gameplay;
