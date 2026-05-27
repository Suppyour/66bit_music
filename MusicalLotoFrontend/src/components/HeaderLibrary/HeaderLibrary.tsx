import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useMusic } from '../../context/MusicContext';
import EditProfileModal from '../EditProfileModal/EditProfileModal';
import './HeaderLibrary.css';

import logoIcon from '../../assets/MainPage/Background.svg';
import avatarImg from '../../assets/SongLibrary/Аватарка.png';

const HeaderLibrary: React.FC = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const navigate = useNavigate();
    const { closePlayer } = useMusic();

    const handleLogout = () => {
        closePlayer();
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-change'));
        navigate('/');
    };

    return (
        <header className="header-library">
            <div className="container header-content">
                <NavLink to="/" className="logo-section" style={{ textDecoration: 'none' }}>
                    <img src={logoIcon} alt="Logo" className="logo-icon" />
                    <span className="logo-text">66bit</span>
                </NavLink>

                <nav className="nav-menu">
                    <NavLink to="/cabinet" className="nav-link">Кабинет</NavLink>
                    <NavLink to="/library" className="nav-link">Библиотека</NavLink>
                    <NavLink to="/generator" className="nav-link">Генератор</NavLink>
                    <NavLink to="/presentation" className="nav-link">Презентация</NavLink>
                </nav>

                <div className="user-profile" style={{ position: 'relative' }}>
                    <img 
                        src={avatarImg} 
                        alt="Profile" 
                        className="avatar" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowDropdown(!showDropdown)} 
                    />
                    {showDropdown && (
                        <>
                            <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
                            <div className="profile-dropdown">
                                <button className="dropdown-item" onClick={() => { setShowDropdown(false); setIsEditProfileOpen(true); }}>Профиль</button>
                                <button className="dropdown-item" onClick={handleLogout}>Выйти</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <EditProfileModal 
                isOpen={isEditProfileOpen} 
                onClose={() => setIsEditProfileOpen(false)} 
            />
        </header>
    );
};

export default HeaderLibrary;