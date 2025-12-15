import React from 'react';
import { FloatingText } from '../types';

interface Props {
  texts: FloatingText[];
}

const FloatingTexts: React.FC<Props> = ({ texts }) => {
  return (
    <>
      {texts.map((ft) => (
        <div
          key={ft.id}
          className="float-text"
          style={{
            left: ft.x,
            top: ft.y,
            color: ft.color,
          }}
        >
          {ft.text}
        </div>
      ))}
    </>
  );
};

export default FloatingTexts;