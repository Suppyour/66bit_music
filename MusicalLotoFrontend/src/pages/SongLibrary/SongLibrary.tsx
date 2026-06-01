import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderLibrary from '../../components/HeaderLibrary/HeaderLibrary';
import AddSongModal from '../../components/AddSongModal/AddSongModal';
import EditSongModal from '../../components/EditSongModal/EditSongModal';
import NotificationToast, { type NotificationType } from '../../components/NotificationToast/NotificationToast';
import { apiFetch } from '../../utils/api';
import './SongLibrary.css';
import arrowIcon from '../../assets/Cabinet/Стрелка в Песен в библиотеке.svg';

import plusIcon from '../../assets/SongLibrary/Плюсик в добавить песню.svg';
import playBtn from '../../assets/SongLibrary/Кнопка Play.svg';
import editBtn from '../../assets/SongLibrary/Кнопка изменить.svg';
import deleteBtn from '../../assets/SongLibrary/Кнопка удалить.svg';
import searchIcon from '../../assets/SongLibrary/Значок лупы в строке поиска.svg';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    songTitle: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm, songTitle }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '500px', padding: '30px' }} onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>
                
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '28px', color: '#0F172A', margin: '0 0 12px 0' }}>Удалить песню?</h2>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px', color: '#64748B', margin: '0 0 30px 0', lineHeight: '24px' }}>
                        Вы уверены, что хотите удалить песню <strong style={{ color: '#0F172A' }}>"{songTitle}"</strong>? Это действие нельзя будет отменить.
                    </p>
                </div>

                <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button className="btn-cancel" style={{ flex: 1, padding: '12px 20px', fontSize: '16px' }} onClick={onClose}>
                        Отмена
                    </button>
                    <button className="btn-submit" style={{ flex: 1, padding: '12px 20px', fontSize: '16px', backgroundColor: '#EF4444' }} onClick={onConfirm}>
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    );
};


interface BackendSong {
    id: string;
    title: string;
    artist: string;
    audioPath: string;
    backgroundImagePath?: string;
    durationSeconds?: number;
}

interface SongDurationProps {
    audioPath: string;
    durationSeconds?: number;
}

const SongDuration: React.FC<SongDurationProps> = ({ audioPath, durationSeconds }) => {
    const [duration, setDuration] = useState<number | null>(null);

    useEffect(() => {
        if (durationSeconds && durationSeconds > 0) {
            setDuration(durationSeconds);
            return;
        }

        const audio = new Audio(audioPath);
        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };
        
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.load();

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [audioPath, durationSeconds]);

    const format = (seconds: number | null) => {
        if (seconds === null || isNaN(seconds) || seconds <= 0) return '--:--';
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return <>{format(duration)}</>;
};

import { useMusic } from '../../context/MusicContext';

const SongLibrary: React.FC = () => {
    const navigate = useNavigate();
    const [songs, setSongs] = useState<BackendSong[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [editingSong, setEditingSong] = useState<BackendSong | null>(null);
    const [deletingSong, setDeletingSong] = useState<BackendSong | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSongs = songs.filter(song => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        
        const titleMatch = song.title?.toLowerCase().includes(query);
        const artistMatch = song.artist?.toLowerCase().includes(query);
        
        return titleMatch || artistMatch;
    });

    const { 
        currentSong, 
        isPlaying, 
        playSong,
        refreshSongs
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

    const handleConfirmDelete = async () => {
        if (!deletingSong) return;
        const name = deletingSong.title;
        const id = deletingSong.id;
        try {
            const response = await apiFetch(`/api/Songs/${id}`, { 
                method: 'DELETE'
            });
            if (response.ok) {
                setDeletingSong(null);
                triggerNotification('delete', name);
                await fetchSongs();
                await refreshSongs();
            } else {
                alert('Ошибка сервера при удалении');
            }
        } catch {
            alert('Сетевая ошибка при удалении');
        }
    };

    const handleEditSong = async (id: string, formData: FormData) => {
        setIsUploading(true);
        try {
            const response = await apiFetch(`/api/Songs/${id}`, {
                method: 'PUT',
                body: formData,
            });

            if (response.ok) {
                setEditingSong(null);
                const title = formData.get('Title') as string;
                const artist = formData.get('Artist') as string;
                triggerNotification('edit', `${title} - ${artist}`);
                await fetchSongs();
                await refreshSongs();
            } else {
                const errText = await response.text();
                alert(`Ошибка от сервера при изменении: ${response.status}\n${errText}`);
            }
        } catch (err) {
            console.error('Ошибка сети:', err);
            alert('Сетевая ошибка при изменении');
        } finally {
            setIsUploading(false);
        }
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
                await refreshSongs();
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
                <div className="cabinet-breadcrumbs">
                    <span className="breadcrumb-link" onClick={() => navigate('/cabinet')}>Личный кабинет</span>
                    <img src={arrowIcon} alt=">" className="breadcrumb-separator-img" />
                    <span className="breadcrumb-current">Библиотека песен</span>
                </div>

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

                {editingSong && (
                    <EditSongModal
                        isOpen={!!editingSong}
                        onClose={() => setEditingSong(null)}
                        onEdit={handleEditSong}
                        isUploading={isUploading}
                        initialData={editingSong}
                    />
                )}

                {deletingSong && (
                    <DeleteConfirmModal
                        isOpen={!!deletingSong}
                        onClose={() => setDeletingSong(null)}
                        onConfirm={handleConfirmDelete}
                        songTitle={deletingSong.title}
                    />
                )}

                <div className="library-card">
                    <div className="search-bar">
                        <img src={searchIcon} alt="Search" className="search-icon" />
                        <input
                            type="text"
                            placeholder="Поиск по названию или исполнителю..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                            ) : filteredSongs.length === 0 ? (
                                <div className="table-row">
                                    <div className="col-name song-cell">Ничего не найдено по запросу "{searchQuery}"</div>
                                </div>
                            ) : (
                                filteredSongs.map((song, index) => (
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

                                        <div className="col-time">
                                            <SongDuration audioPath={song.audioPath} durationSeconds={song.durationSeconds} />
                                        </div>

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
                                             <button className="icon-btn" title="Изменить" onClick={() => setEditingSong(song)}>
                                                 <img src={editBtn} alt="Edit" />
                                             </button>
                                             <button className="icon-btn" title="Удалить" onClick={() => setDeletingSong(song)}>
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