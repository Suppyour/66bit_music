import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-copyright">
          © 2026 Музлото
        </div>
        <span className="footer-policy">
          Политика конфиденциальности
        </span>
      </div>
    </footer>
  );
};

export default Footer;
