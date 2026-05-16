import React from 'react';
import { useMusic } from '../../context/MusicContext';
import './MusicPlayer.css';

const MusicPlayer: React.FC = () => {
    const { 
        currentSong, 
        isPlaying, 
        volume, 
        currentTime, 
        duration, 
        togglePlay, 
        handleNext, 
        handlePrev, 
        handleSeek, 
        handleVolumeChange,
        closePlayer
    } = useMusic();

    if (!currentSong) return null;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="music-mixer-bar">
            <div className="mixer-info">
                {currentSong.backgroundImagePath ? (
                    <img src={currentSong.backgroundImagePath} alt="Cover" className="mixer-cover" />
                ) : (
                    <div className="mixer-cover-placeholder">🎵</div>
                )}
                <div className="mixer-text">
                    <span className="mixer-playing-label">Сейчас играет:</span>
                    <span className="mixer-song-name">{currentSong.title}</span>
                </div>
            </div>

            <div className="mixer-center">
                <div className="mixer-progress-container">
                    <span className="time-label">{formatTime(currentTime)}</span>
                    <input 
                        type="range" 
                        min="0" 
                        max={duration || 0} 
                        step="1" 
                        value={currentTime} 
                        onChange={(e) => handleSeek(parseFloat(e.target.value))}
                        className="seek-slider"
                        style={{
                            background: `linear-gradient(to right, #2563EB ${(currentTime / (duration || 1)) * 100}%, #E2E8F0 ${(currentTime / (duration || 1)) * 100}%)`
                        }}
                    />
                    <span className="time-label">{formatTime(duration)}</span>
                </div>
            </div>
            
            <div className="mixer-controls">
                <button className="mixer-skip-btn" onClick={handlePrev} title="Назад">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#64748B"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button className="mixer-play-btn" onClick={togglePlay}>
                    {isPlaying ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    )}
                </button>
                <button className="mixer-skip-btn" onClick={handleNext} title="Вперед">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#64748B"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>

                <div className="volume-control">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#64748B">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={volume} 
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="volume-slider"
                    />
                </div>

                <button className="mixer-close-btn" onClick={closePlayer} title="Закрыть плеер">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default MusicPlayer;
