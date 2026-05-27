import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CreateGameModal from '../../components/CreateGameModal/CreateGameModal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import HeaderLibrary from '../../components/HeaderLibrary/HeaderLibrary';
import SelectSongsModal from '../../components/SelectSongsModal/SelectSongsModal';
import type { Song } from '../../components/SelectSongsModal/SelectSongsModal';

import SelectSongIcon from '../../assets/Generator/Иконка в кнопке Выбрать песню из библиотеки.svg';
import GenerateIcon from '../../assets/Generator/Иконка в кнопке Сгенерировать.svg';
import LoadBgIcon from '../../assets/Generator/Иконка в кнопке Загрузить фон.svg';
import InfinityIcon from '../../assets/Generator/Значек во все карточки уникальны.svg';

import './Generator.css';
import { apiFetch } from '../../utils/api';


interface CardCellData {
    row: number;
    column: number;
    songId: string;
}

interface CardDto {
    id: string;
    cells: CardCellData[];
}


const SortableCell = ({ cell, song }: { cell: CardCellData; song?: Song }) => {

    const id = `${cell.row}-${cell.column}`;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bingo-cell ${isDragging ? 'bingo-cell-dragging' : ''}`}
        >
            <div className="cell-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                </svg>
            </div>
            <div className="cell-title" title={song ? `${song.title} - ${song.artist}` : 'Пустая ячейка'}>
                {song ? song.title : '...'}
            </div>
        </div>
    );
};


const Generator: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('sessionId');

    const [cardCount, setCardCount] = useState<number>(20);
    const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const initializeGenerator = async () => {
            if (sessionId) {
                try {
                    // Fetch the session details to get participant count
                    const gamesResponse = await apiFetch('/api/Games');
                    if (gamesResponse.ok) {
                        const sessions = await gamesResponse.json();
                        const currentSession = sessions.find((s: any) => s.id === sessionId);
                        if (currentSession) {
                            setCardCount(currentSession.participantCount || 20);
                        }
                    }

                    // Fetch the presentation/slides to get the songs
                    const presResponse = await apiFetch(`/api/Games/${sessionId}/presentation`);
                    if (presResponse.ok) {
                        const slidesData = await presResponse.json();
                        const slidesList = Array.isArray(slidesData) ? slidesData : [];
                        const songsFromSlides: Song[] = slidesList
                            .filter((s: any) => {
                                const typeStr = typeof s.type === 'number'
                                    ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][s.type]
                                    : String(s.type);
                                return typeStr === 'Song';
                            })
                            .map((s: any) => ({
                                id: s.songId || s.id,
                                title: s.title || '',
                                artist: s.content || ''
                            }));

                        if (songsFromSlides.length > 0) {
                            setSelectedSongs(songsFromSlides);
                            return; // skip loading from localStorage
                        }
                    }
                } catch (error) {
                    console.error("Ошибка при инициализации генератора по sessionId:", error);
                }
            }

            // Fallback / default behavior: fetch all songs and load from localStorage
            try {
                const response = await apiFetch('/api/Songs');
                if (response.ok) {
                    const data = await response.json();
                    
                    const generatorSongsJson = localStorage.getItem('generatorSelectedSongIds');
                    if (generatorSongsJson) {
                        try {
                            const selectedIds: string[] = JSON.parse(generatorSongsJson);
                            const filtered = data.filter((s: any) => selectedIds.includes(s.id));
                            setSelectedSongs(filtered);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            } catch (error) {
                console.error("Ошибка при получении всех песен в генераторе:", error);
            }
        };

        initializeGenerator();
    }, [sessionId]);

    const handleGoToPresentation = () => {
        if (selectedSongs.length < 25) {
            alert('Пожалуйста, сначала выберите минимум 25 песен из библиотеки!');
            return;
        }
        if (sessionId) {
            navigate(`/presentation?sessionId=${sessionId}`);
        } else {
            setIsCreateModalOpen(true);
        }
    };

    const [generatedCards, setGeneratedCards] = useState<CardDto[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
    const [isGenerating, setIsGenerating] = useState(false);

    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [companyName, setCompanyName] = useState('Название компании');
    const [editionName, setEditionName] = useState('Название издания');
    const [titleText, setTitleText] = useState('Заголовок');
    const [footerText, setFooterText] = useState('Подзаголовок');


    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBackgroundImage(url);
            setBackgroundImageFile(file);
        }
    };

    const handleDownloadZip = async () => {
        if (generatedCards.length === 0) return;

        const formData = new FormData();
        formData.append('cardsJson', JSON.stringify(generatedCards));
        formData.append('songsJson', JSON.stringify(selectedSongs));
        formData.append('companyName', companyName);
        formData.append('editionName', editionName);
        formData.append('titleText', titleText);
        formData.append('footerText', footerText);

        if (backgroundImageFile) {
            formData.append('background', backgroundImageFile);
        }

        try {
            const response = await apiFetch('/api/Pdf/generateArchive', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err || 'Server error');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'CardsArchive.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download archive:', error);
            alert('Ошибка при скачивании архива. Возможно, файл слишком большой.');
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleGenerate = async () => {
        if (selectedSongs.length < 25) {
            alert('Для карточки 5x5 нужно выбрать минимум 25 песен!');
            return;
        }

        setIsGenerating(true);
        try {
            const response = await apiFetch('/api/Cards/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    count: cardCount,
                    cardSize: 5,
                    songIds: selectedSongs.map(s => s.id),
                    sessionId: sessionId || null
                })
            });

            if (response.ok) {
                const data = await response.json();
                setGeneratedCards(data);
                setCurrentCardIndex(0);
            } else {
                const err = await response.text();
                alert('Ошибка генерации: ' + err);
            }
        } catch (error) {
            console.error('Failed to generate cards:', error);
            alert('Не удалось связаться с сервером');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setGeneratedCards((prevCards) => {
            const newCards = [...prevCards];
            const currentCard = { ...newCards[currentCardIndex] };
            const cells = [...currentCard.cells];

            const oldIndex = cells.findIndex((c) => `${c.row}-${c.column}` === active.id);
            const newIndex = cells.findIndex((c) => `${c.row}-${c.column}` === over.id);


            const tempSongId = cells[oldIndex].songId;
            cells[oldIndex].songId = cells[newIndex].songId;
            cells[newIndex].songId = tempSongId;

            currentCard.cells = cells;
            newCards[currentCardIndex] = currentCard;
            return newCards;
        });
    };

    const currentCard = generatedCards[currentCardIndex];

    return (
        <div className="generator-wrapper">
            <HeaderLibrary />

            <main className="generator-main">
                <div className="generator-header">
                    <h1 className="generator-title">Генератор карточек</h1>
                    <p className="generator-subtitle">Создайте уникальные 5x5 билеты для участников</p>
                </div>

                <div className="generator-settings">
                    <div className="settings-left">
                        <div className="settings-header">
                            <h2 className="settings-title">Настройки генерации</h2>
                            <span className="settings-count">Количество карточек: {cardCount}</span>
                        </div>
                        <div className="settings-slider-wrapper">
                            <input
                                type="range"
                                className="range-slider"
                                min="1" max="50"
                                value={cardCount}
                                onChange={(e) => setCardCount(parseInt(e.target.value))}
                                style={{ background: `linear-gradient(to right, #2563EB ${(cardCount / 50) * 100}%, #E5E7EB ${(cardCount / 50) * 100}%)` }}
                            />
                        </div>
                        <button className="btn-select-songs" onClick={() => setIsSelectModalOpen(true)}>
                            <img src={SelectSongIcon} alt="Select" />
                            Выбрать песню из библиотеки
                        </button>
                    </div>

                    <div className="settings-middle">
                        <div className="settings-middle-val">{selectedSongs.length} песен выбрано</div>
                        <div className="settings-middle-desc">
                            {selectedSongs.length >= 25 ? 'Достаточно для 5x5' : 'Нужно минимум 25 для 5x5'}
                        </div>
                    </div>

                    <div className="settings-right">
                        <button className="btn-presentation" onClick={handleGoToPresentation}>Перейти к презентации</button>
                        <button
                            className="btn-generate"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            <img src={GenerateIcon} alt="Generate" />
                            {isGenerating ? 'Генерация...' : 'Сгенерировать'}
                        </button>
                    </div>
                </div>

                <div className="generator-settings" style={{ marginTop: '20px', padding: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#6B7280' }}>Название компании</label>
                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#6B7280' }}>Название издания</label>
                        <input type="text" value={editionName} onChange={e => setEditionName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#6B7280' }}>Главный заголовок</label>
                        <input type="text" value={titleText} onChange={e => setTitleText(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#6B7280' }}>Текст в подвале</label>
                        <input type="text" value={footerText} onChange={e => setFooterText(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                    </div>
                </div>


                <div className="preview-section">
                    <div className="preview-header">
                        <h2 className="preview-title">Предварительный просмотр</h2>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                        />
                        <button className="btn-load-bg" onClick={() => fileInputRef.current?.click()}>
                            <img src={LoadBgIcon} alt="Load" />
                            {backgroundImage ? 'Изменить фон' : 'Загрузить фон'}
                        </button>
                    </div>

                    <div className="preview-container">
                        <div className="pagination">
                            <button
                                className="btn-page"
                                disabled={currentCardIndex === 0}
                                onClick={() => setCurrentCardIndex(prev => prev - 1)}
                            >
                                &lt;
                            </button>
                            <span className="page-info">
                                {generatedCards.length > 0 ? currentCardIndex + 1 : 0} / {generatedCards.length}
                            </span>
                            <button
                                className="btn-page"
                                disabled={currentCardIndex >= generatedCards.length - 1}
                                onClick={() => setCurrentCardIndex(prev => prev + 1)}
                            >
                                &gt;
                            </button>
                        </div>

                        {currentCard ? (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext
                                    items={currentCard.cells.map(c => `${c.row}-${c.column}`)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="bingo-card" style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'transparent' } : {}}>
                                        {currentCard.cells.map(cell => {
                                            const song = selectedSongs.find(s => s.id === cell.songId);
                                            return <SortableCell key={`${cell.row}-${cell.column}`} cell={cell} song={song} />;
                                        })}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        ) : (
                            <div className="bingo-card" style={{ opacity: 0.5, borderStyle: 'dashed' }}>
                                {Array.from({ length: 25 }).map((_, i) => (
                                    <div key={i} className="bingo-cell" style={{ cursor: 'default' }}>
                                        <div className="cell-icon">...</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="preview-hint">Перетаскивайте ячейки для изменения порядка внутри карточки</div>

                        <button className="btn-download-pdf" disabled={generatedCards.length === 0} onClick={handleDownloadZip}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            Скачать архив PDF
                        </button>
                    </div>
                </div>

                <div className="generator-stats">
                    <div className="stat-box">
                        <div className="stat-box-val">{generatedCards.length > 0 ? generatedCards.length : '-'}</div>
                        <div className="stat-box-label">Всего карточек</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-box-val">25</div>
                        <div className="stat-box-label">Ячеек на карточке</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-box-val">
                            <img src={InfinityIcon} alt="infinity" />
                        </div>
                        <div className="stat-box-label">Все карточки уникальны</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-box-val">5×5</div>
                        <div className="stat-box-label">Размер сетки</div>
                    </div>
                </div>
            </main>

            <SelectSongsModal
                isOpen={isSelectModalOpen}
                onClose={() => setIsSelectModalOpen(false)}
                onSelect={(songs) => {
                    setSelectedSongs(songs);
                    localStorage.setItem('generatorSelectedSongIds', JSON.stringify(songs.map(s => s.id)));
                }}
                initialSelectedIds={selectedSongs.map(s => s.id)}
            />

            {isCreateModalOpen && (
                <CreateGameModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    songs={selectedSongs}
                    preGeneratedCards={generatedCards}
                    onGameCreated={(gameId) => {
                        setIsCreateModalOpen(false);
                        navigate(`/generator?sessionId=${gameId}`);
                    }}
                />
            )}
        </div>
    );
};

export default Generator;
