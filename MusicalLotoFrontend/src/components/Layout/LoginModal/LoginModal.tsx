import React, { useState, useEffect } from 'react';
import './LoginModal.css';

import closeIcon from '../../../assets/MainPage/Закрыть на входе.svg';
import loginIcon from '../../../assets/MainPage/Лого при входе в аккаунт.svg';
import passwordIcon from '../../../assets/MainPage/Значок скрыть показать пароль.svg';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRegisterMode?: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, initialRegisterMode = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(initialRegisterMode);
  const [errorStr, setErrorStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRegisterMode(initialRegisterMode);
      setErrorStr('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialRegisterMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterMode && password !== confirmPassword) {
        setErrorStr('Пароли не совпадают');
        return;
    }
    
    setErrorStr('');
    setIsLoading(true);

    const url = isRegisterMode ? '/api/Auth/register' : '/api/Auth/login';
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setIsRegisterMode(false);
            onClose();
        } else {
            setErrorStr(data.error || data.title || 'Ошибка сервера');
        }
    } catch (err) {
        console.error(err);
        setErrorStr('Ошибка сети');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <button className="modalCloseBtn" onClick={onClose} disabled={isLoading}>
          <img src={closeIcon} alt="Закрыть" />
        </button>

        <div className="modalHeader">
          <img src={loginIcon} alt="Вход" className="modalLoginIcon" />
          <h2 className="modalTitle">{isRegisterMode ? 'Регистрация' : 'Вход в панель управления'}</h2>
          <p className="modalSubtitle">
            {isRegisterMode 
              ? 'Создайте учетную запись для организации игровых сессий' 
              : 'Введите ваши данные для доступа к играм'}
          </p>
        </div>

        <form className="modalForm" onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="formLabel">Email / Логин</label>
            <input 
              type="text" 
              className="formInput" 
              placeholder="admin@bingo.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="formGroup" style={{ marginTop: '27.5px' }}>
            <label className="formLabel">Пароль</label>
            <div className="passwordInputContainer">
               <input 
                 type={showPassword ? "text" : "password"} 
                 className="formInput passwordInput" 
                 placeholder="•••••••••"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
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

          {isRegisterMode && (
            <div className="formGroup" style={{ marginTop: '27.5px' }}>
              <label className="formLabel">Подтверждение пароля</label>
              <div className="passwordInputContainer">
                 <input 
                   type={showConfirmPassword ? "text" : "password"} 
                   className="formInput passwordInput" 
                   placeholder="•••••••••"
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                 />
                 <button 
                   type="button" 
                   className="passwordToggleBtn"
                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                 >
                   <img src={passwordIcon} alt="Показать/скрыть пароль" />
                 </button>
              </div>
            </div>
          )}

          {!isRegisterMode && (
            <div className="formOptions">
              <label className="checkboxLabel">
                <input type="checkbox" className="customCheckbox" />
                Запомнить меня
              </label>
              <a href="#" className="forgotPassword">Забыли пароль?</a>
            </div>
          )}

          {errorStr && <div style={{color: 'red', marginTop: 10, fontSize: 14, textAlign: 'center'}}>{errorStr}</div>}

          <button type="submit" className="loginSubmitBtn" disabled={isLoading} style={{marginTop: 40}}>
             {isLoading ? 'Загрузка...' : (isRegisterMode ? 'Зарегистрироваться' : 'Войти')}
          </button>
          
          <div className="modalFooter">
            <span className="noAccountText">
                {isRegisterMode ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
            </span>
            <a href="#" className="createAccountLink" onClick={(e) => {
                e.preventDefault();
                setIsRegisterMode(!isRegisterMode);
                setErrorStr('');
            }}>
                {isRegisterMode ? 'Войти' : 'Создать аккаунт'}
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  };

export default LoginModal;
