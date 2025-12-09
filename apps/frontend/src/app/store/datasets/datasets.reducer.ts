/**
 * Datasets Reducer
 * Entity adapter for normalized dataset storage
 */

import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { Dataset, DatasetsState } from './datasets.state';
import * as DatasetsActions from './datasets.actions';

export const datasetsAdapter: EntityAdapter<Dataset> =
  createEntityAdapter<Dataset>({
    selectId: (dataset) => dataset.id,
    sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
  });

export const initialDatasetsState: DatasetsState =
  datasetsAdapter.getInitialState({
    selectedDatasetId: null,
    loading: false,
    error: null,
    loadingSamples: false,
    filters: {
      search: '',
      category: null,
      tags: [],
    },
  });

export const datasetsReducer = createReducer(
  initialDatasetsState,

  // Load datasets
  on(DatasetsActions.loadDatasets, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(DatasetsActions.loadDatasetsSuccess, (state, { datasets }) =>
    datasetsAdapter.setAll(datasets, {
      ...state,
      loading: false,
    })
  ),

  on(DatasetsActions.loadDatasetsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load single dataset
  on(DatasetsActions.loadDataset, (state) => ({
    ...state,
    loading: true,
  })),

  on(DatasetsActions.loadDatasetSuccess, (state, { dataset }) =>
    datasetsAdapter.upsertOne(dataset, {
      ...state,
      loading: false,
    })
  ),

  on(DatasetsActions.loadDatasetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load dataset samples
  on(DatasetsActions.loadDatasetSamples, (state) => ({
    ...state,
    loadingSamples: true,
  })),

  on(DatasetsActions.loadDatasetSamplesSuccess, (state, { datasetId, samples }) => {
    const dataset = state.entities[datasetId];
    if (!dataset) return state;

    return datasetsAdapter.updateOne(
      {
        id: datasetId,
        changes: { samples },
      },
      {
        ...state,
        loadingSamples: false,
      }
    );
  }),

  on(DatasetsActions.loadDatasetSamplesFailure, (state, { error }) => ({
    ...state,
    loadingSamples: false,
    error,
  })),

  // Select/deselect dataset
  on(DatasetsActions.selectDataset, (state, { id }) => ({
    ...state,
    selectedDatasetId: id,
  })),

  on(DatasetsActions.deselectDataset, (state) => ({
    ...state,
    selectedDatasetId: null,
  })),

  // Create dataset
  on(DatasetsActions.createDataset, (state) => ({
    ...state,
    loading: true,
  })),

  on(DatasetsActions.createDatasetSuccess, (state, { dataset }) =>
    datasetsAdapter.addOne(dataset, {
      ...state,
      loading: false,
    })
  ),

  on(DatasetsActions.createDatasetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update dataset
  on(DatasetsActions.updateDataset, (state) => ({
    ...state,
    loading: true,
  })),

  on(DatasetsActions.updateDatasetSuccess, (state, { dataset }) =>
    datasetsAdapter.updateOne(
      { id: dataset.id, changes: dataset },
      {
        ...state,
        loading: false,
      }
    )
  ),

  on(DatasetsActions.updateDatasetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Delete dataset
  on(DatasetsActions.deleteDataset, (state) => ({
    ...state,
    loading: true,
  })),

  on(DatasetsActions.deleteDatasetSuccess, (state, { id }) =>
    datasetsAdapter.removeOne(id, {
      ...state,
      loading: false,
    })
  ),

  on(DatasetsActions.deleteDatasetFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Filters
  on(DatasetsActions.setSearchFilter, (state, { search }) => ({
    ...state,
    filters: { ...state.filters, search },
  })),

  on(DatasetsActions.setCategoryFilter, (state, { category }) => ({
    ...state,
    filters: { ...state.filters, category },
  })),

  on(DatasetsActions.setTagsFilter, (state, { tags }) => ({
    ...state,
    filters: { ...state.filters, tags },
  })),

  on(DatasetsActions.clearFilters, (state) => ({
    ...state,
    filters: { search: '', category: null, tags: [] },
  }))
);

export const { selectAll, selectEntities, selectIds, selectTotal } =
  datasetsAdapter.getSelectors();
