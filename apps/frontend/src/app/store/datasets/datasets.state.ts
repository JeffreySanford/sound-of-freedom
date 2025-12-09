/**
 * Datasets State
 * Manages audio dataset metadata with entity adapter
 */

import { EntityState } from '@ngrx/entity';

export interface AudioSample {
  id: string;
  filename: string;
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  sizeBytes: number;
  url: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  totalSamples: number;
  totalSizeBytes: number;
  license: string;
  source: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  samples?: AudioSample[];
}

export interface DatasetsState extends EntityState<Dataset> {
  selectedDatasetId: string | null;
  loading: boolean;
  error: string | null;
  loadingSamples: boolean;
  filters: {
    search: string;
    category: string | null;
    tags: string[];
  };
}
