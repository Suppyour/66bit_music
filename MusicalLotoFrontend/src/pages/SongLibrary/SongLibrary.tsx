import React, { useState, useEffect } from 'react';
import HeaderLibrary from '../../components/HeaderLibrary/HeaderLibrary';
import AddSongModal from '../../components/AddSongModal/AddSongModal';
import NotificationToast, { type NotificationType } from '../../components/NotificationToast/NotificationToast';
import { apiFetch } from '../../utils/api';
import './SongLibrary.css';

import plusIcon from '../../assets/SongLibrary/Плюсик в добавить песню.svg';
import playBtn from '../../assets/SongLibrary/Кнопка Play.svg';
import editBtn from '../../assets/SongLibrary/Кнопка изменить.svg';
import deleteBtn from '../../assets/SongLibrary/Кнопка удалить.svg';
import searchIcon from '../../assets/SongLibrary/Значок лупы в строке поиска.svg';


interface BackendSong {
    id: string;
    title: string;
    artist: string;
    audioPath: string;
    backgroundImagePath?: string;
    durationSeconds?: number;
}

import { useMusic, type MusicSong } from '../../context/MusicContext';

const SongLibrary: React.FC = () => {
    const [songs, setSongs] = useState<BackendSong[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);

    const { 
        currentSong, 
        isPlaying, 
        playSong 
    } = useMusic();

    const [notification, setNotification] = useState<{ show: boolean, type: NotificationType, text: string }>({
        show: false,
        type: 'add',
        text: ''
    });

    const triggerNotification = (type: NotificationType, text: string) => {
        setNotification({ show: true, type, text });
    };

    const handleCloseNotification = React.useCallback(() => {
        setNotification(prev => ({ ...prev, show: false }));
    }, []);

    const handleDeleteSong = async (id: string, name: string) => {
        if (!window.confirm(`Вы уверены, что хотите удалить песню "${name}"?`)) return;
        try {
            const response = await apiFetch(`/api/Songs/${id}`, { 
                method: 'DELETE'
            });
            if (response.ok) {
                triggerNotification('delete', name);
                await fetchSongs();
            } else {
                alert('Ошибка сервера при удалении');
            }
        } catch {
            alert('Сетевая ошибка при удалении');
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '--:--';
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const fetchSongs = async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch('/api/Songs');

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

    useEffect(() => {
        fetchSongs();
    }, []);

    const handleUploadSong = async (formData: FormData) => {
        setIsUploading(true);
        try {
            const response = await apiFetch('/api/Songs', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setShowUploadForm(false);
                const title = formData.get('Title') as string;
                const artist = formData.get('Artist') as string;
                triggerNotification('add', `${title} - ${artist}`);

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
            <NotificationToast
                show={notification.show}
                type={notification.type}
                songDetails={notification.text}
                onClose={handleCloseNotification}
            />
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

                <AddSongModal
                    isOpen={showUploadForm}
                    onClose={() => setShowUploadForm(false)}
                    onUpload={handleUploadSong}
                    isUploading={isUploading}
                />

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
                                            {song.backgroundImagePath ? (
                                                <img src={song.backgroundImagePath} alt="Cover" className="song-cover-image" />
                                            ) : (
                                                <div className="song-icon-placeholder">🎵</div>
                                            )}
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
                                            <button className="icon-btn" title={currentSong?.id === song.id && isPlaying ? "Пауза" : "Воспроизвести"} onClick={() => playSong(song)}>
                                                {currentSong?.id === song.id && isPlaying ? (
                                                    <div className="pause-icon-wrapper">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M10 19H6V5H10V19ZM18 19H14V5H18V19Z" fill="#2563EB"/>
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <img src={playBtn} alt="Play" />
                                                )}
                                            </button>
                                            <button className="icon-btn" title="Изменить" onClick={() => triggerNotification('edit', song.title)}>
                                                <img src={editBtn} alt="Edit" />
                                            </button>
                                            <button className="icon-btn" title="Удалить" onClick={() => handleDeleteSong(song.id, song.title)}>
                                                <img src={deleteBtn} alt="Delete" />
                                            </button>
                                        </div>

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