/**
 * Song Generation Reducer
 * Handles state updates for song generation
 */

import { createReducer, on } from '@ngrx/store';
import {
  updateFormData,
  resetForm,
  generateMetadata,
  generateMetadataSuccess,
  generateMetadataFailure,
  generateSong,
  generateSongSuccess,
  generateSongFailure,
  updateProgress,
  resetProgress,
  clearCurrentResult,
  addToHistory,
  clearHistory,
  clearError,
} from './song-generation.actions';
import { initialSongGenerationState, SongGenerationState, SongGenerationResult, SongMetadata, GenerationProgress } from './song-generation.state';

export const songGenerationReducer = createReducer(
  initialSongGenerationState,

  // Form actions
  on(updateFormData, (state: SongGenerationState, { formData }: { formData: Partial<SongGenerationState['formData']> }) => ({
    ...state,
    formData: { ...state.formData, ...formData },
  })),

  on(resetForm, (state: SongGenerationState) => ({
    ...state,
    formData: initialSongGenerationState.formData,
  })),

  // Metadata generation
  on(generateMetadata, (state: SongGenerationState, { narrative, duration, model }: { narrative: string; duration: number; model: string }) => ({
    ...state,
    loading: true,
    error: null,
    currentRequest: { narrative, duration, model },
    progress: {
      stage: 'generating-metadata',
      progress: 0,
      message: 'Generating song metadata...',
    } as GenerationProgress,
  })),

  on(generateMetadataSuccess, (state: SongGenerationState, { metadata }: { metadata: SongMetadata }) => ({
    ...state,
    loading: false,
    progress: {
      stage: 'idle',
      progress: 100,
      message: 'Metadata generated successfully',
    } as GenerationProgress,
    formData: {
      ...state.formData,
      genre: metadata.genre,
      mood: metadata.mood,
    },
  })),

  on(generateMetadataFailure, (state: SongGenerationState, { error }: { error: string }) => ({
    ...state,
    loading: false,
    error,
    progress: {
      stage: 'error',
      progress: 0,
      message: `Failed to generate metadata: ${error}`,
    } as GenerationProgress,
  })),

  // Song generation
  on(generateSong, (state: SongGenerationState, { narrative, duration, model }: { narrative: string; duration: number; model: string }) => ({
    ...state,
    loading: true,
    error: null,
    currentRequest: { narrative, duration, model },
    progress: {
      stage: 'generating-song',
      progress: 0,
      message: 'Generating song...',
    } as GenerationProgress,
  })),

  on(generateSongSuccess, (state: SongGenerationState, { result }: { result: SongGenerationResult }) => ({
    ...state,
    loading: false,
    currentResult: result,
    progress: {
      stage: 'complete',
      progress: 100,
      message: 'Song generated successfully',
    } as GenerationProgress,
  })),

  on(generateSongFailure, (state: SongGenerationState, { error }: { error: string }) => ({
    ...state,
    loading: false,
    error,
    progress: {
      stage: 'error',
      progress: 0,
      message: `Failed to generate song: ${error}`,
    } as GenerationProgress,
  })),

  // Progress tracking
  on(updateProgress, (state: SongGenerationState, { progress }: { progress: GenerationProgress }) => ({
    ...state,
    progress,
  })),

  on(resetProgress, (state: SongGenerationState) => ({
    ...state,
    progress: initialSongGenerationState.progress,
  })),

  // Result management
  on(clearCurrentResult, (state: SongGenerationState) => ({
    ...state,
    currentResult: null,
  })),

  on(addToHistory, (state: SongGenerationState, { result }: { result: SongGenerationResult }) => ({
    ...state,
    history: [result, ...state.history].slice(0, 10), // Keep last 10 results
  })),

  on(clearHistory, (state: SongGenerationState) => ({
    ...state,
    history: [],
  })),

  // Error handling
  on(clearError, (state: SongGenerationState) => ({
    ...state,
    error: null,
  }))
);
