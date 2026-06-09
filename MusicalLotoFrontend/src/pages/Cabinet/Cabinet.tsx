import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import HeaderLibrary from '../../components/HeaderLibrary/HeaderLibrary';
import DialogModal from '../../components/DialogModal/DialogModal';
import SelectSongsModal from '../../components/SelectSongsModal/SelectSongsModal';
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
import './Cabinet.css';
import { apiFetch } from '../../utils/api';
import { PrintCard } from '../../components/PrintCard/PrintCard';
import { renderToStaticMarkup } from 'react-dom/server';
import printCardStyles from '../../components/PrintCard/PrintCard.css?inline';

const getBase64Image = async (url: string): Promise<string | null> => {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
};

import plusIcon from '../../assets/Cabinet/Плюсик из Создать игру.svg';
import noteIcon from '../../assets/Cabinet/Нота в кабинет.svg';
import totalGamesIcon from '../../assets/Cabinet/Иконка в Всего игр.svg';
import activePlayersIcon from '../../assets/Cabinet/Иконка в Активных игроков.svg';
import songsLibraryIcon from '../../assets/Cabinet/Иконка в Песен в библиотеке.svg';
import arrowIcon from '../../assets/Cabinet/Стрелка в Песен в библиотеке.svg';
import participantsIcon from '../../assets/Cabinet/Значок участников.svg';

import playBtn from '../../assets/SongLibrary/Кнопка Play.svg';
import editBtn from '../../assets/SongLibrary/Кнопка изменить.svg';
import deleteBtn from '../../assets/SongLibrary/Кнопка удалить.svg';

import horizontalIcon from '../../assets/Cabinet/Горизонталь.svg';
import verticalIcon from '../../assets/Cabinet/Вертикаль.svg';
import diagonalIcon from '../../assets/Cabinet/Диагональ.svg';

import LoadBgIcon from '../../assets/Generator/Иконка в кнопке Загрузить фон.svg';
import InfinityIcon from '../../assets/Generator/Значек во все карточки уникальны.svg';
import SelectSongsForCardBtn from '../../assets/Generator/Кнопка выбрать песни для карточки.svg';

interface Game {
    id: string;
    title: string;
    status: 'Active' | 'Completed';
    participants: number;
    date: string;
}

export interface Song {
    id: string;
    title: string;
    artist: string;
}

interface CardCellData {
    row: number;
    column: number;
    songId: string;
}

interface CardDto {
    id: string;
    cells: CardCellData[];
    cuteName?: string;
}

const SortableCell = ({ cell, song, isCenter, accentColor }: { cell: CardCellData; song?: Song; isCenter?: boolean; accentColor?: string }) => {
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
            {isCenter && (
                <>
                    {/* SVG Bows for the center gift cell */}
                    <svg className="corner-bow top-left" viewBox="0 0 100 100" style={{ stroke: accentColor }}><path d="M 50 50 C 20 20, 20 80, 50 50 C 80 20, 80 80, 50 50 M 50 50 L 30 90 M 50 50 L 70 90" fill="none" strokeWidth="8" strokeLinecap="round" /></svg>
                    <svg className="corner-bow top-right" viewBox="0 0 100 100" style={{ stroke: accentColor }}><path d="M 50 50 C 20 20, 20 80, 50 50 C 80 20, 80 80, 50 50 M 50 50 L 30 90 M 50 50 L 70 90" fill="none" strokeWidth="8" strokeLinecap="round" /></svg>
                    <svg className="corner-bow bottom-left" viewBox="0 0 100 100" style={{ stroke: accentColor }}><path d="M 50 50 C 20 20, 20 80, 50 50 C 80 20, 80 80, 50 50 M 50 50 L 30 90 M 50 50 L 70 90" fill="none" strokeWidth="8" strokeLinecap="round" /></svg>
                    <svg className="corner-bow bottom-right" viewBox="0 0 100 100" style={{ stroke: accentColor }}><path d="M 50 50 C 20 20, 20 80, 50 50 C 80 20, 80 80, 50 50 M 50 50 L 30 90 M 50 50 L 70 90" fill="none" strokeWidth="8" strokeLinecap="round" /></svg>
                </>
            )}
            <div className="cell-title" title={song ? `${song.artist} – ${song.title}` : 'Пустая ячейка'}>
                {song ? `${song.artist} – ${song.title}` : '...'}
            </div>
        </div>
    );
};

const Cabinet: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isCreatingGame, setIsCreatingGame] = useState<boolean>(searchParams.get('mode') === 'create');

    const [games, setGames] = useState<Game[]>([]);
    const [songs, setSongs] = useState<Song[]>([]);
    const [totalSongs, setTotalSongs] = useState<number>(0);
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [gameToDelete, setGameToDelete] = useState<string | null>(null);

    const clearCreationDraft = () => {
        localStorage.removeItem('creation_gameName');
        localStorage.removeItem('creation_cardSize');
        localStorage.removeItem('creation_participantsCount');
        localStorage.removeItem('creation_rules');
        localStorage.removeItem('creation_selectedSongs');
    };

    // --- CARD CREATION & GENERATION STATES ---
    const [gameName, setGameName] = useState<string>(() => localStorage.getItem('creation_gameName') || 'Новый год');
    const [cardSize, setCardSize] = useState<number>(() => Number(localStorage.getItem('creation_cardSize')) || 5);
    const [participantsCount, setParticipantsCount] = useState<number>(() => Number(localStorage.getItem('creation_participantsCount')) || 2);
    const [rules, setRules] = useState<number>(() => Number(localStorage.getItem('creation_rules')) || 0);

    // --- CARD CUSTOMIZATION STATES ---
    const [accentColor, setAccentColor] = useState<string>('#B21016');
    const [fontFamily, setFontFamily] = useState<string>('Playfair Display');
    const [companyName, setCompanyName] = useState<string>('66 Бит');
    const [editionName, setEditionName] = useState<string>('new year edition');
    const [titleText, setTitleText] = useState<string>('МУЗЫКАЛЬНОЕ ЛОТО');
    const [footerText, setFooterText] = useState<string>('год был трындец, а ты молодец');

    const [selectedSongs, setSelectedSongs] = useState<Song[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('creation_selectedSongs') || '[]');
        } catch {
            return [];
        }
    });
    const [isSelectModalOpen, setIsSelectModalOpen] = useState<boolean>(false);

    // Save inputs to localStorage to preserve state on page reload
    useEffect(() => {
        if (isCreatingGame) {
            localStorage.setItem('creation_gameName', gameName);
            localStorage.setItem('creation_cardSize', cardSize.toString());
            localStorage.setItem('creation_participantsCount', participantsCount.toString());
            localStorage.setItem('creation_rules', rules.toString());
            localStorage.setItem('creation_selectedSongs', JSON.stringify(selectedSongs));
        }
    }, [isCreatingGame, gameName, cardSize, participantsCount, rules, selectedSongs]);

    const [generatedCards, setGeneratedCards] = useState<CardDto[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isDownloadingArchive, setIsDownloadingArchive] = useState<boolean>(false);
    const [isDownloadingSingle, setIsDownloadingSingle] = useState<boolean>(false);

    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<string>('');

    // --- DND-KIT SENSORS ---
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const totalGames = games.length;
    const activeGamesCount = games.filter(g => g.status === 'Active').length;

    const fetchGames = async () => {
        try {
            const response = await apiFetch('/api/Games');
            if (response.ok) {
                const data = await response.json();
                const mappedGames = data.map((g: any) => ({
                    id: g.id,
                    title: g.name,
                    status: g.isFullCardClaimed ? 'Completed' : 'Active',
                    participants: g.participantCount,
                    date: g.createdAt ? new Date(g.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
                }));
                setGames(mappedGames);
            }
        } catch (error) {
            console.error("Ошибка при получении игр:", error);
        }
    };

    useEffect(() => {
        fetchGames();

        const fetchSongs = async () => {
            try {
                const response = await apiFetch('/api/Songs');
                if (response.ok) {
                    const data = await response.json();
                    setSongs(data || []);
                    setTotalSongs(data.length || 0);
                }
            } catch (error) {
                console.error("Ошибка при получении песен:", error);
            }
        };

        fetchSongs();
    }, []);

    // Sync mode parameter with router query string
    useEffect(() => {
        const mode = searchParams.get('mode');
        setIsCreatingGame(mode === 'create');
    }, [searchParams]);


    // Automatically generate cards when inputs change
    useEffect(() => {
        if (isCreatingGame && selectedSongs.length >= cardSize * cardSize && participantsCount > 0) {
            const timer = setTimeout(() => {
                handleGenerate();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isCreatingGame, participantsCount, cardSize, selectedSongs]);

    const handleDeleteGame = (id: string) => {
        setGameToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDeleteGame = async () => {
        if (gameToDelete) {
            try {
                const response = await apiFetch(`/api/Games/${gameToDelete}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    setGames(games.filter(g => g.id !== gameToDelete));
                } else {
                    console.error('Ошибка сервера при удалении игры');
                }
            } catch (error) {
                console.error('Ошибка при удалении игры:', error);
            }
            setGameToDelete(null);
        }
        setIsConfirmOpen(false);
    };

    const handleRemoveSong = (songId: string) => {
        const nextSongs = selectedSongs.filter(s => s.id !== songId);
        setSelectedSongs(nextSongs);
        localStorage.setItem('generatorSelectedSongIds', JSON.stringify(nextSongs.map(s => s.id)));
    };

    const toggleRule = (rule: number) => {
        if ((rules & rule) === rule) {
            setRules(rules & ~rule);
        } else {
            setRules(rules | rule);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBackgroundImage(url);
        }
    };

    const handleGenerate = async () => {
        const minRequired = cardSize * cardSize;
        if (selectedSongs.length < minRequired) {
            return;
        }

        setIsGenerating(true);
        try {
            const response = await apiFetch('/api/Cards/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    count: participantsCount,
                    cardSize: cardSize,
                    songIds: selectedSongs.map(s => s.id)
                })
            });

            if (response.ok) {
                const data = await response.json();
                setGeneratedCards(data);
                setCurrentCardIndex(0);
            } else {
                const err = await response.text();
                console.error('Ошибка автоматической генерации карточек:', err);
            }
        } catch (error) {
            console.error('Не удалось автоматически сгенерировать карточки:', error);
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

    const handleDownloadZip = async () => {
        if (generatedCards.length === 0) return;
        setIsDownloadingArchive(true);

        const formData = new FormData();
        
        let bgBase64 = null;
        if (backgroundImage) {
            bgBase64 = await getBase64Image(backgroundImage);
        }

        const htmlData = generatedCards.map((card, i) => {
            const cardMarkup = renderToStaticMarkup(
                <PrintCard
                    card={card}
                    cardSize={cardSize}
                    selectedSongs={selectedSongs}
                    rules={rules}
                    accentColor={accentColor}
                    fontFamily={fontFamily}
                    companyName={companyName}
                    editionName={editionName}
                    titleText={titleText}
                    footerText={footerText}
                    backgroundImage={bgBase64}
                />
            );
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${printCardStyles} body { margin: 0; padding: 0; overflow: hidden; } .print-card-container { margin: 0 !important; max-width: none !important; width: 793px !important; height: 560px !important; border-radius: 0 !important; box-shadow: none !important; }</style></head><body><div>${cardMarkup}</div></body></html>`;
            return { html, cuteName: card.cuteName || String(i + 1) };
        });

        formData.append('htmlCards', JSON.stringify(htmlData));
        formData.append('isSingle', 'false');

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
            a.download = 'КарточныйАрхив.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download archive:', error);
            alert('Ошибка при скачивании архива. Возможно, файл слишком большой.');
        } finally {
            setIsDownloadingArchive(false);
        }
    };

    const handleDownloadSingle = async () => {
        if (!currentCard) return;
        setIsDownloadingSingle(true);

        const formData = new FormData();

        let bgBase64 = null;
        if (backgroundImage) {
            bgBase64 = await getBase64Image(backgroundImage);
        }

        const cardMarkup = renderToStaticMarkup(
            <PrintCard
                card={currentCard}
                cardSize={cardSize}
                selectedSongs={selectedSongs}
                rules={rules}
                accentColor={accentColor}
                fontFamily={fontFamily}
                companyName={companyName}
                editionName={editionName}
                titleText={titleText}
                footerText={footerText}
                backgroundImage={bgBase64}
            />
        );

        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${printCardStyles} body { margin: 0; padding: 0; overflow: hidden; } .print-card-container { margin: 0 !important; max-width: none !important; width: 793px !important; height: 560px !important; border-radius: 0 !important; box-shadow: none !important; }</style></head><body><div>${cardMarkup}</div></body></html>`;

        const htmlData = [{ html: fullHtml, cuteName: currentCard.cuteName || String(currentCardIndex + 1) }];

        formData.append('htmlCards', JSON.stringify(htmlData));
        formData.append('isSingle', 'true');

        try {
            const response = await apiFetch('/api/Pdf/generateSingle', {
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
            a.download = `Карточка ${currentCard.cuteName || (currentCardIndex + 1)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download single card:', error);
            alert('Ошибка при скачивании карточки.');
        } finally {
            setIsDownloadingSingle(false);
        }
    };

    const handleCreateGame = async () => {
        if (!gameName) {
            setAlertMessage("Введите название игры");
            setIsAlertOpen(true);
            return;
        }
        if (participantsCount < 1) {
            setAlertMessage("Введите корректное количество участников");
            setIsAlertOpen(true);
            return;
        }
        if (cardSize < 3 || cardSize > 7) {
            setAlertMessage("Размер карточки должен быть от 3 до 7");
            setIsAlertOpen(true);
            return;
        }
        if (rules === 0) {
            setAlertMessage("Выберите хотя бы одно правило победы");
            setIsAlertOpen(true);
            return;
        }

        const requiredSongs = cardSize * cardSize + participantsCount;
        if (selectedSongs.length < requiredSongs) {
            setAlertMessage(`Выбранного пула песен недостаточно. Нужно минимум ${requiredSongs} (выбрано: ${selectedSongs.length}).`);
            setIsAlertOpen(true);
            return;
        }

        try {
            const response = await apiFetch('/api/Games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: gameName,
                    participantsCount: participantsCount,
                    cardSize: cardSize,
                    rules: rules,
                    selectedSongIds: selectedSongs.map(s => s.id),
                    preGeneratedCards: generatedCards.length > 0 ? generatedCards : null
                })
            });

            if (response.ok) {
                clearCreationDraft();
                const data = await response.json();
                const gameId = data.id || data.Id;
                navigate(`/presentation?sessionId=${gameId}`);
            } else {
                const text = await response.text();
                setAlertMessage(text || "Произошла ошибка при создании игры");
                setIsAlertOpen(true);
            }
        } catch (err: any) {
            setAlertMessage(err.message || "Ошибка соединения с сервером");
            setIsAlertOpen(true);
        }
    };

    const currentCard = generatedCards[currentCardIndex];

    return (
        <div className="cabinet-wrapper">
            <HeaderLibrary />

            <main className="container cabinet-main">
                {isCreatingGame ? (
                    <div className="create-card-view">
                        <div className="cabinet-breadcrumbs">
                            <span className="breadcrumb-link" onClick={() => {
                                clearCreationDraft();
                                setIsCreatingGame(false);
                                setSearchParams({});
                            }}>Личный кабинет</span>
                            <img src={arrowIcon} alt=">" className="breadcrumb-separator-img" />
                            <span className="breadcrumb-current">Создание карточки</span>
                        </div>

                        <h1 className="cabinet-heading card-creation-heading">Создание карточки</h1>

                        {/* Section 1: Создание новой игры */}
                        <div className="creation-section-card">
                            <h2 className="section-card-title">Создание новой игры</h2>

                            <div className="creation-form-grid">
                                <div className="creation-field">
                                    <label>Название игры <span className="req">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Новый год"
                                        value={gameName}
                                        onChange={e => setGameName(e.target.value)}
                                    />
                                </div>
                                <div className="creation-field">
                                    <label>Размер карточки (N x N) <span className="req">*</span></label>
                                    <input
                                        type="number"
                                        placeholder="5"
                                        value={cardSize}
                                        onChange={e => setCardSize(Math.max(3, Math.min(7, parseInt(e.target.value) || 3)))}
                                    />
                                    <span className="field-hint">Например, 5</span>
                                </div>
                                <div className="creation-field">
                                    <label>Количество участников <span className="req">*</span></label>
                                    <input
                                        type="number"
                                        placeholder="2"
                                        value={participantsCount}
                                        onChange={e => setParticipantsCount(Math.max(1, parseInt(e.target.value) || 1))}
                                    />
                                </div>
                            </div>

                            <div className="creation-rules-section">
                                <label className="rules-section-label">Правила победы <span className="req">*</span></label>
                                <div className="rules-cards-grid">
                                    <div className={`rule-card ${(rules & 1) ? 'active' : ''}`} onClick={() => toggleRule(1)}>
                                        <div className="rule-blueprint">
                                            <img src={horizontalIcon} alt="Горизонталь" />
                                        </div>
                                        <span className="rule-card-label">Горизонталь</span>
                                    </div>
                                    <div className={`rule-card ${(rules & 2) ? 'active' : ''}`} onClick={() => toggleRule(2)}>
                                        <div className="rule-blueprint">
                                            <img src={verticalIcon} alt="Вертикаль" />
                                        </div>
                                        <span className="rule-card-label">Вертикаль</span>
                                    </div>
                                    <div className={`rule-card ${(rules & 8) ? 'active' : ''}`} onClick={() => toggleRule(8)}>
                                        <div className="rule-blueprint">
                                            <img src={diagonalIcon} alt="Диагональ" />
                                        </div>
                                        <span className="rule-card-label">Диагональ</span>
                                    </div>
                                </div>
                            </div>

                            {selectedSongs.length === 0 && (
                                <div className="select-songs-btn-wrapper">
                                    <button className="btn-select-songs-for-card" onClick={() => setIsSelectModalOpen(true)}>
                                        <img src={SelectSongsForCardBtn} alt="Выбрать песни для карточки" />
                                    </button>
                                </div>
                            )}

                            {/* Songs Selection Pool status */}
                            {selectedSongs.length > 0 && (
                                <>
                                    {songs.length === 0 ? (
                                        <div className="songs-pool-status warning" style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }}>
                                            <div className="status-icon">
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <circle cx="10" cy="10" r="9" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                                                    <path d="M10 6v5M10 14h.01" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <div className="status-text">
                                                <strong>В вашей библиотеке пока нет песен</strong>
                                                <span>Пожалуйста, добавьте песни в библиотеку, чтобы настроить игру</span>
                                            </div>
                                        </div>
                                    ) : selectedSongs.length >= cardSize * cardSize + participantsCount ? (
                                        <div className="songs-pool-status success">
                                            <div className="status-icon">
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <circle cx="10" cy="10" r="9" fill="#D1FAE5" stroke="#10B981" strokeWidth="2" />
                                                    <path d="M6 10l3 3 5-5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <div className="status-text">
                                                <strong>Выбрано {selectedSongs.length} песен</strong>
                                                <span>Достаточно для карточек и {participantsCount} участников (минимум {cardSize * cardSize + participantsCount})</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="songs-pool-status warning">
                                            <div className="status-icon">
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <circle cx="10" cy="10" r="9" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                                                    <path d="M10 6v5M10 14h.01" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <div className="status-text">
                                                <strong>Выбрано {selectedSongs.length} песен</strong>
                                                <span>Нужно минимум {cardSize * cardSize + participantsCount} для {cardSize}x{cardSize} с {participantsCount} участниками.</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Selected song list (matching mockup: 5 items + "Посмотреть все") */}
                                    <div className="selected-songs-pool">
                                        <div className="selected-songs-list">
                                            {selectedSongs.slice(0, 5).map(song => (
                                                <div className="song-thumbnail-card" key={song.id}>
                                                    <div className="song-thumb-icon">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E68F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M9 18V5l12-2v13"></path>
                                                            <circle cx="6" cy="18" r="3"></circle>
                                                            <circle cx="18" cy="16" r="3"></circle>
                                                        </svg>
                                                    </div>
                                                    <div className="song-thumb-info">
                                                        <div className="song-thumb-title" title={song.title}>{song.title}</div>
                                                        <div className="song-thumb-artist" title={song.artist}>{song.artist}</div>
                                                    </div>
                                                    <button className="song-thumb-remove" onClick={() => handleRemoveSong(song.id)}>&times;</button>
                                                </div>
                                            ))}
                                            <button className="btn-view-all-songs" onClick={() => setIsSelectModalOpen(true)}>
                                                Посмотреть все
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Section 2: Генератор карточек */}
                        <div className="creation-section-card mt-32">
                            <div className="generator-section-header">
                                <div>
                                    <h2 className="section-card-title">Генератор карточек</h2>
                                    <p className="section-card-subtitle">Создайте уникальные {cardSize}x{cardSize} билеты для участников</p>
                                </div>
                                <button className="btn-random-order" onClick={handleGenerate} disabled={isGenerating || selectedSongs.length < cardSize * cardSize}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isGenerating ? 'spin' : ''}>
                                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                                    </svg>
                                    <span>Случайный порядок песен</span>
                                </button>
                            </div>

                            {/* Ticket Appearance Live Customizer Toolbar */}
                            <div className="card-customizer-toolbar" style={{ marginBottom: '30px', padding: '24px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
                                <h3 className="customizer-toolbar-title" style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginTop: 0, marginBottom: '20px' }}>Настройка внешнего вида билета</h3>
                                <div className="customizer-fields-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div className="customizer-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Шрифт заголовка</label>
                                        <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} style={{ height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#FFFFFF', outline: 'none' }}>
                                            <option value="Playfair Display">Serif (Playfair Display)</option>
                                            <option value="Montserrat">Sans-Serif (Montserrat)</option>
                                            <option value="Inter">Classic (Inter)</option>
                                            <option value="Roboto">Modern (Roboto)</option>
                                            <option value="Oswald">Bold (Oswald)</option>
                                            <option value="Caveat">Handwriting (Caveat)</option>
                                            <option value="Pacifico">Cursive (Pacifico)</option>
                                            <option value="Comfortaa">Rounded (Comfortaa)</option>
                                            <option value="Courier New">Monospace (Courier)</option>
                                            <option value="Georgia">Elegant (Georgia)</option>
                                        </select>
                                    </div>
                                    <div className="customizer-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Акцентный цвет</label>
                                        <div className="color-picker-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#FFFFFF', padding: '0 8px', cursor: 'text' }} onClick={() => document.getElementById('hex-color-input')?.focus()}>
                                            <input 
                                                type="color" 
                                                value={accentColor.startsWith('#') && (accentColor.length === 7 || accentColor.length === 4) ? accentColor : '#000000'} 
                                                onChange={e => setAccentColor(e.target.value)} 
                                                list="presetColors"
                                                style={{ width: '24px', height: '24px', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0, backgroundColor: 'transparent' }} 
                                            />
                                            <datalist id="presetColors">
                                                <option value="#B21016" />
                                                <option value="#2563EB" />
                                                <option value="#10B981" />
                                                <option value="#F59E0B" />
                                                <option value="#8B5CF6" />
                                                <option value="#EC4899" />
                                                <option value="#0F172A" />
                                                <option value="#14B8A6" />
                                                <option value="#EAB308" />
                                                <option value="#F43F5E" />
                                            </datalist>
                                            <input 
                                                id="hex-color-input"
                                                type="text" 
                                                value={accentColor} 
                                                onChange={e => {
                                                    let val = e.target.value;
                                                    if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                                                    setAccentColor(val);
                                                }} 
                                                placeholder="#HEX"
                                                maxLength={7}
                                                style={{ border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'monospace', fontWeight: '600', color: '#1E293B', width: '100%', background: 'transparent' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="customizer-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Название компании</label>
                                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="66 Бит" style={{ height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none' }} />
                                    </div>
                                    <div className="customizer-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Название издания</label>
                                        <input type="text" value={editionName} onChange={e => setEditionName(e.target.value)} placeholder="new year edition" style={{ height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none' }} />
                                    </div>
                                    <div className="customizer-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Главный заголовок</label>
                                        <input type="text" value={titleText} onChange={e => setTitleText(e.target.value)} placeholder="МУЗЫКАЛЬНОЕ ЛОТО" style={{ height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none' }} />
                                    </div>
                                    <div className="customizer-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Текст в подвале</label>
                                        <input type="text" value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="год был трындец, а ты молодец" style={{ height: '40px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '8px', outline: 'none' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="preview-subsection">
                                <div className="preview-subheader">
                                    <h3 className="preview-title">Предварительный просмотр</h3>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                    />
                                    <button className="btn-load-bg" onClick={() => fileInputRef.current?.click()}>
                                        <img src={LoadBgIcon} alt="Load" />
                                        <span>Загрузить фон</span>
                                    </button>
                                </div>

                                <div className="preview-workspace">
                                    <div className="pagination">
                                        <button
                                            className="btn-page"
                                            disabled={currentCardIndex === 0 || generatedCards.length === 0}
                                            onClick={() => setCurrentCardIndex(prev => prev - 1)}
                                        >
                                            &lt;
                                        </button>
                                        <span className="page-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                            {generatedCards.length > 0 ? `${currentCardIndex + 1} / ${generatedCards.length}` : '0 / 0'}
                                            {currentCard && (
                                                <>
                                                    <span> — </span>
                                                    <input
                                                        type="text"
                                                        value={currentCard.cuteName || ''}
                                                        placeholder="Назовите карточку..."
                                                        onChange={(e) => {
                                                            const newName = e.target.value;
                                                            setGeneratedCards(prev => {
                                                                const copy = [...prev];
                                                                copy[currentCardIndex] = {
                                                                    ...copy[currentCardIndex],
                                                                    cuteName: newName
                                                                };
                                                                return copy;
                                                            });
                                                        }}
                                                        style={{
                                                            border: '1px solid #CBD5E1',
                                                            borderRadius: '8px',
                                                            padding: '4px 12px',
                                                            fontSize: '14px',
                                                            color: '#1E293B',
                                                            backgroundColor: '#FFFFFF',
                                                            outline: 'none',
                                                            width: '180px',
                                                            fontWeight: '600'
                                                        }}
                                                    />
                                                </>
                                            )}
                                        </span>
                                        <button
                                            className="btn-page"
                                            disabled={currentCardIndex >= generatedCards.length - 1 || generatedCards.length === 0}
                                            onClick={() => setCurrentCardIndex(prev => prev + 1)}
                                        >
                                            &gt;
                                        </button>
                                    </div>

                                    {currentCard ? (
                                        <PrintCard
                                            card={currentCard}
                                            cardSize={cardSize}
                                            selectedSongs={selectedSongs}
                                            rules={rules}
                                            accentColor={accentColor}
                                            fontFamily={fontFamily}
                                            companyName={companyName}
                                            editionName={editionName}
                                            titleText={titleText}
                                            footerText={footerText}
                                            backgroundImage={backgroundImage}
                                            renderGridWrapper={(grid) => (
                                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                                    <SortableContext items={currentCard.cells.map(c => `${c.row}-${c.column}`)} strategy={rectSortingStrategy}>
                                                        {grid}
                                                    </SortableContext>
                                                </DndContext>
                                            )}
                                            renderCell={(cell) => {
                                                const song = selectedSongs.find(s => s.id === cell.songId);
                                                const centerIndex = Math.floor(cardSize / 2);
                                                const isCenter = cardSize % 2 !== 0 && cell.row === centerIndex && cell.column === centerIndex;
                                                return (
                                                    <SortableCell
                                                        key={`${cell.row}-${cell.column}`}
                                                        cell={cell}
                                                        song={song}
                                                        isCenter={isCenter}
                                                        accentColor={accentColor}
                                                    />
                                                );
                                            }}
                                        />
                                    ) : (
                                        <PrintCard
                                            card={null}
                                            cardSize={cardSize}
                                            selectedSongs={[]}
                                            rules={0}
                                            accentColor={accentColor}
                                            fontFamily={fontFamily}
                                            companyName={companyName}
                                            editionName={editionName}
                                            titleText={titleText}
                                            footerText={footerText}
                                        />
                                    )}

                                    <div className="drag-hint">Перетаскивайте ячейки для изменения порядка внутри карточки</div>

                                    <div className="presentation-btn-wrapper" style={{ gap: '16px', flexWrap: 'wrap' }}>
                                        <button className="btn-load-bg" onClick={handleDownloadSingle} disabled={generatedCards.length === 0 || isDownloadingSingle || isDownloadingArchive} style={{ borderStyle: 'solid', background: 'transparent', height: '52px' }}>
                                            <span>{isDownloadingSingle ? 'Генерация карточки' : 'Скачать эту карточку PDF'}</span>
                                        </button>
                                        <button className="btn-load-bg" onClick={handleDownloadZip} disabled={generatedCards.length === 0 || isDownloadingSingle || isDownloadingArchive} style={{ borderStyle: 'solid', background: 'transparent', height: '52px' }}>
                                            <span>{isDownloadingArchive ? 'Генерация архива' : 'Скачать весь архив PDF'}</span>
                                        </button>
                                        <button className="btn-launch-presentation" onClick={handleCreateGame}>
                                            <span>Перейти к презентации</span>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Stats Row */}
                        <div className="creation-stats-grid">
                            <div className="creation-stat-box">
                                <div className="creation-stat-val">{generatedCards.length || 0}</div>
                                <div className="creation-stat-label">Всего карточек</div>
                            </div>
                            <div className="creation-stat-box">
                                <div className="creation-stat-val">{cardSize * cardSize}</div>
                                <div className="creation-stat-label">Ячеек на карточке</div>
                            </div>
                            <div className="creation-stat-box">
                                <div className="creation-stat-val">
                                    <img src={InfinityIcon} alt="∞" className="infinity-stat-icon" />
                                </div>
                                <div className="creation-stat-label">Все карточки уникальны</div>
                            </div>
                            <div className="creation-stat-box">
                                <div className="creation-stat-val">{cardSize}×{cardSize}</div>
                                <div className="creation-stat-label">Размер сетки</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="cabinet-card">
                        <div className="cabinet-header-section">
                            <div>
                                <h1 className="cabinet-heading">Личный кабинет</h1>
                                <p className="cabinet-subtitle">Управляйте играми, карточками и музыкальной библиотекой</p>
                            </div>
                            <button className="create-game-btn" onClick={() => {
                                clearCreationDraft();
                                setGameName('Новый год');
                                setCardSize(5);
                                setParticipantsCount(2);
                                setRules(0);
                                setSelectedSongs([]);
                                setIsCreatingGame(true);
                                setSearchParams({ mode: 'create' });
                            }}>
                                <img src={plusIcon} alt="+" className="create-game-plus-icon" />
                                <span>Создать игру</span>
                            </button>
                        </div>

                        <div className="cabinet-stats-grid">
                            <div className="stat-card total-games-card">
                                <div className="stat-icon-wrapper">
                                    <img src={totalGamesIcon} alt="Всего игр" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{totalGames}</div>
                                    <div className="stat-label">Всего игр</div>
                                </div>
                            </div>

                            <div className="stat-card active-games-card">
                                <div className="stat-icon-wrapper">
                                    <img src={activePlayersIcon} alt="Активных игр" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{activeGamesCount}</div>
                                    <div className="stat-label">Активных игр</div>
                                </div>
                            </div>

                            <div className="stat-card songs-card">
                                <div className="stat-icon-wrapper">
                                    <img src={songsLibraryIcon} alt="Песен в библиотеке" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{totalSongs}</div>
                                    <div className="stat-label">Песен в библиотеке</div>
                                </div>
                                <button className="songs-library-link-btn" onClick={() => navigate('/library')} title="Перейти в библиотеку">
                                    <img src={arrowIcon} alt="Перейти в библиотеку" />
                                </button>
                            </div>
                        </div>

                        <div className="cabinet-games-section">
                            <h2 className="games-heading">Ваши игры</h2>
                            <div className="games-list">
                                {games.length === 0 ? (
                                    <div className="game-row">
                                        <div className="game-empty">У вас пока нет игр. Создайте свою первую игру!</div>
                                    </div>
                                ) : (
                                    games.map((game) => (
                                        <div className="game-row" key={game.id}>
                                            <div className="game-info-col">
                                                <div className="game-icon-placeholder">
                                                    <img src={noteIcon} alt="Game Icon" />
                                                </div>
                                                <div className="game-details">
                                                    <div className="game-title-row">
                                                        <span className="cabinet-game-title">{game.title}</span>
                                                        <span className={`game-badge ${game.status === 'Active' ? 'badge-active' : 'badge-completed'}`}>
                                                            {game.status === 'Active' ? 'Активная' : 'Завершённая'}
                                                        </span>
                                                    </div>
                                                    <div className="game-meta">
                                                        <span>
                                                            <img src={participantsIcon} alt="Участники" style={{ width: '12.45px', height: '12.45px', marginRight: '6px' }} />
                                                            {game.participants} участников
                                                        </span>
                                                        <span>
                                                            <svg width="12.45" height="12.45" viewBox="0 0 12.45 12.45" fill="none" style={{ marginRight: '6px' }}>
                                                                <rect x="1.5" y="2.5" width="9.45" height="8.45" rx="1.5" stroke="#64748B" strokeWidth="1.03722" />
                                                                <path d="M3.5 1.5v2M8.9 1.5v2M1.5 5.5h9.45" stroke="#64748B" strokeWidth="1.03722" strokeLinecap="round" />
                                                            </svg>
                                                            {game.date}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="game-actions-col">
                                                {game.status === 'Active' ? (
                                                    <button className="play-game-btn" onClick={() => navigate(`/gameplay?sessionId=${game.id}`)} title="Играть">
                                                        <img src={playBtn} alt="Играть" />
                                                    </button>
                                                ) : (
                                                    <button className="play-game-btn completed-view-btn" onClick={() => navigate(`/gameplay?sessionId=${game.id}&preview=true`)} title="Просмотр">
                                                        <img src={playBtn} alt="Просмотр" />
                                                    </button>
                                                )}
                                                <button className="edit-game-btn" onClick={() => navigate(`/presentation?sessionId=${game.id}`)} title="Редактировать презентацию">
                                                    <img src={editBtn} alt="Редактировать" />
                                                </button>
                                                <button className="delete-game-btn" onClick={() => handleDeleteGame(game.id)} title="Удалить">
                                                    <img src={deleteBtn} alt="Удалить" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {isSelectModalOpen && (
                <SelectSongsModal
                    isOpen={isSelectModalOpen}
                    onClose={() => setIsSelectModalOpen(false)}
                    onSelect={(songs) => {
                        setSelectedSongs(songs);
                        localStorage.setItem('generatorSelectedSongIds', JSON.stringify(songs.map(s => s.id)));
                    }}
                    initialSelectedIds={selectedSongs.map(s => s.id)}
                    minRequired={cardSize * cardSize + participantsCount}
                />
            )}

            <DialogModal
                isOpen={isConfirmOpen}
                title="Удаление игры"
                message="Вы уверены, что хотите удалить эту игру?"
                isDanger={true}
                confirmText="Удалить"
                onConfirm={confirmDeleteGame}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setGameToDelete(null);
                }}
            />

            <DialogModal
                isOpen={isAlertOpen}
                title="Уведомление"
                message={alertMessage}
                isAlert={true}
                onConfirm={() => setIsAlertOpen(false)}
                onCancel={() => setIsAlertOpen(false)}
            />
        </div>
    );
};

export default Cabinet;
