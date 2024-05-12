import { createSlice } from '@reduxjs/toolkit';
// Initialer Zustand des Reducers
const initialState = {
  createPlayerClicked: false,
  rightPoints: 5,
  wrongPoints: 1,
  manuellPoints: 5,
  teamPoints: 1,
  timer: 2000
};

// Erstelle ein Slice mit einem Reducer und Aktionen
const showMasterSlice = createSlice({
  name: 'showMaster',
  initialState,
  reducers: {
    createPlayerTrue: (state) => {
      state.createPlayerClicked = true;
    },
    createPlayerFalse: (state) => {
      state.createPlayerClicked = false;
    },
    setRightPoints: (state, action) => {
      state.rightPoints = action.payload.rightPoints;
    },
    setWrongPoints: (state, action) => {
      state.wrongPoints = action.payload.wrongPoints;
    },
    setManuellPoints: (state, action) => {
      state.manuellPoints = action.payload.manuellPoints;
    },
    setTeamPoints: (state, action) => {
      state.teamPoints = action.payload.teamPoints;
    },
    setTimer: (state, action) => {
      state.timer = action.payload.timer;
    },
  },
});

// Exportiere Reducer und Aktionen
export const { createPlayerTrue, createPlayerFalse, setRightPoints,setManuellPoints,setTeamPoints, setTimer } = showMasterSlice.actions;
export default showMasterSlice.reducer;

