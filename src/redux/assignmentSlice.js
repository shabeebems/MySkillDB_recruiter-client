// src/redux/assignmentSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = null; // directly store the assignment object

const assignmentSlice = createSlice({
  name: "assignment",
  initialState,
  reducers: {
    setAssignment: (state, action) => action.payload,
    clearAssignment: () => null,
  },
});

export const { setAssignment, clearAssignment } = assignmentSlice.actions;
export default assignmentSlice.reducer;

