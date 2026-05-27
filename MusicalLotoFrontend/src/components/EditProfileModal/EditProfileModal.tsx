import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import './EditProfileModal.css';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [surName, setSurName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
            setErrorMsg(null);
            setSuccessMsg(null);
            setPassword('');
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const response = await apiFetch('/api/Users/profile');
            if (response.ok) {
                const data = await response.json();
                setName(data.name || '');
                setSurName(data.surName || '');
                setEmail(data.email || '');
            } else {
                setErrorMsg('Не удалось загрузить данные профиля.');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setErrorMsg('Ошибка сети при загрузке профиля.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        const command = {
            name,
            surName,
            email,
            password: password.trim() ? password : null
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
                setSuccessMsg('Профиль успешно обновлен!');
                setPassword('');
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                const errData = await response.json();
                setErrorMsg(errData.error || errData.message || 'Ошибка обновления профиля.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setErrorMsg('Ошибка сети при сохранении профиля.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content profile-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>
                
                <div className="modal-header">
                    <div className="modal-icon-wrapper profile-icon-wrapper">
                        👤
                    </div>
                    <h2 className="modal-title">Редактирование профиля</h2>
                </div>

                {isLoading ? (
                    <div className="profile-modal-loading">
                        <div className="profile-spinner"></div>
                        <p>Загрузка данных...</p>
                    </div>
                ) : (
                    <form className="add-song-form" onSubmit={handleSubmit}>
                        {errorMsg && <div className="profile-alert profile-alert-error">{errorMsg}</div>}
                        {successMsg && <div className="profile-alert profile-alert-success">{successMsg}</div>}

                        <div className="form-group">
                            <label className="form-label">Имя <span className="required">*</span></label>
                            <input 
                                type="text" 
                                className="form-input" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required 
                                placeholder="Ваше имя"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Фамилия <span className="required">*</span></label>
                            <input 
                                type="text" 
                                className="form-input" 
                                value={surName} 
                                onChange={(e) => setSurName(e.target.value)} 
                                required 
                                placeholder="Ваша фамилия"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email <span className="required">*</span></label>
                            <input 
                                type="email" 
                                className="form-input" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                placeholder="example@mail.com"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Новый пароль (оставьте пустым для сохранения прежнего)</label>
                            <input 
                                type="password" 
                                className="form-input" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="Минимум 6 символов"
                                minLength={6}
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSaving}>
                                Отмена
                            </button>
                            <button type="submit" className="btn-submit" disabled={isSaving}>
                                {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditProfileModal;
