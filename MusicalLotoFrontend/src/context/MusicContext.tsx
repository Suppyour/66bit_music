import React, { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import { apiFetch } from '../utils/api';

export interface MusicSong {
    id: string;
    title: string;
    artist: string;
    audioPath: string;
    backgroundImagePath?: string;
    durationSeconds?: number;
}

interface MusicContextType {
    songs: MusicSong[];
    currentSong: MusicSong | null;
    isPlaying: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    playSong: (song: MusicSong) => void;
    togglePlay: () => void;
    handleNext: () => void;
    handlePrev: () => void;
    handleSeek: (time: number) => void;
    handleVolumeChange: (volume: number) => void;
    closePlayer: () => void;
    refreshSongs: () => Promise<void>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [songs, setSongs] = useState<MusicSong[]>([]);
    const [currentSong, setCurrentSong] = useState<MusicSong | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    const audioRef = useRef<HTMLAudioElement>(new Audio());

    const fetchSongs = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setSongs([]);
            return;
        }
        try {
            const response = await apiFetch('/api/Songs');
            if (response.ok) {
                const data = await response.json();
                setSongs(data || []);
            } else {
                setSongs([]);
            }
        } catch (error) {
            console.error('Failed to fetch songs for global context:', error);
            setSongs([]);
        }
    };

    useEffect(() => {
        fetchSongs();

        const handleAuthChange = () => {
            fetchSongs();
        };

        window.addEventListener('auth-change', handleAuthChange);
        return () => {
            window.removeEventListener('auth-change', handleAuthChange);
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onLoadedMetadata = () => setDuration(audio.duration);
        const onEnded = () => handleNext();
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, [songs]); // Re-bind handleNext if songs change

    const playSong = (song: MusicSong) => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            setCurrentSong(song);
            audioRef.current.src = song.audioPath;
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else if (currentSong) {
            audioRef.current.play();
        }
    };

    const handleNext = () => {
        if (!currentSong || songs.length === 0) return;
        const currentIndex = songs.findIndex(s => s.id === currentSong.id);
        const nextIndex = (currentIndex + 1) % songs.length;
        playSong(songs[nextIndex]);
    };

    const handlePrev = () => {
        if (!currentSong || songs.length === 0) return;
        const currentIndex = songs.findIndex(s => s.id === currentSong.id);
        const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
        playSong(songs[prevIndex]);
    };

    const handleSeek = (time: number) => {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const handleVolumeChange = (v: number) => {
        setVolume(v);
        audioRef.current.volume = v;
    };

    const closePlayer = () => {
        audioRef.current.pause();
        audioRef.current.src = '';
        setCurrentSong(null);
        setIsPlaying(false);
    };

    return (
        <MusicContext.Provider value={{
            songs,
            currentSong,
            isPlaying,
            volume,
            currentTime,
            duration,
            playSong,
            togglePlay,
            handleNext,
            handlePrev,
            handleSeek,
            handleVolumeChange,
            closePlayer,
            refreshSongs: fetchSongs
        }}>
            {children}
        </MusicContext.Provider>
    );
};

export const useMusic = () => {
    const context = useContext(MusicContext);
    if (!context) throw new Error('useMusic must be used within a MusicProvider');
    return context;
};
