/**
 * Datasets Selectors
 * Memoized selectors for dataset state access
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DatasetsState } from './datasets.state';
import * as fromDatasets from './datasets.reducer';

export const selectDatasetsState =
  createFeatureSelector<DatasetsState>('datasets');

// Entity adapter selectors
export const selectAllDatasets = createSelector(
  selectDatasetsState,
  fromDatasets.selectAll
);

export const selectDatasetsEntities = createSelector(
  selectDatasetsState,
  fromDatasets.selectEntities
);

export const selectDatasetsIds = createSelector(
  selectDatasetsState,
  fromDatasets.selectIds
);

export const selectDatasetsTotal = createSelector(
  selectDatasetsState,
  fromDatasets.selectTotal
);

// UI state selectors
export const selectDatasetsLoading = createSelector(
  selectDatasetsState,
  (state) => state.loading
);

export const selectDatasetsError = createSelector(
  selectDatasetsState,
  (state) => state.error
);

export const selectLoadingSamples = createSelector(
  selectDatasetsState,
  (state) => state.loadingSamples
);

export const selectSelectedDatasetId = createSelector(
  selectDatasetsState,
  (state) => state.selectedDatasetId
);

export const selectSelectedDataset = createSelector(
  selectDatasetsEntities,
  selectSelectedDatasetId,
  (entities, selectedId) => (selectedId ? entities[selectedId] : null)
);

export const selectSelectedDatasetSamples = createSelector(
  selectSelectedDataset,
  (dataset) => dataset?.samples || []
);

// Filter selectors
export const selectDatasetsFilters = createSelector(
  selectDatasetsState,
  (state) => state.filters
);

export const selectSearchFilter = createSelector(
  selectDatasetsFilters,
  (filters) => filters.search
);

export const selectCategoryFilter = createSelector(
  selectDatasetsFilters,
  (filters) => filters.category
);

export const selectTagsFilter = createSelector(
  selectDatasetsFilters,
  (filters) => filters.tags
);

// Derived selectors - filtered datasets
export const selectFilteredDatasets = createSelector(
  selectAllDatasets,
  selectDatasetsFilters,
  (datasets, filters) => {
    return datasets.filter((dataset) => {
      const matchesSearch =
        !filters.search ||
        dataset.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        dataset.description
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesCategory =
        !filters.category || dataset.category === filters.category;

      const matchesTags =
        filters.tags.length === 0 ||
        filters.tags.some((tag) => dataset.tags.includes(tag));

      return matchesSearch && matchesCategory && matchesTags;
    });
  }
);

// Dataset by ID selector factory
export const selectDatasetById = (id: string) =>
  createSelector(selectDatasetsEntities, (entities) => entities[id]);

// Datasets by category selector
export const selectDatasetsByCategory = (category: string) =>
  createSelector(selectAllDatasets, (datasets) =>
    datasets.filter((dataset) => dataset.category === category)
  );

// Total storage usage across all datasets
export const selectTotalStorageUsage = createSelector(
  selectAllDatasets,
  (datasets) => {
    return datasets.reduce((total, dataset) => total + dataset.totalSizeBytes, 0);
  }
);

// Total samples across all datasets
export const selectTotalSamplesCount = createSelector(
  selectAllDatasets,
  (datasets) => {
    return datasets.reduce((total, dataset) => total + dataset.totalSamples, 0);
  }
);

// Recently updated datasets
export const selectRecentDatasets = createSelector(
  selectAllDatasets,
  (datasets) => {
    const sorted = [...datasets].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return sorted.slice(0, 10);
  }
);
