import React, { useState, useEffect } from 'react';
import './SelectSongsModal.css';
import { apiFetch } from '../../utils/api';

export interface Song {
    id: string;
    title: string;
    artist: string;
}

interface SelectSongsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selectedSongs: Song[]) => void;
    initialSelectedIds?: string[];
    minRequired?: number;
}

const SelectSongsModal: React.FC<SelectSongsModalProps> = ({ isOpen, onClose, onSelect, initialSelectedIds = [], minRequired = 9 }) => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            setSelectedIds(new Set(initialSelectedIds));
            fetchSongs();
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, initialSelectedIds, onClose]);

    const fetchSongs = async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch('/api/Songs');
            if (response.ok) {
                const data = await response.json();
                setSongs(data || []);
            }
        } catch (error) {
            console.error("Ошибка при получении песен:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleToggle = (id: string) => {
        const nextIds = new Set(selectedIds);
        if (nextIds.has(id)) {
            nextIds.delete(id);
        } else {
            nextIds.add(id);
        }
        setSelectedIds(nextIds);
    };

    const handleToggleAll = () => {
        if (selectedIds.size === songs.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(songs.map(s => s.id)));
        }
    };

    const handleSubmit = () => {
        const selectedSongs = songs.filter(s => selectedIds.has(s.id));
        onSelect(selectedSongs);
        onClose();
    };

    return (
        <div className="ssm-overlay">
            <div className="ssm-content" onClick={e => e.stopPropagation()}>
                <button className="ssm-close-btn" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <div className="ssm-header">
                    <h2 className="ssm-title">Выбор песен</h2>
                    <p className="ssm-subtitle">Выберите минимум {minRequired} песен для настройки игры</p>
                </div>

                {isLoading ? (
                    <div className="ssm-loading">Загрузка песен...</div>
                ) : (
                    <>
                        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#6B7280' }}>Выбрано: {selectedIds.size} / {songs.length}</span>
                            <button
                                onClick={handleToggleAll}
                                style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '14px' }}
                            >
                                {selectedIds.size === songs.length ? 'Снять выделение' : 'Выбрать все'}
                            </button>
                        </div>
                        <div className="ssm-list">
                            {songs.map(song => (
                                <div key={song.id} className="ssm-item" onClick={() => handleToggle(song.id)}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(song.id)}
                                        onChange={() => { }}
                                    />
                                    <div className="ssm-item-info">
                                        <span className="ssm-item-title">{song.title}</span>
                                        <span className="ssm-item-artist">{song.artist}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="ssm-actions">
                    <button className="ssm-btn-cancel" onClick={onClose}>Отмена</button>
                    <button
                        className="ssm-btn-submit"
                        onClick={handleSubmit}
                        disabled={selectedIds.size < minRequired}
                    >
                        Сохранить ({selectedIds.size})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectSongsModal;
