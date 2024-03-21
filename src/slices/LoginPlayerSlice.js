import { createSlice } from '@reduxjs/toolkit';
// Initialer Zustand des Reducers
const initialState = {
  token: "",
  loggedIn: false,
  userID: null,
  currentRights: -1,
  currentWrongs: -1,
  allTimeRights: -1,
  allTimeWrongs: -1,
  highestPoints: -1,
  isHost: false
};

// Erstelle ein Slice mit einem Reducer und Aktionen
const loginPlayerSlice = createSlice({
  name: 'loginPlayer',
  initialState,
  reducers: {
    deletePlayer: (state) => {
      state.token = "";
      state.userID = null;
      state.isHost = false;
      state.loggedIn = false;
      state.currentRights = -1;
      state.currentWrongs = -1;
      state.allTimeRights = -1;
      state.allTimeWrongs = -1;
      state.highestPoints = -1;
      console.log("ausgeführt und gelöscht: " + state.token)
    },
    setPlayer: (state, action) => {
      state.token = action.payload.token;
      state.loggedIn = action.payload.loggedIn;
      state.userID = action.payload.userID;
      state.isHost = action.payload.isHost;
      state.currentRights = action.payload.currentRights;
      state.currentWrongs = action.payload.currentWrongs;
      state.allTimeRights = action.payload.allTimeRights;
      state.allTimeWrongs = action.payload.allTimeWrongs;
      state.highestPoints = action.payload.highestPoints;

      console.log("in setUser für " + JSON.stringify(state.userID))
      console.log(" - token:  " + JSON.stringify(state.token))
      console.log(" - loggedIn:  " + JSON.stringify(state.loggedIn))
    }
  },
});

// Exportiere Reducer und Aktionen
export const { deletePlayer, setPlayer } = loginPlayerSlice.actions;
export default loginPlayerSlice.reducer;

