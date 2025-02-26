import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const spanishLetters = [
  { letter: "A", voice: "A" },
  { letter: "B", voice: "be" },
  { letter: "C", voice: "ce" },
  { letter: "D", voice: "de" },
  { letter: "E", voice: "E" },
  { letter: "F", voice: "efe" },
  { letter: "G", voice: "ge" },
  { letter: "H", voice: "hache" },
  { letter: "I", voice: "I" },
  { letter: "J", voice: "jota" },
  { letter: "K", voice: "ka" },
  { letter: "L", voice: "ele" },
  { letter: "LL", voice: "eyye" },
  { letter: "M", voice: "eme" },
  { letter: "N", voice: "ene" },
  { letter: "Ñ", voice: "eñe" },
  { letter: "O", voice: "O" },
  { letter: "P", voice: "pe" },
  { letter: "Q", voice: "cu" },
  { letter: "R", voice: "erre" },
  { letter: "S", voice: "ese" },
  { letter: "T", voice: "te" },
  { letter: "U", voice: "U" },
  { letter: "V", voice: "uve" },
  { letter: "W", voice: "uve doble" },
  { letter: "X", voice: "equis" },
  { letter: "Y", voice: "i griega" },
  { letter: "Z", voice: "zeta" },
];

// Letters to be left out for now
const writingModeLetters = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "K",
  "L",
  "LL",
  "M",
  "N",
  "P",
  "R",
  "S",
  "T",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

// Letters to be left out for now
const readingModeLetters = ["F", "H", "R", "W", "X", "Y", "Z"];

const getFilteredLetters = (allowedLetters: string[]) => {
  return spanishLetters.filter((item) => allowedLetters.includes(item.letter));
};

interface AlphabetState {
  allLetters: Array<{ letter: string; voice: string }>;
  spanishLetters: Array<{ letter: string; voice: string }>;
  writingLetters: Array<{ letter: string; voice: string }>;
  readingLetters: Array<{ letter: string; voice: string }>;
}

const initialState: AlphabetState = {
  allLetters: spanishLetters,
  spanishLetters: spanishLetters,
  writingLetters: getFilteredLetters(writingModeLetters),
  readingLetters: getFilteredLetters(readingModeLetters),
};

export const alphabetSlice = createSlice({
  name: "alphabet",
  initialState,
  reducers: {
    setWritingLetters: (state, action: PayloadAction<string[]>) => {
      state.writingLetters = getFilteredLetters(action.payload);
    },
    setReadingLetters: (state, action: PayloadAction<string[]>) => {
      state.readingLetters = getFilteredLetters(action.payload);
    },
    setSpanishLetters: (state, action: PayloadAction<string[]>) => {
      state.spanishLetters = getFilteredLetters(action.payload);
    },
  },
});

export const { setWritingLetters, setReadingLetters, setSpanishLetters } =
  alphabetSlice.actions;

export default alphabetSlice.reducer;
