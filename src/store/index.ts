import { configureStore } from "@reduxjs/toolkit";
import alphabetReducer from "./features/alphabetSlice";

export const store = configureStore({
  reducer: {
    alphabet: alphabetReducer,
  },
});

// Infers the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
