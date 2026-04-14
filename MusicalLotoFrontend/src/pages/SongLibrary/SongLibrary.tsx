import React, { useState, useEffect } from 'react';
import HeaderLibrary from '../../components/HeaderLibrary/HeaderLibrary';
import './SongLibrary.css';

import plusIcon from '../../assets/SongLibrary/Плюсик в добавить песню.svg';
import playBtn from '../../assets/SongLibrary/Кнопка Play.svg';
import editBtn from '../../assets/SongLibrary/Кнопка изменить.svg';
import deleteBtn from '../../assets/SongLibrary/Кнопка удалить.svg';
import searchIcon from '../../assets/SongLibrary/Значок лупы в строке поиска.svg';

// Описываем структуру данных, которую возвращает бэкенд (SongDto)
interface BackendSong {
    id: string;
    title: string;
    artist: string;
    audioPath: string;
    backgroundImagePath?: string;
    durationSeconds?: number;
}

const SongLibrary: React.FC = () => {
    // Состояние для хранения списка песен с бэкенда
    const [songs, setSongs] = useState<BackendSong[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [isUploading, setIsUploading] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    
    // Стэйт для проигрывания песни
    const [playingSongId, setPlayingSongId] = useState<string | null>(null);

    // Удаление песни
    const handleDeleteSong = async (id: string, name: string) => {
        if (!window.confirm(`Вы уверены, что хотите удалить песню "${name}"?`)) return;
        try {
            const response = await fetch(`/api/Songs/${id}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchSongs();
            } else {
                alert('Ошибка сервера при удалении');
            }
        } catch {
            alert('Сетевая ошибка при удалении');
        }
    };

    // Форматирование секунд в мм:сс
    const formatDuration = (seconds?: number) => {
        if (!seconds) return '--:--';
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Выносим функцию наружу, чтобы ее можно было вызвать и при старте, и после загрузки
    const fetchSongs = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/Songs');

            if (response.ok) {
                const data = await response.json();
                setSongs(data);
            } else {
                console.error('Ошибка сервера при загрузке песен:', response.status);
            }
        } catch (error) {
            console.error('Ошибка сети при загрузке песен:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // useEffect сработает при монтировании компонента и загрузит данные
    useEffect(() => {
        fetchSongs();
    }, []);

    // Стандартный путь веба: отправляем файл и сразу вызываем fetchSongs
    const handleUploadSong = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        setIsUploading(true);
        try {
            const response = await fetch('/api/Songs', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setShowUploadForm(false);
                form.reset();
                // Магия стандартного веба: перерисовываем таблицу новыми данными
                await fetchSongs();
            } else {
                const errText = await response.text();
                console.error("Backend error:", errText);
                alert(`Ошибка от сервера: ${response.status}\n${errText}`);
            }
        } catch (err) {
            console.error('Ошибка сети:', err);
            alert('Сетевая ошибка при загрузке');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="library-wrapper">
            <HeaderLibrary />

            <main className="container library-main">
                <div className="library-title-row">
                    <div>
                        <h1 className="library-heading">Библиотека песен</h1>
                        <p className="library-counter">{songs.length} треков в базе</p>
                    </div>
                    <button className="add-song-btn" onClick={() => setShowUploadForm(!showUploadForm)}>
                        <img src={plusIcon} alt="+" />
                        Добавить песню
                    </button>
                </div>

                {showUploadForm && (
                    <form className="upload-form" onSubmit={handleUploadSong} style={{ background: '#1c1c1e', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="text" name="Title" placeholder="Название песни" required style={{ padding: '10px', borderRadius: '6px', border: 'none', outline: 'none' }} />
                        <input type="text" name="Artist" placeholder="Исполнитель" required style={{ padding: '10px', borderRadius: '6px', border: 'none', outline: 'none' }} />
                        <div style={{ color: "white", fontSize: '14px' }}>
                            <span style={{ marginRight: '8px' }}>Аудио:</span>
                            <input type="file" name="AudioFile" accept="audio/*" required />
                        </div>
                        <button type="submit" disabled={isUploading} className="add-song-btn" style={{ marginLeft: 'auto', background: '#e12b5b' }}>
                            {isUploading ? 'Загрузка...' : 'Сохранить'}
                        </button>
                        <button type="button" onClick={() => setShowUploadForm(false)} className="add-song-btn" style={{ background: 'gray' }}>
                            Отмена
                        </button>
                    </form>
                )}

                <div className="library-card">
                    <div className="search-bar">
                        <img src={searchIcon} alt="Search" className="search-icon" />
                        <input
                            type="text"
                            placeholder="Поиск по названию или исполнителю..."
                            className="search-input"
                        />
                    </div>

                    <div className="song-table">
                        <div className="table-header">
                            <div className="col-id">№</div>
                            <div className="col-name">Песня</div>
                            <div className="col-time">Длительность</div>
                            <div className="col-actions">Действия</div>
                        </div>

                        <div className="table-body">
                            {isLoading ? (
                                <div className="table-row">
                                    <div className="col-name song-cell">Загрузка данных...</div>
                                </div>
                            ) : songs.length === 0 ? (
                                <div className="table-row">
                                    <div className="col-name song-cell">Список песен пуст</div>
                                </div>
                            ) : (
                                songs.map((song, index) => (
                                    <div className="table-row" key={song.id}>
                                        <div className="col-id">{index + 1}</div>

                                        <div className="col-name song-cell">
                                            <div className="song-icon-placeholder">🎵</div>
                                            <div className="song-details">
                                                <span className="file-name">
                                                    {song.artist && song.title
                                                        ? `${song.artist} - ${song.title}`
                                                        : song.title || 'Неизвестная песня'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-time">{formatDuration(song.durationSeconds)}</div>

                                        <div className="col-actions">
                                            <button className="icon-btn" title="Воспроизвести" onClick={() => setPlayingSongId(playingSongId === song.id ? null : song.id)}>
                                                { /* Немного приглушаем иконку, если песня играет, чтобы визуально отличить "Стоп" от "Плэй" */ }
                                                <img src={playBtn} alt="Play" style={{ opacity: playingSongId === song.id ? 0.3 : 1 }} />
                                            </button>
                                            <button className="icon-btn" title="Изменить">
                                                <img src={editBtn} alt="Edit" />
                                            </button>
                                            <button className="icon-btn" title="Удалить" onClick={() => handleDeleteSong(song.id, song.title)}>
                                                <img src={deleteBtn} alt="Delete" />
                                            </button>
                                        </div>
                                        
                                        {/* Скрытый аудиоплеер, который играет только если песня активна */}
                                        {playingSongId === song.id && (
                                            <audio autoPlay src={song.audioPath} onEnded={() => setPlayingSongId(null)} />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SongLibrary;