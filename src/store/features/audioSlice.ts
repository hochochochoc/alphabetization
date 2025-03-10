import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Howl } from "howler";

// Create Howl instances outside of the Redux state
// so we don't try to serialize them
const correctSoundHowl = new Howl({
  src: [
    "https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3",
  ],
  volume: 0.5,
  html5: true,
  preload: true,
  xhr: {
    method: "GET",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
});

const incorrectSoundHowl = new Howl({
  src: ["/mixkit-tech-break-fail-2947.wav"],
  volume: 0.7,
  html5: true,
  preload: true,
  xhr: {
    method: "GET",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
});

const endSoundHowl = new Howl({
  src: ["/mixkit-completion-of-a-level-2063.wav"],
  volume: 0.7,
  html5: true,
  preload: true,
  xhr: {
    method: "GET",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
});

// Thunks to play the sounds
export const playCorrectSound = createAsyncThunk(
  "audio/playCorrectSound",
  async () => {
    correctSoundHowl.play();
    return true;
  },
);

export const playIncorrectSound = createAsyncThunk(
  "audio/playIncorrectSound",
  async () => {
    incorrectSoundHowl.play();
    return true;
  },
);

export const playEndSound = createAsyncThunk("audio/playEndSound", async () => {
  endSoundHowl.play();
  return true;
});

// Audio slice interface
interface AudioState {
  isPlaying: boolean;
  lastPlayed: "correct" | "incorrect" | null;
}

const initialState: AudioState = {
  isPlaying: false,
  lastPlayed: null,
};

export const audioSlice = createSlice({
  name: "audio",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(playCorrectSound.pending, (state) => {
        state.isPlaying = true;
      })
      .addCase(playCorrectSound.fulfilled, (state) => {
        state.isPlaying = false;
        state.lastPlayed = "correct";
      })
      .addCase(playIncorrectSound.pending, (state) => {
        state.isPlaying = true;
      })
      .addCase(playIncorrectSound.fulfilled, (state) => {
        state.isPlaying = false;
        state.lastPlayed = "incorrect";
      });
  },
});

export default audioSlice.reducer;
