import React, { useEffect, useState } from "react";

function TwitchCam() {
  const [guestStarSession, setGuestStarSession] = useState(null);

  useEffect(() => {
    const fetchGuestStarSession = async () => {
      const corsProxyUrl = "https://cors-anywhere.herokuapp.com/";
      const twitchUrl =
        "https://dashboard.twitch.tv/widgets/guest-star/bigschilling?display=single&slot=1#auth=2e8vrDusBpBPU9uxCaUyMNgEelE";
      const response = await fetch(corsProxyUrl + twitchUrl);
      const data = await response.json();
      setGuestStarSession(data);
    };

    //   https://dashboard.twitch.tv/widgets/guest-star/bigschilling?display=single&slot=1#auth=2e8vrDusBpBPU9uxCaUyMNgEelE
    // fetchGuestStarSession();
  }, []);

  return (
    <div>
        <iframe
          src="https://dashboard.twitch.tv/widgets/guest-star/bigschilling?display=single&slot=1#auth=2e8vrDusBpBPU9uxCaUyMNgEelE"
          noborder="0"
          width="830"
          height="800"
          scrolling="yes"
          seamless
        >
          <p>Session ID: {}</p>
          {/* Weitere Informationen anzeigen */}
        </iframe>
      
    </div>
  );
}

export default TwitchCam;
