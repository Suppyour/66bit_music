import React, { type ReactNode } from 'react';
import './PrintCard.css';

export interface Song {
    id: string;
    title: string;
    artist: string;
}

export interface CardCellData {
    row: number;
    column: number;
    songId: string;
}

export interface CardDto {
    id: string;
    cells: CardCellData[];
    cuteName?: string;
}

export interface PrintCardProps {
    card: CardDto | null;
    cardSize: number;
    selectedSongs: Song[];
    rules: number;
    accentColor: string;
    fontFamily: string;
    companyName: string;
    editionName: string;
    titleText: string;
    footerText: string;
    backgroundImage?: string | null;
    renderGridWrapper?: (gridElement: ReactNode) => ReactNode;
    renderCell?: (cell: CardCellData) => ReactNode;
}

export const StaticCell = ({ song, isCenter, accentColor }: { song?: Song; isCenter?: boolean; accentColor?: string }) => {
    return (
        <div className="bingo-cell">
            {isCenter && (
                <>
                    <svg className="corner-bow top-left" viewBox="0 0 100 100" style={{ stroke: accentColor }}><path d="M 50 50 C 20 20, 20 80, 50 50 C 80 20, 80 80, 50 50 M 50 50 L 30 90 M 50 50 L 70 90" fill="none" strokeWidth="8" strokeLinecap="round" /></svg>
                    <svg className="corner-bow top-right" viewBox="0 0 100 100" style={{ stroke: accentColor }}><path d="M 50 50 C 20 20, 20 80, 50 50 C 80 20, 80 80, 50 50 M 50 50 L 30 90 M 50 50 L 70 90" fill="none" strokeWidth="8" strokeLinecap="round" /></svg>
                    <svg className="corner-bow bottom-left" viewBox="0 0 100 100" style={{ stroke: accentColor }}><path d="M 50 50 C 20 20, 20 80, 50 50 C 80 20, 80 80, 50 50 M 50 50 L 30 90 M 50 50 L 70 90" fill="none" strokeWidth="8" strokeLinecap="round" /></svg>
                    <svg className="corner-bow bottom-right" viewBox="0 0 100 100" style={{ stroke: accentColor }}><path d="M 50 50 C 20 20, 20 80, 50 50 C 80 20, 80 80, 50 50 M 50 50 L 30 90 M 50 50 L 70 90" fill="none" strokeWidth="8" strokeLinecap="round" /></svg>
                </>
            )}
            <div className="cell-title" title={song ? `${song.artist} – ${song.title}` : 'Пустая ячейка'}>
                {song ? `${song.artist} – ${song.title}` : '...'}
            </div>
        </div>
    );
};

export const PrintCard: React.FC<PrintCardProps> = ({
    card,
    cardSize,
    selectedSongs,
    rules,
    accentColor,
    fontFamily,
    companyName,
    editionName,
    titleText,
    footerText,
    backgroundImage,
    renderGridWrapper,
    renderCell
}) => {

    if (!card) {
        return (
            <div
                className="print-card-container empty-card-container"
                style={{
                    '--accent-color': accentColor,
                    fontFamily: fontFamily === 'Playfair Display' ? "'Playfair Display', serif" : fontFamily === 'Montserrat' ? "'Montserrat', sans-serif" : "'Inter', sans-serif"
                } as React.CSSProperties}
            >
                <div className="inner-border-box">
                    <div className="card-left-panel">
                        <div className="bingo-card empty-card" style={{ gridTemplateColumns: `repeat(${cardSize}, 1fr)`, opacity: 0.5 }}>
                            {Array.from({ length: cardSize * cardSize }).map((_, i) => (
                                <div key={i} className="bingo-cell empty-cell">
                                    <div className="cell-icon">...</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const gridStyle = {
        gridTemplateColumns: `repeat(${cardSize}, 1fr)`,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: backgroundImage ? 'cover' : undefined,
        backgroundPosition: backgroundImage ? 'center' : undefined,
        backgroundColor: backgroundImage ? 'transparent' : undefined,
    };

    const gridContent = card.cells.map(cell => {
        if (renderCell) {
            return renderCell(cell);
        }
        const song = selectedSongs.find(s => s.id === cell.songId);
        const centerIndex = Math.floor(cardSize / 2);
        const isCenter = cardSize % 2 !== 0 && cell.row === centerIndex && cell.column === centerIndex;
        return <StaticCell key={`${cell.row}-${cell.column}`} song={song} isCenter={isCenter} accentColor={accentColor} />;
    });

    const gridElement = (
        <div className="bingo-card" style={gridStyle}>
            {gridContent}
        </div>
    );

    return (
        <div
            className="print-card-container"
            style={{
                '--accent-color': accentColor,
                fontFamily: fontFamily === 'Playfair Display' ? "'Playfair Display', serif" : fontFamily === 'Montserrat' ? "'Montserrat', sans-serif" : "'Inter', sans-serif"
            } as React.CSSProperties}
        >
            <div className="inner-border-box">
                <div className="card-left-panel">
                    <div className="card-header-left">
                        <strong>{companyName}</strong>
                    </div>
                    <div className="card-header-center">
                        <span>{editionName}</span>
                    </div>

                    <div className="title-row">
                        <span className="title-line"></span>
                        <h2 className="card-title-text" style={{ fontFamily: fontFamily === 'Playfair Display' ? "'Playfair Display', serif" : undefined }}>
                            {titleText}
                        </h2>
                        <span className="title-line"></span>
                    </div>

                    {card.cuteName && (
                        <div className="card-subtitle-code" style={{ color: accentColor }}>
                            Код билета: {card.cuteName}
                        </div>
                    )}

                    {renderGridWrapper ? renderGridWrapper(gridElement) : gridElement}

                    <div className="card-footer-row">
                        <span>{footerText}</span>
                    </div>
                </div>

                <div className="card-right-panel">
                    <div className="scissors-label">
                        <span className="scissors-icon">✂</span> — твоя уникальная песня
                    </div>
                    <div className="rules-panel-title">Победные комбинации</div>

                    <div className="mini-grids-container">
                        {/* Horizontal rule (1) */}
                        {(rules & 1) !== 0 && (
                            <div className="mini-grid-wrapper">
                                <div
                                    className="mini-grid-layout horizontal-rule"
                                    style={{ '--accent-color-rule': accentColor } as React.CSSProperties}
                                >
                                    {Array.from({ length: 25 }).map((_, idx) => (
                                        <div key={idx} className="mini-grid-cell" />
                                    ))}
                                </div>
                                <span className="mini-grid-label">5 песен в одном ряду</span>
                            </div>
                        )}

                        {/* Vertical rule (2) */}
                        {(rules & 2) !== 0 && (
                            <div className="mini-grid-wrapper">
                                <div
                                    className="mini-grid-layout vertical-rule"
                                    style={{ '--accent-color-rule': accentColor } as React.CSSProperties}
                                >
                                    {Array.from({ length: 25 }).map((_, idx) => (
                                        <div key={idx} className="mini-grid-cell" />
                                    ))}
                                </div>
                                <span className="mini-grid-label">5 песен в одной колонке</span>
                            </div>
                        )}

                        {/* Diagonal rule (8) */}
                        {(rules & 8) !== 0 && (
                            <div className="mini-grid-wrapper">
                                <div
                                    className="mini-grid-layout diagonal-rule"
                                    style={{ '--accent-color-rule': accentColor } as React.CSSProperties}
                                >
                                    {Array.from({ length: 25 }).map((_, idx) => {
                                        const row = Math.floor(idx / 5);
                                        const col = idx % 5;
                                        const isAccent = row === col || row + col === 4;
                                        return (
                                            <div
                                                key={idx}
                                                className={isAccent ? "mini-grid-cell active-cross" : "mini-grid-cell"}
                                                style={isAccent ? { borderColor: accentColor, color: accentColor } : {}}
                                            >
                                                {isAccent ? "✕" : ""}
                                            </div>
                                        );
                                    })}
                                </div>
                                <span className="mini-grid-label">5 песен подряд по диагонали</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
