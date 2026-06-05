import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useMusic } from '../../context/MusicContext';
import { apiFetch } from '../../utils/api';
import './HeaderLibrary.css';

import logoIcon from '../../assets/SongLibrary/Лого хедер.svg';
import avatarIcon from '../../assets/SongLibrary/Аватарка новая.svg';
import arrowIcon from '../../assets/SongLibrary/Стрелка у администратора.svg';
import pencilIcon from '../../assets/Cabinet/Значок карандаша в кнопке изменить имя.svg';
import logoutIcon from '../../assets/Cabinet/Иконка в Выход из системы.svg';

interface HeaderLibraryProps {
    simplified?: boolean;
}

const HeaderLibrary: React.FC<HeaderLibraryProps> = ({ simplified = false }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [userName, setUserName] = useState('');
    const [surName, setSurName] = useState('');
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('Администратор');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();
    const { closePlayer } = useMusic();

    const fetchProfile = async () => {
        try {
            const res = await apiFetch('/api/Users/profile');
            if (res.ok) {
                const data = await res.json();
                setUserName(data.name || '');
                setSurName(data.surName || '');
                setEmail(data.email || '');
                
                if (data.name && data.name !== 'Игрок') {
                    setDisplayName(data.name);
                } else {
                    setDisplayName('Администратор');
                }
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (showDropdown) {
            setSaveStatus('idle');
            setErrorMessage('');
            fetchProfile();
        }
    }, [showDropdown]);

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName.trim()) return;

        setIsSaving(true);
        setSaveStatus('idle');
        setErrorMessage('');

        const command = {
            name: userName.trim(),
            surName: surName.trim() || '-',
            email: email.trim() || 'admin@66bit.ru',
            password: null
        };

        try {
            const response = await apiFetch('/api/Users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(command)
            });

            if (response.ok) {
                setSaveStatus('success');
                const updatedName = userName.trim();
                if (updatedName && updatedName !== 'Игрок') {
                    setDisplayName(updatedName);
                } else {
                    setDisplayName('Администратор');
                }
                setTimeout(() => {
                    setSaveStatus('idle');
                }, 2000);
            } else {
                const errData = await response.json();
                setSaveStatus('error');
                setErrorMessage(errData.error || errData.message || 'Ошибка обновления.');
            }
        } catch (error) {
            console.error('Error updating profile name:', error);
            setSaveStatus('error');
            setErrorMessage('Ошибка сети.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        closePlayer();
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-change'));
        navigate('/');
    };

    return (
        <header className="header-library">
            <div className="container header-content">
                <NavLink to="/" className="logo-section" style={{ textDecoration: 'none' }} onClick={handleLogout}>
                    <img src={logoIcon} alt="Logo" className="logo-icon" />
                    <span className="logo-text">66bit</span>
                </NavLink>

                {!simplified && (
                    <div className="user-profile-container">
                        <div className="user-profile-trigger" onClick={() => setShowDropdown(!showDropdown)}>
                            <img src={avatarIcon} alt="Profile" className="profile-avatar-img" />
                            <span className="profile-role">{displayName}</span>
                            <img src={arrowIcon} alt="Chevron" className={`chevron-icon ${showDropdown ? 'open' : ''}`} />
                        </div>

                        {showDropdown && (
                            <>
                                <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
                                <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                                    <div className="profile-dropdown-title">Профиль администратора</div>
                                    
                                    <form className="profile-dropdown-form" onSubmit={handleUpdateName}>
                                        <label className="profile-input-label">Ввести имя</label>
                                        <input
                                            type="text"
                                            className="profile-input"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder="Напр. Иван Иванов"
                                            disabled={isSaving}
                                            required
                                        />
                                        
                                        <button 
                                            type="submit" 
                                            className={`profile-change-btn ${saveStatus === 'success' ? 'success' : ''}`}
                                            disabled={isSaving || !userName.trim()}
                                        >
                                            {saveStatus === 'success' ? (
                                                'Успешно!'
                                            ) : isSaving ? (
                                                'Сохранение...'
                                            ) : (
                                                <>
                                                    <img src={pencilIcon} alt="" className="pencil-icon" />
                                                    Изменить имя
                                                </>
                                            )}
                                        </button>
                                        
                                        {saveStatus === 'error' && (
                                            <div className="profile-error-msg">{errorMessage}</div>
                                        )}
                                    </form>
                                    
                                    <div className="profile-divider"></div>
                                    
                                    <button className="profile-logout-btn" onClick={handleLogout}>
                                        <img src={logoutIcon} alt="" className="logout-icon" />
                                        Выход из системы
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default HeaderLibrary;