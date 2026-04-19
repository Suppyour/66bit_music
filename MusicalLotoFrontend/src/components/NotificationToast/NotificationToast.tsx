import React, { useEffect } from 'react';
import './NotificationToast.css';

export type NotificationType = 'add' | 'edit' | 'delete' | 'play';

interface NotificationToastProps {
    show: boolean;
    type: NotificationType;
    songDetails: string;
    onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ show, type, songDetails, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    let title = '';
    let colorClass = '';

    if (type === 'delete') {
        title = 'Песня успешно удалена';
        colorClass = 'toast-delete';
    } else if (type === 'add') {
        title = 'Песня успешно добавлена';
        colorClass = 'toast-add';
    } else if (type === 'edit') {
        title = 'Изменения успешно сохранены';
        colorClass = 'toast-edit';
    } else if (type === 'play') {
        title = 'Воспроизведение песни';
        colorClass = 'toast-play';
    }

    return (
        <div className={`notification-toast ${colorClass}`}>
            <div className="toast-content">
                <h3 className="toast-title">{title}</h3>
                <p className="toast-subtitle">{songDetails}</p>
            </div>
            <button className="toast-close" onClick={onClose}>✕</button>
        </div>
    );
};

export default NotificationToast;
