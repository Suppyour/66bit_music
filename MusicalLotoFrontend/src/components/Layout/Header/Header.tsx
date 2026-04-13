import React from 'react';
import './Header.css';
import logoIcon from '../../../assets/MainPage/Background.svg';
import loginIcon from '../../../assets/MainPage/SVG войти.svg';
import registerIcon from '../../../assets/MainPage/SVG регистрация.svg';

interface HeaderProps {
  onLoginClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logoContainer">
          <img src={logoIcon} alt="Musical Loto Logo" className="logoIcon" />
          <span className="logoText">66bit</span>
        </div>

        <div className="authContainer">
          <button className="btnLogin" onClick={onLoginClick}>
            <img src={loginIcon} alt="Login" />
            Войти
          </button>
          <button className="btnRegister">
            <img src={registerIcon} alt="Register" />
            Регистрация
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
