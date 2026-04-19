import React from 'react';
import './AddSongModal.css';
import logoIcon from '../../assets/SongLibrary/Лого в Добавить песню.svg';

interface AddSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Оставляем возможность прокинуть загрузку позже
    onUpload?: (formData: FormData) => void;
}

const AddSongModal: React.FC<AddSongModalProps> = ({ isOpen, onClose, onUpload }) => {
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
                            {/* Placeholder icon */}
                            <span className="drag-drop-icon">🎵</span>
                            <p className="drag-drop-text">
                                Перетащите аудио/видео сюда или нажмите для выбора
                            </p>
                            <p className="drag-drop-subtext">
                                Поддерживаемые форматы: MP3, WAV, MP4
                            </p>
                            <input type="file" name="AudioFile" className="file-input" accept="audio/*,video/mp4" required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Фоновое изображение (обложка) <span className="required">*</span>
                        </label>
                        <div className="drag-drop-zone">
                            {/* Placeholder icon */}
                            <span className="drag-drop-icon">🖼️</span>
                            <p className="drag-drop-text">
                                Перетащите обложку сюда или нажмите для выбора
                            </p>
                            <p className="drag-drop-subtext">Формат: JPG, PNG</p>
                            <input type="file" name="CoverImage" className="file-input" accept="image/jpeg,image/png" required />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="btn-submit">
                            Добавить песню
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSongModal;
