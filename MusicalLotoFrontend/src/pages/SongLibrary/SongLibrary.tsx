import React, { useState } from 'react';
import HeaderLibrary from '../../components/HeaderLibrary/HeaderLibrary';
import './SongLibrary.css';

import plusIcon from '../../assets/SongLibrary/Плюсик в добавить песню.svg';
import playBtn from '../../assets/SongLibrary/Кнопка Play.svg';
import editBtn from '../../assets/SongLibrary/Кнопка изменить.svg';
import deleteBtn from '../../assets/SongLibrary/Кнопка удалить.svg';
import searchIcon from '../../assets/SongLibrary/Значок лупы в строке поиска.svg';

const SongLibrary: React.FC = () => {
    // В будущем сюда будут попадать данные из загруженных файлов
    const [songs] = useState([
        { id: 1, fileName: 'Lidiya_Ruslanova_Katyusha.mp3', duration: '3:45' },
        { id: 2, fileName: 'Troshin_Podmoskovnye_vechera.wav', duration: '4:12' },
        { id: 3, fileName: 'Narodnaya_Oy_moroz.mp3', duration: '2:50' },
    ]);

    return (
        <div className="library-wrapper">
            <HeaderLibrary />

            <main className="container library-main">
                <div className="library-title-row">
                    <div>
                        <h1 className="library-heading">Библиотека песен</h1>
                        <p className="library-counter">{songs.length} треков в базе</p>
                    </div>
                    <button className="add-song-btn">
                        <img src={plusIcon} alt="+" />
                        Добавить песню
                    </button>
                </div>

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
                            {songs.map((song, index) => (
                                <div className="table-row" key={song.id}>
                                    <div className="col-id">{index + 1}</div>

                                    <div className="col-name song-cell">
                                        <div className="song-icon-placeholder">🎵</div>
                                        <div className="song-details">
                                            <span className="file-name">{song.fileName}</span>
                                        </div>
                                    </div>

                                    <div className="col-time">{song.duration}</div>

                                    <div className="col-actions">
                                        <button className="icon-btn"><img src={playBtn} alt="Play" /></button>
                                        <button className="icon-btn"><img src={editBtn} alt="Edit" /></button>
                                        <button className="icon-btn"><img src={deleteBtn} alt="Delete" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SongLibrary;