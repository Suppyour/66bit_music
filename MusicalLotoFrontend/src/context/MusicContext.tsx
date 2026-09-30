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
    primeAudio: (song: MusicSong) => void;
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

    const primeAudio = (song: MusicSong) => {
        setCurrentSong(song);
        if (song.audioPath) {
            audioRef.current.src = song.audioPath;
            audioRef.current.load();
        }
    };

    const playSong = (song: MusicSong) => {
        if (currentSong?.id === song.id && isPlaying) {
            togglePlay();
        } else {
            setCurrentSong(song);
            if (!audioRef.current.src.endsWith(song.audioPath)) {
                audioRef.current.src = song.audioPath;
            }
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.warn('Playback blocked or failed:', err);
                setIsPlaying(false);
            });
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else if (currentSong) {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.warn('Playback blocked or failed:', err);
            });
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
            primeAudio,
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
