import React, { useState } from 'react';
import useSound from 'use-sound';

const TestPage = () => {
    const buzzerSound = '../SoundFiles/ding.mp3'; // Pfade anpassen
    const [play] = useSound(buzzerSound);
    const [volume, setVolume] = useState(0.5);

    const handlePlaySound = () => {
        play({ volume }); // Abspielen des Sounds mit der aktuellen Lautstärke
    };

    return (
        <div>
            <button onClick={handlePlaySound}>Play Sound</button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
        </div>
    );
};

export default TestPage;
