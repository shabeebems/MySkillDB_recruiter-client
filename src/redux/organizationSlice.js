// src/redux/organizationSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = null; // directly store the organization object

const organizationSlice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    setOrganization: (state, action) => action.payload,
    clearOrganization: () => null,
  },
});

export const { setOrganization, clearOrganization } = organizationSlice.actions;
export default organizationSlice.reducer;
