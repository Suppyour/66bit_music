import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useMusic } from '../../context/MusicContext';
import EditProfileModal from '../EditProfileModal/EditProfileModal';
import './HeaderLibrary.css';

import logoIcon from '../../assets/SongLibrary/Лого хедер.svg';
import avatarIcon from '../../assets/SongLibrary/Аватарка новая.svg';
import arrowIcon from '../../assets/SongLibrary/Стрелка у администратора.svg';

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
                <NavLink to="/" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="logo-section" style={{ textDecoration: 'none' }}>
                    <img src={logoIcon} alt="Logo" className="logo-icon" />
                    <span className="logo-text">66bit</span>
                </NavLink>


                <div className="user-profile-container">
                    <div className="user-profile-trigger" onClick={() => setShowDropdown(!showDropdown)}>
                        <img src={avatarIcon} alt="Profile" className="profile-avatar-img" />
                        <span className="profile-role">Администратор</span>
                        <img src={arrowIcon} alt="Chevron" className={`chevron-icon ${showDropdown ? 'open' : ''}`} />
                    </div>

                    {showDropdown && (
                        <>
                            <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
                            <div className="profile-dropdown">
                                <button className="dropdown-item" onClick={() => { setShowDropdown(false); setIsEditProfileOpen(true); }}>Профиль</button>
                                <button className="dropdown-item logout-item" onClick={() => { setShowDropdown(false); handleLogout(); }}>Выйти</button>
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