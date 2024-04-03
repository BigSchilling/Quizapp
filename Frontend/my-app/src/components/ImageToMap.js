import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const ImageToMap = () => {
  const [selectedPixel, setSelectedPixel] = useState(null);

  // Funktion, die aufgerufen wird, wenn auf das Bild geklickt wird
  const handleImageClick = (event) => {
    // Position des Klicks relativ zum Bild
    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;

    // Hier könntest du die Position in Pixelkoordinaten umrechnen
    // basierend auf der aktuellen Zoomstufe

    // Beispiel: Umrechnung für ursprüngliche Bildgröße
    const scale = event.scale;
    const originalWidth = event.target.naturalWidth;
    const originalHeight = event.target.naturalHeight;
    const pixelX = Math.round(x / scale);
    const pixelY = Math.round(y / scale);

    // Setze den ausgewählten Pixel
    setSelectedPixel({ x: pixelX, y: pixelY });
  };

  return (
    <div>
      {/* Bild mit ReactPanZoom-Komponente anzeigen */}
      <TransformWrapper>
      <TransformComponent>
        <img src="https://infocafe.org/wp-content/uploads/2021/02/Summoners-Rift-1-1536x1093.jpg" alt="test" width={800}
        height={600}/>
      </TransformComponent>
    </TransformWrapper>

      {/* Anzeige des ausgewählten Pixels */}
      {selectedPixel && (
        <div>
          Ausgewählter Pixel: ({selectedPixel.x}, {selectedPixel.y})
        </div>
      )}
    </div>
  );
};

export default ImageToMap;
