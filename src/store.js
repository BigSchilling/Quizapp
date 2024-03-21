import { configureStore } from '@reduxjs/toolkit';
import LoginPlayerReducer from './slices/LoginPlayerSlice';
import ShowMasterSlice from './slices/ShowMasterSlice';

const store = configureStore({
  reducer: {
    loginPlayer: LoginPlayerReducer,
    showMaster: ShowMasterSlice
    // Weitere Slices können hier hinzugefügt werden
  },
});

export default store;
