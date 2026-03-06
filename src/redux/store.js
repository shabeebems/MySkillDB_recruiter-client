import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import organizationReducer from "./organizationSlice";
import assignmentReducer from "./assignmentSlice";
import moduleGenerationReducer from "./moduleGenerationSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    organization: organizationReducer,
    assignment: assignmentReducer,
    moduleGeneration: moduleGenerationReducer,
  },
});
