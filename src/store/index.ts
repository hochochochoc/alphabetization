import { configureStore } from "@reduxjs/toolkit";
import alphabetReducer from "./features/alphabetSlice";
import audioReducer from "./features/audioSlice";

export const store = configureStore({
  reducer: {
    alphabet: alphabetReducer,
    audio: audioReducer,
  },
});

// Infers the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
