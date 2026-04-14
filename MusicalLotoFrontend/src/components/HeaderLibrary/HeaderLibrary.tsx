import React from 'react';
import { NavLink } from 'react-router-dom';
import './HeaderLibrary.css';

import logoIcon from '../../assets/MainPage/Background.svg';
import avatarImg from '../../assets/SongLibrary/Аватарка.png';

const HeaderLibrary: React.FC = () => {
    return (
        <header className="header-library">
            <div className="container header-content">
                <div className="logo-section">
                    <img src={logoIcon} alt="Logo" className="logo-icon" />
                    <span className="logo-text">66bit</span>
                </div>

                <nav className="nav-menu">
                    <NavLink to="/cabinet" className="nav-link">Кабинет</NavLink>
                    <NavLink to="/library" className="nav-link">Библиотека</NavLink>
                    <NavLink to="/generator" className="nav-link">Генератор</NavLink>
                    <NavLink to="/presentation" className="nav-link">Презентация</NavLink>
                </nav>

                <div className="user-profile">
                    <img src={avatarImg} alt="Profile" className="avatar" />
                </div>
            </div>
        </header>
    );
};

export default HeaderLibrary;