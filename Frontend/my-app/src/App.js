import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LandingPage from './components/LandingPage';
import StartPage from "./components/StartPage"
import ShowMasterPage from './components/ShowMasterPage';
import PlayerCreate from './components/Player/PlayerCreate';
import StreamingPage from './components/StreamingPage';
import Navigation from './components/Navigation';
import "./layout/vapor.css";

function App() {
  const loggedIn = useSelector((state) => state.loginPlayer.loggedIn);
  const isHost = useSelector((state) => state.loginPlayer.isHost);
  const createPlayerClicked = useSelector((state) => state.showMaster.createPlayerClicked)
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
                </>) :
                (<>
                  <Route path="/" element={<PlayerCreate />} />
                </>)

            ) : (
              <>
                <Route path="/" element={<StartPage />} />
                <Route path="/stream" element={<StreamingPage />} />

              </>)
          ) : (
            <>
              <Route path="/" element={<LandingPage />} />
              <Route path="/stream" element={<StreamingPage />} />

            </>
          )}

        </Routes>
      </Router>
    </ >
  );
}

export default App;
