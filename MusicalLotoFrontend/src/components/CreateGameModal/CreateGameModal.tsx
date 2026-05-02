import React, { useState, useEffect } from 'react';
import './CreateGameModal.css';
import type { Song } from '../../pages/Cabinet/Cabinet';

interface CreateGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    songs: Song[];
    onGameCreated: (gameId: string) => void;
}

const CreateGameModal: React.FC<CreateGameModalProps> = ({ isOpen, onClose, songs, onGameCreated }) => {
    const [name, setName] = useState('');
    const [participantsCount, setParticipantsCount] = useState<string>('');
    const [cardSize, setCardSize] = useState<string>('');
    const [rules, setRules] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setParticipantsCount('');
            setCardSize('');
            setRules(0);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const toggleRule = (rule: number) => {
        if ((rules & rule) === rule) {
            setRules(rules & ~rule);
        } else {
            setRules(rules | rule);
        }
    };

    const handleSubmit = async () => {
        if (!name) { setError("Введите название игры"); return; }
        const pCount = parseInt(participantsCount);
        if (isNaN(pCount) || pCount < 1) { setError("Введите корректное количество участников"); return; }
        const cSize = parseInt(cardSize);
        if (isNaN(cSize) || cSize < 3 || cSize > 7) { setError("Размер карточки должен быть от 3 до 7"); return; }
        if (rules === 0) { setError("Выберите хотя бы одно правило победы"); return; }
        
        const requiredSongs = cSize * cSize;
        if (songs.length < requiredSongs) {
            setError(`В библиотеке недостаточно песен. Нужно минимум ${requiredSongs}.`);
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch('/api/Games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    participantsCount: pCount,
                    cardSize: cSize,
                    rules,
                    // Auto-select all songs to satisfy the backend requirement
                    selectedSongIds: songs.map(s => s.id)
                })
            });

            if (response.ok) {
                const data = await response.json();
                onGameCreated(data.id || data.Id);
            } else {
                const text = await response.text();
                setError(text || "Произошла ошибка при создании игры");
            }
        } catch (err: any) {
            setError(err.message || "Ошибка соединения с сервером");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="cgm-overlay" onClick={onClose}>
            <div className="cgm-content" onClick={e => e.stopPropagation()}>
                <button className="cgm-close-btn" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                
                <div className="cgm-header">
                    <div className="cgm-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18V5L21 3V16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="6" cy="18" r="3" stroke="white" strokeWidth="2"/>
                            <circle cx="18" cy="16" r="3" stroke="white" strokeWidth="2"/>
                        </svg>
                    </div>
                    <h2 className="cgm-title">Создание новой игры</h2>
                    <p className="cgm-subtitle">Заполните поля для настройки вашей игровой сессии</p>
                </div>

                {error && <div className="cgm-error">{error}</div>}

                <div className="cgm-form">
                    <div className="cgm-field">
                        <label>Название игры <span className="cgm-req">*</span></label>
                        <input type="text" placeholder="Новый год" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="cgm-field">
                        <label>Количество участников <span className="cgm-req">*</span></label>
                        <input type="number" placeholder="2" value={participantsCount} onChange={e => setParticipantsCount(e.target.value)} />
                    </div>
                    <div className="cgm-field">
                        <label>Размер карточки (N x N) <span className="cgm-req">*</span></label>
                        <input type="number" placeholder="Например, 5" value={cardSize} onChange={e => setCardSize(e.target.value)} />
                    </div>
                    
                    <div className="cgm-field" style={{ marginTop: '8px' }}>
                        <label>Правила победы <span className="cgm-req">*</span></label>
                        <div className="cgm-rules-grid">
                            <div className={`cgm-rule-card ${(rules & 1) ? 'active' : ''}`} onClick={() => toggleRule(1)}>
                                <div className="cgm-rule-icon">
                                    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="60" height="60" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
                                        <path d="M20 0V60M40 0V60M0 20H60M0 40H60" stroke="#E5E7EB" strokeWidth="1"/>
                                        <rect x="0" y="20" width="60" height="20" fill="#3B82F6" fillOpacity="0.1"/>
                                        <line x1="0" y1="30" x2="60" y2="30" stroke="#2563EB" strokeWidth="2"/>
                                    </svg>
                                </div>
                                <span>Горизонталь</span>
                            </div>
                            <div className={`cgm-rule-card ${(rules & 2) ? 'active' : ''}`} onClick={() => toggleRule(2)}>
                                <div className="cgm-rule-icon">
                                    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="60" height="60" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
                                        <path d="M20 0V60M40 0V60M0 20H60M0 40H60" stroke="#E5E7EB" strokeWidth="1"/>
                                        <rect x="20" y="0" width="20" height="60" fill="#3B82F6" fillOpacity="0.1"/>
                                        <line x1="30" y1="0" x2="30" y2="60" stroke="#2563EB" strokeWidth="2"/>
                                    </svg>
                                </div>
                                <span>Вертикаль</span>
                            </div>
                            <div className={`cgm-rule-card ${(rules & 8) ? 'active' : ''}`} onClick={() => toggleRule(8)}>
                                <div className="cgm-rule-icon">
                                    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="60" height="60" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
                                        <path d="M20 0V60M40 0V60M0 20H60M0 40H60" stroke="#E5E7EB" strokeWidth="1"/>
                                        <line x1="0" y1="0" x2="60" y2="60" stroke="#2563EB" strokeWidth="2"/>
                                    </svg>
                                </div>
                                <span>Диагональ</span>
                            </div>
                            <div className={`cgm-rule-card ${(rules & 4) ? 'active' : ''}`} onClick={() => toggleRule(4)}>
                                <div className="cgm-rule-icon">
                                    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="60" height="60" rx="4" fill="#2563EB" stroke="#2563EB" strokeWidth="1"/>
                                        <path d="M20 0V60M40 0V60M0 20H60M0 40H60" stroke="#60A5FA" strokeWidth="1"/>
                                    </svg>
                                </div>
                                <span>Полное поле</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="cgm-actions">
                    <button className="cgm-btn-cancel" onClick={onClose} disabled={isSubmitting}>Отмена</button>
                    <button className="cgm-btn-submit" onClick={handleSubmit} disabled={isSubmitting}>Сохранить</button>
                </div>
            </div>
        </div>
    );
};

export default CreateGameModal;
