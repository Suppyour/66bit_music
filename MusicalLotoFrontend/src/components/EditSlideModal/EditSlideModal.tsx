import React, { useState, useRef, useEffect } from 'react';
import './EditSlideModal.css';
import { apiFetch } from '../../utils/api';

export interface Slide {
    id: string;
    type: 'Title' | 'Rules' | 'GameBoard' | 'QrCode' | 'Song' | 'Winner';
    title?: string;
    content?: string;
    backgroundColor?: string;
    backgroundImageUrl?: string;
    order: number;
    isRequired: boolean;
    songId?: string;
}

interface EditSlideModalProps {
    isOpen: boolean;
    slide: Slide;
    sessionId: string;
    onClose: () => void;
    onSave: (updatedSlide: Slide) => void;
}

const PRESET_COLORS = [
    '#2563EB', // Синий
    '#EF4444', // Красный
    '#22C55E', // Зеленый
    '#451A03', // Темно-коричневый
];

const EditSlideModal: React.FC<EditSlideModalProps> = ({
    isOpen,
    slide,
    sessionId,
    onClose,
    onSave,
}) => {
    // Safe conversion of slide.type from number to string representation
    const slideTypeStr = typeof slide.type === 'number'
        ? ['Title', 'Rules', 'GameBoard', 'QrCode', 'Song', 'Winner'][slide.type] || 'Title'
        : String(slide.type);

    const [title, setTitle] = useState(slide.title || '');
    const [content, setContent] = useState(slide.content || '');
    const [bgColor, setBgColor] = useState(slide.backgroundColor || '#2563EB');
    const [bgImageUrl, setBgImageUrl] = useState<string | null>(slide.backgroundImageUrl || null);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setTitle(slide.title || '');
        setContent(slide.content || '');
        setBgColor(slide.backgroundColor || '#2563EB');
        setBgImageUrl(slide.backgroundImageUrl || null);
    }, [slide]);

    if (!isOpen) return null;

    const handleColorSelect = (color: string) => {
        setBgColor(color);
        setBgImageUrl(null); // Сбрасываем фоновую картинку при выборе цвета
    };

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBgColor(e.target.value);
        setBgImageUrl(null);
    };

    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiFetch(`/api/Games/${sessionId}/presentation/slides/${slide.id}/background`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setBgImageUrl(data.url);
                setBgColor(''); // Очищаем сплошной цвет при загрузке картинки
            } else {
                alert('Не удалось загрузить фоновое изображение');
            }
        } catch (error) {
            console.error('Ошибка загрузки фона слайда:', error);
            alert('Ошибка при соединении с сервером');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = () => {
        onSave({
            ...slide,
            title,
            content,
            backgroundColor: bgColor,
            backgroundImageUrl: bgImageUrl || undefined,
        });
    };

    const insertMarkdown = (syntax: string, endSyntax = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const selectedText = text.substring(start, end);
        const replacement = syntax + selectedText + endSyntax;

        setContent(
            text.substring(0, start) + replacement + text.substring(end)
        );

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + syntax.length,
                start + syntax.length + selectedText.length
            );
        }, 0);
    };

    return (
        <div className="edit-slide-modal-overlay">
            <div className="edit-slide-modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="edit-slide-modal-close" onClick={onClose}>
                    &times;
                </button>

                <h2 className="edit-slide-modal-title">
                    {slideTypeStr === 'Title' && 'Редактирование титульного слайда'}
                    {slideTypeStr === 'Rules' && 'Редактирование правила игры'}
                    {slideTypeStr === 'GameBoard' && 'Редактирование игрового поля'}
                    {slideTypeStr === 'QrCode' && 'Редактирование QR-кода'}
                    {slideTypeStr === 'Song' && 'Редактирование слайда песни'}
                    {slideTypeStr === 'Winner' && 'Редактирование слайда победителя'}
                </h2>

                <div className="edit-slide-modal-content">
                    {(slideTypeStr === 'Title' || slideTypeStr === 'GameBoard') && (
                        <div className="edit-slide-field-group">
                            <label className="edit-slide-field-label">Название</label>
                            <input
                                type="text"
                                className="edit-slide-field-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={slideTypeStr === 'Title' ? "Введите название игры" : "Введите заголовок слайда"}
                            />
                        </div>
                    )}

                    {slideTypeStr === 'Rules' && (
                        <div className="edit-slide-field-group">
                            <label className="edit-slide-field-label">Текст правил</label>
                            <div className="rules-editor-toolbar">
                                <button type="button" onClick={() => insertMarkdown('**', '**')} title="Жирный">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>
                                    </svg>
                                </button>
                                <button type="button" onClick={() => insertMarkdown('*', '*')} title="Курсив">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="19" y1="4" x2="10" y2="4"/>
                                        <line x1="14" y1="20" x2="5" y2="20"/>
                                        <line x1="15" y1="4" x2="9" y2="20"/>
                                    </svg>
                                </button>
                                <button type="button" onClick={() => insertMarkdown('\n- ')} title="Список">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="8" y1="6" x2="21" y2="6"/>
                                        <line x1="8" y1="12" x2="21" y2="12"/>
                                        <line x1="8" y1="18" x2="21" y2="18"/>
                                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                            <textarea
                                ref={textareaRef}
                                className="edit-slide-field-textarea"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Введите правила..."
                                rows={6}
                            />
                        </div>
                    )}

                    {(slideTypeStr === 'GameBoard' || slideTypeStr === 'QrCode' || slideTypeStr === 'Winner') && (
                        <div className="edit-slide-field-group">
                            <label className="edit-slide-field-label">Текст</label>
                            <input
                                type="text"
                                className="edit-slide-field-input"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={
                                    slideTypeStr === 'QrCode' ? 'Ссылка для входа' : 'Введите текст на слайде'
                                }
                            />
                        </div>
                    )}

                    {slideTypeStr === 'Song' && (
                        <>
                            <div className="edit-slide-field-group">
                                <label className="edit-slide-field-label">Название песни</label>
                                <input
                                    type="text"
                                    className="edit-slide-field-input"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="edit-slide-field-group">
                                <label className="edit-slide-field-label">Исполнитель</label>
                                <input
                                    type="text"
                                    className="edit-slide-field-input"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* Выбор фона слайда */}
                    <div className="edit-slide-field-group">
                        <label className="edit-slide-field-label">Фон слайда</label>
                        <div className="background-selector-container">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`bg-preset-circle ${
                                        bgColor === color && !bgImageUrl ? 'active' : ''
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleColorSelect(color)}
                                />
                            ))}

                            {/* Color picker */}
                            <div className="bg-custom-color-picker-wrapper">
                                <input
                                    type="color"
                                    id="bg-custom-color-picker"
                                    value={bgColor.startsWith('#') ? bgColor : '#2563EB'}
                                    onChange={handleCustomColorChange}
                                />
                                <label htmlFor="bg-custom-color-picker" className="bg-custom-color-btn" title="Выбрать цвет">
                                    <div className="bg-gradient-circle"></div>
                                </label>
                            </div>

                            {/* Upload image */}
                            <button
                                type="button"
                                className={`bg-image-upload-btn ${bgImageUrl ? 'has-image' : ''}`}
                                onClick={handleImageUploadClick}
                                disabled={isUploading}
                                title={bgImageUrl ? 'Фоновое изображение загружено' : 'Загрузить фоновое изображение'}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                                {isUploading ? (
                                    <span className="spinner"></span>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                        <polyline points="21 15 16 10 5 21"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="edit-slide-modal-footer">
                    <button type="button" className="btn-edit-slide-cancel" onClick={onClose}>
                        Отмена
                    </button>
                    <button type="button" className="btn-edit-slide-save" onClick={handleSave}>
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditSlideModal;
