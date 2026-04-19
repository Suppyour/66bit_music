import React, { useState, useEffect } from 'react';
import './AddSongModal.css';
import logoIcon from '../../assets/SongLibrary/Лого в Добавить песню.svg';

interface AddSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Оставляем возможность прокинуть загрузку позже
    onUpload?: (formData: FormData) => void;
    isUploading?: boolean;
}

const AddSongModal: React.FC<AddSongModalProps> = ({ isOpen, onClose, onUpload, isUploading }) => {
    const [audioFileName, setAudioFileName] = useState<string | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setAudioFileName(null);
            setCoverImagePreview(null);
        }
    }, [isOpen]);

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAudioFileName(e.target.files[0].name);
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setCoverImagePreview(URL.createObjectURL(file));
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        if (onUpload) {
            onUpload(formData);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    ✕
                </button>

                <div className="modal-header">
                    <div className="modal-icon-wrapper">
                        <img src={logoIcon} alt="Music Logo" />
                    </div>
                    <h2 className="modal-title">Добавить песню</h2>
                </div>

                <form className="add-song-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">
                            Название песни <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            name="Title"
                            placeholder="Введите название песни"
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Исполнитель <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            name="Artist"
                            placeholder="Введите имя исполнителя"
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Аудио или видео файл <span className="required">*</span>
                        </label>
                        <div className="drag-drop-zone">
                            {audioFileName ? (
                                <div className="file-success-preview">
                                    <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="file-icon-svg">
                                        <path d="M4 4C4 1.79086 5.79086 0 8 0H24L40 16V44C40 46.2091 38.2091 48 36 48H8C5.79086 48 4 46.2091 4 44V4Z" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2"/>
                                        <path d="M24 0V12C24 14.2091 25.7909 16 28 16H40" fill="#E5E7EB"/>
                                        <path d="M23.5 21V33" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M27.5 25L23.5 26.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="21" cy="33" r="2.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <p className="file-success-name">{audioFileName}</p>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="file-success-check">
                                        <circle cx="12" cy="12" r="12" fill="#22C55E"/>
                                        <path d="M7 12.5L10.5 16L17.5 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            ) : (
                                <>
                                    <span className="drag-drop-icon">🎵</span>
                                    <p className="drag-drop-text">
                                        Перетащите аудио/видео сюда или нажмите для выбора
                                    </p>
                                    <p className="drag-drop-subtext">
                                        Поддерживаемые форматы: MP3, WAV, MP4
                                    </p>
                                </>
                            )}
                            <input type="file" name="AudioFile" className="file-input" accept="audio/*,video/mp4" required onChange={handleAudioChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Фоновое изображение (обложка) <span className="required">*</span>
                        </label>
                        <div className={`drag-drop-zone ${coverImagePreview ? 'has-preview' : ''}`}>
                            {coverImagePreview ? (
                                <img src={coverImagePreview} alt="Cover preview" className="cover-image-preview" />
                            ) : (
                                <>
                                    <span className="drag-drop-icon">🖼️</span>
                                    <p className="drag-drop-text">
                                        Перетащите обложку сюда или нажмите для выбора
                                    </p>
                                    <p className="drag-drop-subtext">Формат: JPG, PNG</p>
                                </>
                            )}
                            <input type="file" name="CoverImage" className="file-input" accept="image/jpeg,image/png" required onChange={handleCoverChange} />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={isUploading}>
                            Отмена
                        </button>
                        <button type="submit" className="btn-submit" disabled={isUploading}>
                            {isUploading ? 'Загрузка...' : 'Добавить песню'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSongModal;
