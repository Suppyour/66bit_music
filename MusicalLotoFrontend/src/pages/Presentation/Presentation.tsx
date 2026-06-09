import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
    verticalListSortingStrategy,
    useSortable,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import HeaderLibrary from '../../components/HeaderLibrary/HeaderLibrary';
import EditSlideModal from '../../components/EditSlideModal/EditSlideModal';
import type { Slide } from '../../components/EditSlideModal/EditSlideModal';
import './Presentation.css';
import { apiFetch } from '../../utils/api';
import PlayIcon from '../../assets/Presentation/Иконка в кнопке запустить.svg';
import PreviewIcon from '../../assets/Presentation/Иконка в кнопке предпросмотр.svg';
import arrowIcon from '../../assets/Cabinet/Стрелка в Песен в библиотеке.svg';
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

interface SortableSlideItemProps {
    slide: Slide;
    index: number;
    onEdit: (slide: Slide) => void;
    onDelete: (id: string) => void;
}

const SortableSlideItem: React.FC<SortableSlideItemProps> = ({ slide, index, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 100 : 1,
    };

    // Safe conversion of slide.type from number to string representation
    const slideTypeStr = typeof slide.type === 'number'
        ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][slide.type] || 'Title'
        : String(slide.type);

    const getSlideTypeName = (type: string) => {
        switch (type) {
            case 'Title': return 'Титульный слайд';
            case 'Rules': return 'Правила игры';
            case 'GameBoard': return 'Игровое поле';
            case 'QrCode': return 'QR-код для входа';
            case 'Song': return 'Слайд песни';
            case 'Winner': return 'Слайд победителя';
            default: return 'Слайд';
        }
    };

    const renderIcon = (type: string) => {
        switch (type) {
            case 'Title': return '📺';
            case 'Rules': return '📜';
            case 'GameBoard': return '🎮';
            case 'QrCode': return '📱';
            case 'Song': return '🎵';
            case 'Winner': return '🏆';
            default: return '📄';
        }
    };

    return (
        <div ref={setNodeRef} style={style} className={`slide-item ${isDragging ? 'dragging' : ''}`}>
            <div className="slide-drag-handle" {...attributes} {...listeners}>
                <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="4" cy="4" r="2" fill="#D1D5DB" />
                    <circle cx="4" cy="12" r="2" fill="#D1D5DB" />
                    <circle cx="4" cy="20" r="2" fill="#D1D5DB" />
                    <circle cx="12" cy="4" r="2" fill="#D1D5DB" />
                    <circle cx="12" cy="12" r="2" fill="#D1D5DB" />
                    <circle cx="12" cy="20" r="2" fill="#D1D5DB" />
                </svg>
            </div>

            <div className={`slide-icon-box type-${slideTypeStr.toLowerCase()}`}>
                <span style={{ fontSize: '20px' }}>{renderIcon(slideTypeStr)}</span>
            </div>

            <div className="slide-texts">
                <div className="slide-header-text">
                    <span className="slide-number">Слайд {index + 1}</span>
                </div>
                <div className="slide-main-title">{slide.title || getSlideTypeName(slideTypeStr)}</div>
                <div className="slide-subtitle">
                    {slideTypeStr === 'Song'
                        ? (slide.content || 'Исполнитель не указан')
                        : (slide.content ? (slide.content.length > 80 ? slide.content.substring(0, 80) + '...' : slide.content) : 'Нет дополнительного контента')}
                </div>
            </div>

            <button type="button" className="btn-edit-slide" onClick={() => onEdit(slide)} title="Редактировать слайд">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>

            <button type="button" className="btn-delete-slide" onClick={() => onDelete(slide.id)} title="Удалить слайд">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        </div>
    );
};

const Presentation: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [gameName, setGameName] = useState('Презентация');
    const [slides, setSlides] = useState<Slide[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Initial setup and fetching
    useEffect(() => {
        const initializePresentation = async () => {
            setIsLoading(true);
            let activeSessionId = searchParams.get('sessionId');

            if (!activeSessionId) {
                // Fallback to localStorage or fetch latest session from API
                activeSessionId = localStorage.getItem('currentGameSessionId');

                if (!activeSessionId) {
                    try {
                        const response = await apiFetch('/api/Games');
                        if (response.ok) {
                            const data = await response.json();
                            if (data && data.length > 0) {
                                activeSessionId = data[0].id;
                                localStorage.setItem('currentGameSessionId', activeSessionId!);
                            }
                        }
                    } catch (error) {
                        console.error('Ошибка получения сессий игр:', error);
                    }
                }
            } else {
                localStorage.setItem('currentGameSessionId', activeSessionId);
            }

            if (activeSessionId) {
                setSessionId(activeSessionId);
                await fetchPresentationDetails(activeSessionId);
            } else {
                setIsLoading(false);
            }
        };

        initializePresentation();
    }, [searchParams]);

    const fetchPresentationDetails = async (sid: string) => {
        try {
            const response = await apiFetch(`/api/Games/${sid}/presentation`);
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

                // Find Game Title safely
                const titleSlide = slidesList.find((s: Slide) => {
                    const typeStr = typeof s.type === 'number'
                        ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][s.type]
                        : String(s.type);
                    return typeStr === 'Title';
                });

                if (titleSlide && titleSlide.title) {
                    setGameName(titleSlide.title);
                }
            } else {
                console.error('Ошибка при загрузке слайдов презентации');
            }
        } catch (error) {
            console.error('Ошибка загрузки презентации:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Предотвращает ложное срабатывание DnD при простом клике
            },
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = slides.findIndex((s) => s.id === active.id);
        const newIndex = slides.findIndex((s) => s.id === over.id);

        const newSlides = arrayMove(slides, oldIndex, newIndex).map((slide, idx) => ({
            ...slide,
            order: idx + 1
        }));

        setSlides(newSlides);

        // Save reordered slides to backend
        if (sessionId) {
            try {
                await apiFetch(`/api/Games/${sessionId}/presentation`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slides: newSlides })
                });
            } catch (error) {
                console.error('Ошибка сохранения порядка слайдов:', error);
            }
        }
    };

    const handleAddSlideClick = async () => {
        const newSlide: Slide = {
            id: generateUUID(),
            type: 'Title',
            title: 'Новый слайд',
            content: 'Введите текст на слайде...',
            backgroundColor: '#1E293B',
            order: slides.length + 1,
            isRequired: false
        };

        const newSlides = [...slides, newSlide].map((s, idx) => ({
            ...s,
            order: idx + 1
        }));

        setSlides(newSlides);
        setSelectedSlide(newSlide);
        setIsEditModalOpen(true);

        if (sessionId) {
            try {
                const response = await apiFetch(`/api/Games/${sessionId}/presentation`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slides: newSlides })
                });

                if (!response.ok) {
                    alert('Не удалось сохранить новый слайд на сервере');
                }
            } catch (error) {
                console.error('Ошибка сохранения нового слайда:', error);
                alert('Ошибка сети при сохранении нового слайда');
            }
        }
    };

    const handleEditSlideClick = (slide: Slide) => {
        setSelectedSlide(slide);
        setIsEditModalOpen(true);
    };

    const handleSaveSlide = async (updatedSlide: Slide) => {
        const newSlides = slides.map((s) => (s.id === updatedSlide.id ? updatedSlide : s));
        setSlides(newSlides);

        if (updatedSlide.type === 'Title' && updatedSlide.title) {
            setGameName(updatedSlide.title);
        }

        setIsEditModalOpen(false);

        // Persist slide updates to server
        if (sessionId) {
            try {
                const response = await apiFetch(`/api/Games/${sessionId}/presentation`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slides: newSlides })
                });

                if (!response.ok) {
                    alert('Не удалось сохранить изменения на сервере');
                }
            } catch (error) {
                console.error('Ошибка при сохранении слайда:', error);
                alert('Сбой сети при сохранении');
            }
        }
    };

    const handleDeleteSlide = async (slideId: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот слайд?')) return;

        const newSlides = slides
            .filter((s) => s.id !== slideId)
            .map((slide, idx) => ({
                ...slide,
                order: idx + 1
            }));

        setSlides(newSlides);

        if (sessionId) {
            try {
                const response = await apiFetch(`/api/Games/${sessionId}/presentation`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slides: newSlides })
                });

                if (!response.ok) {
                    alert('Не удалось сохранить изменения на сервере после удаления слайда');
                }
            } catch (error) {
                console.error('Ошибка удаления слайда:', error);
                alert('Сбой сети при удалении слайда');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="presentation-page loading-screen">
                <HeaderLibrary />
                <div className="loader-container">
                    <span className="spinner"></span>
                    <p>Загрузка слайдов презентации...</p>
                </div>
            </div>
        );
    }

    if (!sessionId) {
        return (
            <div className="presentation-page empty-screen">
                <HeaderLibrary />
                <div className="empty-message-container container">
                    <h2>У вас пока нет созданных игр</h2>
                    <p>Пожалуйста, создайте или выберите игру в Личном Кабинете, чтобы отредактировать презентацию.</p>
                    <button onClick={() => navigate('/cabinet')} className="btn-play-scenario">
                        В личный кабинет
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="presentation-page">
            <HeaderLibrary />

            <main className="container presentation-main">
                <div className="cabinet-breadcrumbs">
                    <span className="breadcrumb-link" onClick={() => navigate('/cabinet')}>Личный кабинет</span>
                    <img src={arrowIcon} alt=">" className="breadcrumb-separator-img" />
                    <span className="breadcrumb-link" onClick={() => navigate(`/generator?sessionId=${sessionId}`)}>Создание карточки</span>
                    <img src={arrowIcon} alt=">" className="breadcrumb-separator-img" />
                    <span className="breadcrumb-current">Слайды презентации</span>
                </div>

                <div className="presentation-content">
                    <div className="presentation-left">
                        <div className="presentation-header">
                            <h1 className="game-title">{gameName}</h1>
                            <div className="presentation-actions">
                                <button className="btn-add-slide" onClick={handleAddSlideClick}>
                                    <span className="plus-icon">+</span>
                                    Добавить слайд
                                </button>
                                <button className="btn-preview-scenario" onClick={() => navigate(`/gameplay?sessionId=${sessionId}&preview=true`)}>
                                    <img src={PreviewIcon} alt="Preview" />
                                    Предпросмотр
                                </button>
                                <button className="btn-play-scenario" onClick={() => navigate(`/gameplay?sessionId=${sessionId}`)}>
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

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                    <div className="slides-list">
                                        {slides.map((slide, index) => (
                                            <SortableSlideItem
                                                key={slide.id}
                                                slide={slide}
                                                index={index}
                                                onEdit={handleEditSlideClick}
                                                onDelete={handleDeleteSlide}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>
                </div>
            </main>

            {isEditModalOpen && selectedSlide && (
                <EditSlideModal
                    isOpen={isEditModalOpen}
                    slide={selectedSlide}
                    sessionId={sessionId}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveSlide}
                />
            )}
        </div>
    );
};

export default Presentation;
