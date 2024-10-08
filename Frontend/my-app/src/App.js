import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import LandingPage from "./components/LandingPage";
import StartPage from "./components/StartPage";
import ShowMasterPage from "./components/ShowMasterPage";
import PlayerCreate from "./components/Player/PlayerCreate";
import StreamingPage from "./components/StreamingPage";
import Navigation from "./components/Navigation";
import TwitchCam from "./components/TwitchCam";
import ImageToMap from "./components/ImageToMap";
import TikTok from "./components/TikTok";
import TestPage from "./components/test/test";
import ShowMasterPlayer from "./components/test/ShowMasterPlayer";
import TeamPage from "./components/test/TeamPage";
import "./layout/vapor.css"; // zu vapor ändern wenn normales quiz, quartz für team
import TeamModPage from "./components/test/TeamModPage";
import Playerpage from "./components/Quizpoker/Playerpage";
import QuizPokerStream from "./components/Quizpoker/QuizPokerStream";
function App() {
  const loggedIn = useSelector((state) => state.loginPlayer.loggedIn);
  const isHost = useSelector((state) => state.loginPlayer.isHost);
  const createPlayerClicked = useSelector(
    (state) => state.showMaster.createPlayerClicked
  );
  return (
    <>
      <Router>
        <Routes>
          {/* Wenn der Benutzer eingeloggt ist, wird die Startseite angezeigt, sonst die LandingPage */}
          {loggedIn ? (
            isHost ? (
              !createPlayerClicked ? (
                <>
                  <Route path="/" element={<ShowMasterPage />} />
                  <Route path="/teamsmod" element={<TeamModPage />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<PlayerCreate />} />
                </>
              )
            ) : (
              <>
                <Route path="/" element={<StartPage />} />
               
                <Route path="/stream" element={<StreamingPage />} />
                <Route path="/tiktok" element={<TikTok />} />
                <Route path="/teams" element={<TeamPage />} />
              </>
            )
          ) : (
            <>
              <Route path="/" element={<LandingPage />} />
              <Route path="/teamsmod" element={<LandingPage />} />
              <Route path="/stream" element={<StreamingPage />} />
              <Route path="/test" element={<ShowMasterPlayer />} />
              <Route path="/map" element={<ImageToMap />} />
              <Route path="/teams" element={<TeamPage />} />
              <Route path="/quizpokerplayer" element={<Playerpage />} />
              <Route path="/quizpokerstream" element={<QuizPokerStream />} />
              
              
              {/* <Route path="/tiktok" element={<TikTok />} /> */}
            </>
          )}
        </Routes>
      </Router>
    </>
  );
}

export default App;
