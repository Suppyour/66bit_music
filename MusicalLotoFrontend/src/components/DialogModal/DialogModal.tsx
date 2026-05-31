import React, { useEffect } from 'react';
import './DialogModal.css';

interface DialogModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    isAlert?: boolean; // if true, hide the Cancel button
    isDanger?: boolean; // if true, make the Confirm button red
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const DialogModal: React.FC<DialogModalProps> = ({ 
    isOpen, 
    title = 'Подтверждение', 
    message, 
    isAlert = false,
    isDanger = false,
    confirmText = 'ОК',
    cancelText = 'Отмена',
    onConfirm, 
    onCancel 
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="dialog-modal-overlay" onClick={onCancel}>
            <div className="dialog-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="dialog-modal-close-btn" onClick={onCancel}>✕</button>
                
                <h3 className="dialog-modal-title">{title}</h3>
                <p className="dialog-modal-message">{message}</p>
                
                <div className="dialog-modal-actions">
                    {!isAlert && (
                        <button className="dialog-btn dialog-btn-cancel" onClick={onCancel}>
                            {cancelText}
                        </button>
                    )}
                    <button 
                        className={`dialog-btn dialog-btn-confirm ${isDanger ? 'dialog-btn-danger' : 'dialog-btn-primary'}`} 
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DialogModal;
