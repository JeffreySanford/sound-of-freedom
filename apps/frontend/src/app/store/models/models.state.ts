/**
 * Models State
 * Manages model artifacts with entity adapter for normalized storage
 */

import { EntityState } from '@ngrx/entity';

export interface ModelArtifact {
  id: string;
  name: string;
  version: string;
  type: 'musicgen' | 'encodec' | 'demucs' | 'other';
  path: string;
  sizeBytes: number;
  checksum: string;
  tags: string[];
  license: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelsState extends EntityState<ModelArtifact> {
  selectedModelId: string | null;
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    modelType: string | null;
    tags: string[];
  };
}
