import React, { useState, useEffect } from 'react';
import HeaderLibrary from '../../components/HeaderLibrary/HeaderLibrary';
import './Cabinet.css';

import playBtn from '../../assets/Cabinet/Значек плей в Играть.svg';
import deleteBtn from '../../assets/Cabinet/Кнопка удалить в кабинет.svg';

// Newly added icons
import plusIcon from '../../assets/Cabinet/Плюсик из Создать игру.svg';
import noteIcon from '../../assets/Cabinet/Нота в кабинет.svg';
import totalGamesIcon from '../../assets/Cabinet/Иконка в Всего игр.svg';
import activePlayersIcon from '../../assets/Cabinet/Иконка в Активных игроков.svg';
import songsLibraryIcon from '../../assets/Cabinet/Иконка в Песен в библиотеке.svg';

interface Game {
    id: string;
    title: string;
    status: 'Active' | 'Completed';
    participants: number;
    date: string;
}

// В будущем эти данные будут приходить с бэкенда
const mockGames: Game[] = [
    // { id: '1', title: 'Корпоратив 2025', status: 'Active', participants: 20, date: '15.03.2025' },
    // { id: '2', title: 'День рождения Марины', status: 'Completed', participants: 12, date: '20.03.2025' },
];

const Cabinet: React.FC = () => {
    // Пока что у нас нет игр в бд, поэтому массив пустой
    const [games, setGames] = useState<Game[]>(mockGames);
    const [totalSongs, setTotalSongs] = useState<number>(0);

    // Вычисляемые параметры на основе текущего списка игр
    const totalGames = games.length;
    const activePlayers = games.filter(g => g.status === 'Active').reduce((sum, g) => sum + g.participants, 0);

    useEffect(() => {
        // TODO: На будущее реализовать получение игр с бэкенда
        // const fetchGames = async () => {
        //     const response = await fetch('/api/Games');
        //     const data = await response.json();
        //     setGames(data);
        // };
        // fetchGames();

        // Получение количества песен из библиотеки
        const fetchTotalSongs = async () => {
            try {
                const response = await fetch('/api/Songs');
                if (response.ok) {
                    const data = await response.json();
                    setTotalSongs(data.length || 0);
                }
            } catch (error) {
                console.error("Ошибка при получении количества песен:", error);
            }
        };

        fetchTotalSongs();
    }, []);

    const handleDeleteGame = (id: string) => {
        if(window.confirm('Вы уверены, что хотите удалить эту игру?')) {
            setGames(games.filter(g => g.id !== id));
        }
    };

    return (
        <div className="cabinet-wrapper">
            <HeaderLibrary />

            <main className="container cabinet-main">
                <div className="cabinet-card">
                    {/* Header Section */}
                    <div className="cabinet-header-section">
                        <div>
                            <h1 className="cabinet-heading">Личный кабинет</h1>
                            <p className="cabinet-subtitle">Управляйте играми, карточками и музыкальной библиотекой</p>
                        </div>
                        <button className="create-game-btn">
                            <img src={plusIcon} alt="+" className="create-game-plus-icon" />
                            <span>Создать игру</span>
                        </button>
                    </div>

                    {/* Stats Section */}
                    <div className="cabinet-stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon-wrapper">
                                <img src={totalGamesIcon} alt="Всего игр" />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{totalGames}</div>
                                <div className="stat-label">Всего игр</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper">
                                <img src={activePlayersIcon} alt="Активных игроков" />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{activePlayers}</div>
                                <div className="stat-label">Активных игроков</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper">
                                <img src={songsLibraryIcon} alt="Песен в библиотеке" />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{totalSongs}</div>
                                <div className="stat-label">Песен в библиотеке</div>
                            </div>
                        </div>
                    </div>

                    {/* Games List Section */}
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
                                                    <span className="game-title">{game.title}</span>
                                                    <span className={`game-badge ${game.status === 'Active' ? 'badge-active' : 'badge-completed'}`}>
                                                        {game.status === 'Active' ? 'Активная' : 'Завершённая'}
                                                    </span>
                                                </div>
                                                <div className="game-meta">
                                                    <span>👤 {game.participants} участников</span>
                                                    <span>🕒 {game.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="game-actions-col">
                                            <button className="play-game-btn">
                                                <img src={playBtn} alt="Play" className="play-game-icon"/>
                                                Играть
                                            </button>
                                            <button className="delete-game-btn" onClick={() => handleDeleteGame(game.id)} title="Удалить">
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

export default Cabinet;
