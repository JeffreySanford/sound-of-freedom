/**
 * Datasets Actions
 * CRUD operations for audio datasets
 */

import { createAction, props } from '@ngrx/store';
import { Dataset, AudioSample } from './datasets.state';

// Load datasets
export const loadDatasets = createAction('[Datasets] Load Datasets');

export const loadDatasetsSuccess = createAction(
  '[Datasets] Load Datasets Success',
  props<{ datasets: Dataset[] }>()
);

export const loadDatasetsFailure = createAction(
  '[Datasets] Load Datasets Failure',
  props<{ error: string }>()
);

// Load single dataset
export const loadDataset = createAction(
  '[Datasets] Load Dataset',
  props<{ id: string }>()
);

export const loadDatasetSuccess = createAction(
  '[Datasets] Load Dataset Success',
  props<{ dataset: Dataset }>()
);

export const loadDatasetFailure = createAction(
  '[Datasets] Load Dataset Failure',
  props<{ error: string }>()
);

// Load dataset samples
export const loadDatasetSamples = createAction(
  '[Datasets] Load Dataset Samples',
  props<{ datasetId: string; limit?: number; offset?: number }>()
);

export const loadDatasetSamplesSuccess = createAction(
  '[Datasets] Load Dataset Samples Success',
  props<{ datasetId: string; samples: AudioSample[] }>()
);

export const loadDatasetSamplesFailure = createAction(
  '[Datasets] Load Dataset Samples Failure',
  props<{ error: string }>()
);

// Select dataset
export const selectDataset = createAction(
  '[Datasets] Select Dataset',
  props<{ id: string }>()
);

export const deselectDataset = createAction('[Datasets] Deselect Dataset');

// Create dataset
export const createDataset = createAction(
  '[Datasets] Create Dataset',
  props<{ dataset: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'> }>()
);

export const createDatasetSuccess = createAction(
  '[Datasets] Create Dataset Success',
  props<{ dataset: Dataset }>()
);

export const createDatasetFailure = createAction(
  '[Datasets] Create Dataset Failure',
  props<{ error: string }>()
);

// Update dataset
export const updateDataset = createAction(
  '[Datasets] Update Dataset',
  props<{ id: string; changes: Partial<Dataset> }>()
);

export const updateDatasetSuccess = createAction(
  '[Datasets] Update Dataset Success',
  props<{ dataset: Dataset }>()
);

export const updateDatasetFailure = createAction(
  '[Datasets] Update Dataset Failure',
  props<{ error: string }>()
);

// Delete dataset
export const deleteDataset = createAction(
  '[Datasets] Delete Dataset',
  props<{ id: string }>()
);

export const deleteDatasetSuccess = createAction(
  '[Datasets] Delete Dataset Success',
  props<{ id: string }>()
);

export const deleteDatasetFailure = createAction(
  '[Datasets] Delete Dataset Failure',
  props<{ error: string }>()
);

// Filter datasets
export const setSearchFilter = createAction(
  '[Datasets] Set Search Filter',
  props<{ search: string }>()
);

export const setCategoryFilter = createAction(
  '[Datasets] Set Category Filter',
  props<{ category: string | null }>()
);

export const setTagsFilter = createAction(
  '[Datasets] Set Tags Filter',
  props<{ tags: string[] }>()
);

export const clearFilters = createAction('[Datasets] Clear Filters');
