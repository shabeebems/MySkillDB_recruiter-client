import { createSlice } from '@reduxjs/toolkit';

const moduleGenerationSlice = createSlice({
  name: 'moduleGeneration',
  initialState: {
    generatingModules: {}, // { 'jobId-skillId': { jobTitle, skillName, startTime, status, progress } }
    completedModules: [], // Array of completed module notifications
  },
  reducers: {
    startGeneration: (state, action) => {
      const { key, jobTitle, skillName, jobId, skillId } = action.payload;
      state.generatingModules[key] = {
        jobTitle,
        skillName,
        jobId,
        skillId,
        startTime: Date.now(),
        status: 'initializing', // initializing, sending, generating, processing, saving
        progress: 0,
      };
    },
    updateGenerationProgress: (state, action) => {
      const { key, status, progress } = action.payload;
      if (state.generatingModules[key]) {
        state.generatingModules[key].status = status;
        state.generatingModules[key].progress = progress;
      }
    },
    completeGeneration: (state, action) => {
      const { key, module } = action.payload;
      const generationInfo = state.generatingModules[key];
      
      if (generationInfo) {
        // Add to completed modules for notification
        state.completedModules.push({
          ...generationInfo,
          module,
          completedTime: Date.now(),
          id: `${key}-${Date.now()}`,
        });
        
        // Remove from generating
        delete state.generatingModules[key];
      }
    },
    failGeneration: (state, action) => {
      const { key } = action.payload;
      delete state.generatingModules[key];
    },
    dismissNotification: (state, action) => {
      const { id } = action.payload;
      state.completedModules = state.completedModules.filter(
        (module) => module.id !== id
      );
    },
    clearAllNotifications: (state) => {
      state.completedModules = [];
    },
  },
});

export const {
  startGeneration,
  updateGenerationProgress,
  completeGeneration,
  failGeneration,
  dismissNotification,
  clearAllNotifications,
} = moduleGenerationSlice.actions;

export default moduleGenerationSlice.reducer;

