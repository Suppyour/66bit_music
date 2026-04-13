import React, { useState } from 'react';
import './LoginModal.css';

import closeIcon from '../../../assets/MainPage/Закрыть на входе.svg';
import loginIcon from '../../../assets/MainPage/Лого при входе в аккаунт.svg';
import passwordIcon from '../../../assets/MainPage/Значок скрыть показать пароль.svg';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <button className="modalCloseBtn" onClick={onClose}>
          <img src={closeIcon} alt="Закрыть" />
        </button>

        <div className="modalHeader">
          <img src={loginIcon} alt="Вход" className="modalLoginIcon" />
          <h2 className="modalTitle">Вход в панель управления</h2>
          <p className="modalSubtitle">Введите ваши данные для доступа к играм</p>
        </div>

        <form className="modalForm" onSubmit={(e) => e.preventDefault()}>
          <div className="formGroup">
            <label className="formLabel">Email / Логин</label>
            <input 
              type="text" 
              className="formInput" 
              placeholder="admin@bingo.ru"
            />
          </div>

          <div className="formGroup" style={{ marginTop: '27.5px' }}>
            <label className="formLabel">Пароль</label>
            <div className="passwordInputContainer">
               <input 
                 type={showPassword ? "text" : "password"} 
                 className="formInput passwordInput" 
                 placeholder="•••••••••"
               />
               <button 
                 type="button" 
                 className="passwordToggleBtn"
                 onClick={() => setShowPassword(!showPassword)}
               >
                 <img src={passwordIcon} alt="Показать/скрыть пароль" />
               </button>
            </div>
          </div>

          <div className="formOptions">
            <label className="checkboxLabel">
              <input type="checkbox" className="customCheckbox" />
              Запомнить меня
            </label>
            <a href="#" className="forgotPassword">Забыли пароль?</a>
          </div>

          <button type="submit" className="loginSubmitBtn">
             Войти
          </button>
          
          <div className="modalFooter">
            <span className="noAccountText">Нет аккаунта? </span>
            <a href="#" className="createAccountLink">Создать аккаунт</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
