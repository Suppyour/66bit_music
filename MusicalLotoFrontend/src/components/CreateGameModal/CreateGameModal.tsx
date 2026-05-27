import React, { useState, useEffect } from 'react';
import './CreateGameModal.css';
import { apiFetch } from '../../utils/api';
import type { Song } from '../../pages/Cabinet/Cabinet';

import closeIcon from '../../assets/Cabinet/Крестик закрыть.svg';
import logoIcon from '../../assets/Cabinet/Лого в меню моздания игры.svg';
import horizontalIcon from '../../assets/Cabinet/Горизонталь.svg';
import verticalIcon from '../../assets/Cabinet/Вертикаль.svg';
import diagonalIcon from '../../assets/Cabinet/Диагональ.svg';
import fullFieldIcon from '../../assets/Cabinet/Полное поле.svg';
interface CreateGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    songs: Song[];
    onGameCreated: (gameId: string) => void;
    preGeneratedCards?: any[];
}

const CreateGameModal: React.FC<CreateGameModalProps> = ({ isOpen, onClose, songs, onGameCreated, preGeneratedCards }) => {
    const [name, setName] = useState('');
    const [participantsCount, setParticipantsCount] = useState<string>('');
    const [cardSize, setCardSize] = useState<string>('');
    const [rules, setRules] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedSongsPool, setSelectedSongsPool] = useState<Song[]>(songs);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setParticipantsCount('');
            setCardSize('');
            setRules(0);
            setError(null);

            const generatorSongsJson = localStorage.getItem('generatorSelectedSongIds');
            if (generatorSongsJson) {
                try {
                    const selectedIds: string[] = JSON.parse(generatorSongsJson);
                    if (selectedIds.length > 0) {
                        const filtered = songs.filter(s => selectedIds.includes(s.id));
                        if (filtered.length > 0) {
                            setSelectedSongsPool(filtered);
                            return;
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            setSelectedSongsPool(songs);
        }
    }, [isOpen, songs]);

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
        if (selectedSongsPool.length < requiredSongs) {
            setError(`Выбранного пула песен недостаточно. Нужно минимум ${requiredSongs} (выбрано: ${selectedSongsPool.length}).`);
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const response = await apiFetch('/api/Games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    participantsCount: pCount,
                    cardSize: cSize,
                    rules,
                    selectedSongIds: selectedSongsPool.map(s => s.id),
                    preGeneratedCards: preGeneratedCards || null
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
        <div className="cgm-overlay">
            <div className="cgm-content" onClick={e => e.stopPropagation()}>
                <button className="cgm-close-btn" onClick={onClose}>
                    <img src={closeIcon} alt="Закрыть" />
                </button>

                <div className="cgm-header">
                    <div className="cgm-icon">
                        <img src={logoIcon} alt="Logo" />
                    </div>
                    <h2 className="cgm-title">Создание новой игры</h2>
                    <p className="cgm-subtitle">Заполните поля для настройки ({selectedSongsPool.length} песен в пуле игры)</p>
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
                                    <img src={horizontalIcon} alt="Горизонталь" />
                                </div>
                                <span>Горизонталь</span>
                            </div>
                            <div className={`cgm-rule-card ${(rules & 2) ? 'active' : ''}`} onClick={() => toggleRule(2)}>
                                <div className="cgm-rule-icon">
                                    <img src={verticalIcon} alt="Вертикаль" />
                                </div>
                                <span>Вертикаль</span>
                            </div>
                            <div className={`cgm-rule-card ${(rules & 8) ? 'active' : ''}`} onClick={() => toggleRule(8)}>
                                <div className="cgm-rule-icon">
                                    <img src={diagonalIcon} alt="Диагональ" />
                                </div>
                                <span>Диагональ</span>
                            </div>
                            <div className={`cgm-rule-card ${(rules & 4) ? 'active' : ''}`} onClick={() => toggleRule(4)}>
                                <div className="cgm-rule-icon">
                                    <img src={fullFieldIcon} alt="Полное поле" />
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
