/**
 * Models Reducer
 * Entity adapter for normalized model storage
 */

import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { ModelArtifact, ModelsState } from './models.state';
import * as ModelsActions from './models.actions';

export const modelsAdapter: EntityAdapter<ModelArtifact> =
  createEntityAdapter<ModelArtifact>({
    selectId: (model) => model.id,
    sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
  });

export const initialModelsState: ModelsState = modelsAdapter.getInitialState({
  selectedModelId: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    modelType: null,
    tags: [],
  },
});

export const modelsReducer = createReducer(
  initialModelsState,

  // Load models
  on(ModelsActions.loadModels, (state: ModelsState) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ModelsActions.loadModelsSuccess, (state: ModelsState, { models }: { models: ModelArtifact[] }) =>
    modelsAdapter.setAll(models, {
      ...state,
      loading: false,
    })
  ),

  on(ModelsActions.loadModelsFailure, (state: ModelsState, { error }: { error: string }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load single model
  on(ModelsActions.loadModel, (state: ModelsState) => ({
    ...state,
    loading: true,
  })),

  on(ModelsActions.loadModelSuccess, (state: ModelsState, { model }: { model: ModelArtifact }) =>
    modelsAdapter.upsertOne(model, {
      ...state,
      loading: false,
    })
  ),

  on(ModelsActions.loadModelFailure, (state: ModelsState, { error }: { error: string }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Select/deselect model
  on(ModelsActions.selectModel, (state: ModelsState, { id }: { id: string }) => ({
    ...state,
    selectedModelId: id,
  })),

  on(ModelsActions.deselectModel, (state: ModelsState) => ({
    ...state,
    selectedModelId: null,
  })),

  // Create model
  on(ModelsActions.createModel, (state: ModelsState) => ({
    ...state,
    loading: true,
  })),

  on(ModelsActions.createModelSuccess, (state: ModelsState, { model }: { model: ModelArtifact }) =>
    modelsAdapter.addOne(model, {
      ...state,
      loading: false,
    })
  ),

  on(ModelsActions.createModelFailure, (state: ModelsState, { error }: { error: string }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update model
  on(ModelsActions.updateModel, (state: ModelsState) => ({
    ...state,
    loading: true,
  })),

  on(ModelsActions.updateModelSuccess, (state: ModelsState, { model }: { model: ModelArtifact }) =>
    modelsAdapter.updateOne(
      { id: model.id, changes: model },
      {
        ...state,
        loading: false,
      }
    )
  ),

  on(ModelsActions.updateModelFailure, (state: ModelsState, { error }: { error: string }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Delete model
  on(ModelsActions.deleteModel, (state: ModelsState) => ({
    ...state,
    loading: true,
  })),

  on(ModelsActions.deleteModelSuccess, (state: ModelsState, { id }: { id: string }) =>
    modelsAdapter.removeOne(id, {
      ...state,
      loading: false,
    })
  ),

  on(ModelsActions.deleteModelFailure, (state: ModelsState, { error }: { error: string }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Filters
  on(ModelsActions.setSearchFilter, (state: ModelsState, { search }: { search: string }) => ({
    ...state,
    filters: { ...state.filters, search },
  })),

  on(ModelsActions.setTypeFilter, (state: ModelsState, { modelType }: { modelType: string | null }) => ({
    ...state,
    filters: { ...state.filters, modelType },
  })),

  on(ModelsActions.setTagsFilter, (state: ModelsState, { tags }: { tags: string[] }) => ({
    ...state,
    filters: { ...state.filters, tags },
  })),

  on(ModelsActions.clearFilters, (state: ModelsState) => ({
    ...state,
    filters: { search: '', modelType: null, tags: [] },
  }))
);

export const { selectAll, selectEntities, selectIds, selectTotal } =
  modelsAdapter.getSelectors();
