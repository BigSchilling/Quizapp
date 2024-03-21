import { createSlice } from '@reduxjs/toolkit';
// Initialer Zustand des Reducers
const initialState = {
  createPlayerClicked: false,
  rightPoints: 5,
  wrongPoints: 1,
  manuellPoints: 3
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
  },
});

// Exportiere Reducer und Aktionen
export const { createPlayerTrue, createPlayerFalse, setRightPoints,setManuellPoints } = showMasterSlice.actions;
export default showMasterSlice.reducer;

