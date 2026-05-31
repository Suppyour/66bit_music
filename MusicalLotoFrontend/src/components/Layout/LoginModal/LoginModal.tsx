import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(initialRegisterMode);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  const [errorStr, setErrorStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      setIsRegisterMode(initialRegisterMode);
      setIsForgotPasswordMode(false);
      setIsResetSuccess(false);
      setErrorStr('');
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, initialRegisterMode, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isForgotPasswordMode) {
      if (!email) {
        setErrorStr('Введите email');
        return;
      }
      if (password !== confirmPassword) {
        setErrorStr('Пароли не совпадают');
        return;
      }
      if (password.length < 6) {
        setErrorStr('Пароль должен содержать минимум 6 символов');
        return;
      }
      setErrorStr('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/Auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: password })
        });

        const data = await response.json();

        if (response.ok) {
          setIsResetSuccess(true);
        } else {
          setErrorStr(data.error || data.title || 'Ошибка сброса пароля');
        }
      } catch (err) {
        console.error(err);
        setErrorStr('Ошибка сети');
      } finally {
        setIsLoading(false);
      }
      
      return;
    }

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
        window.dispatchEvent(new Event('auth-change'));
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setIsRegisterMode(false);
        navigate('/cabinet');
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
    <div className="modalOverlay">
      <div className={`modalContent ${isRegisterMode ? 'registerMode' : ''} ${isForgotPasswordMode ? 'forgotPasswordMode' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="modalCloseBtn" onClick={onClose} disabled={isLoading}>
          <img src={closeIcon} alt="Закрыть" />
        </button>

        <div className="modalHeader">
          <img src={loginIcon} alt="Вход" className="modalLoginIcon" />
          <h2 className="modalTitle">
            {isForgotPasswordMode
              ? 'Восстановление пароля'
              : (isRegisterMode ? 'Регистрация' : 'Вход в панель управления')}
          </h2>
          <p className="modalSubtitle">
            {isForgotPasswordMode
              ? 'Введите ваш Email и новый пароль для восстановления доступа'
              : (isRegisterMode
                ? 'Создайте учетную запись для организации игровых сессий'
                : 'Введите ваши данные для доступа к играм')}
          </p>
        </div>

        <form className="modalForm" onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="formLabel">{isForgotPasswordMode ? 'Email' : 'Email / Логин'}</label>
            <input
              type="text"
              className="formInput"
              placeholder="admin@bingo.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="formGroup" style={{ marginTop: isRegisterMode ? '27.5px' : '41.25px' }}>
            <label className="formLabel">{isForgotPasswordMode ? 'Новый пароль' : 'Пароль'}</label>
            <div className="passwordInputContainer">
              <input
                type={showPassword ? "text" : "password"}
                className="formInput passwordInput"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          {(isRegisterMode || isForgotPasswordMode) && (
            <div className="formGroup" style={{ marginTop: '27.5px' }}>
              <label className="formLabel">{isForgotPasswordMode ? 'Подтвердите новый пароль' : 'Подтверждение пароля'}</label>
              <div className="passwordInputContainer">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="formInput passwordInput"
                  placeholder="•••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
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

          {(!isRegisterMode && !isForgotPasswordMode) && (
            <div className="formOptions">
              <label className="checkboxLabel">
                <input type="checkbox" className="customCheckbox" />
                Запомнить меня
              </label>
              <a href="#" className="forgotPassword" onClick={(e) => {
                e.preventDefault();
                setIsForgotPasswordMode(true);
                setErrorStr('');
                setPassword('');
                setConfirmPassword('');
              }}>Забыли пароль?</a>
            </div>
          )}

          {errorStr && <div style={{ color: 'red', marginTop: 10, fontSize: 14, textAlign: 'center' }}>{errorStr}</div>}

          <button type="submit" className="loginSubmitBtn" disabled={isLoading} style={{ marginTop: isRegisterMode ? '39.88px' : '27px' }}>
            {isLoading ? 'Загрузка...' : (isForgotPasswordMode ? 'Сбросить пароль' : (isRegisterMode ? 'Зарегистрироваться' : 'Войти'))}
          </button>

          {isForgotPasswordMode && isResetSuccess && (
            <div className="resetSuccessMessage" style={{ color: 'green', marginTop: 10, fontSize: 14, textAlign: 'center' }}>
              Пароль успешно обновлен! Теперь вы можете войти.
            </div>
          )}

          {isForgotPasswordMode ? (
            <div className="modalFooter">
              <a href="#" className="backToLoginLink" onClick={(e) => {
                e.preventDefault();
                setIsForgotPasswordMode(false);
                setIsResetSuccess(false);
                setErrorStr('');
                setPassword('');
                setConfirmPassword('');
              }}>
                Вернуться ко входу
              </a>
            </div>
          ) : (
            <div className="modalFooter">
              <span className="noAccountText">
                {isRegisterMode ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
              </span>
              <a href="#" className="createAccountLink" onClick={(e) => {
                e.preventDefault();
                setIsRegisterMode(!isRegisterMode);
                setErrorStr('');
                setPassword('');
                setConfirmPassword('');
              }}>
                {isRegisterMode ? 'Войти' : 'Создать аккаунт'}
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
