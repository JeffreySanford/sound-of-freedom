/**
 * Models Selectors
 * Memoized selectors for model state access
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ModelsState } from './models.state';
import * as fromModels from './models.reducer';

export const selectModelsState =
  createFeatureSelector<ModelsState>('models');

// Entity adapter selectors
export const selectAllModels = createSelector(
  selectModelsState,
  fromModels.selectAll
);

export const selectModelsEntities = createSelector(
  selectModelsState,
  fromModels.selectEntities
);

export const selectModelsIds = createSelector(
  selectModelsState,
  fromModels.selectIds
);

export const selectModelsTotal = createSelector(
  selectModelsState,
  fromModels.selectTotal
);

// UI state selectors
export const selectModelsLoading = createSelector(
  selectModelsState,
  (state) => state.loading
);

export const selectModelsError = createSelector(
  selectModelsState,
  (state) => state.error
);

export const selectSelectedModelId = createSelector(
  selectModelsState,
  (state) => state.selectedModelId
);

export const selectSelectedModel = createSelector(
  selectModelsEntities,
  selectSelectedModelId,
  (entities, selectedId) => (selectedId ? entities[selectedId] : null)
);

// Filter selectors
export const selectModelsFilters = createSelector(
  selectModelsState,
  (state) => state.filters
);

export const selectSearchFilter = createSelector(
  selectModelsFilters,
  (filters) => filters.search
);

export const selectTypeFilter = createSelector(
  selectModelsFilters,
  (filters) => filters.modelType
);

export const selectTagsFilter = createSelector(
  selectModelsFilters,
  (filters) => filters.tags
);

// Derived selectors - filtered models
export const selectFilteredModels = createSelector(
  selectAllModels,
  selectModelsFilters,
  (models, filters) => {
    return models.filter((model) => {
      const matchesSearch =
        !filters.search ||
        model.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        model.version.toLowerCase().includes(filters.search.toLowerCase());

      const matchesType = !filters.modelType || model.type === filters.modelType;

      const matchesTags =
        filters.tags.length === 0 ||
        filters.tags.some((tag) => model.tags.includes(tag));

      return matchesSearch && matchesType && matchesTags;
    });
  }
);

// Model by ID selector factory
export const selectModelById = (id: string) =>
  createSelector(selectModelsEntities, (entities) => entities[id]);

// Models by type selector
export const selectModelsByType = (type: string) =>
  createSelector(selectAllModels, (models) =>
    models.filter((model) => model.type === type)
  );

// Recently updated models
export const selectRecentModels = createSelector(
  selectAllModels,
  (models) => {
    const sorted = [...models].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return sorted.slice(0, 10);
  }
);
