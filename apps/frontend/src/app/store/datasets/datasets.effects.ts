/**
 * Datasets Effects
 * Handles dataset side effects and API calls
 */

import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { DatasetsService } from '../../services/datasets.service';
import * as DatasetsActions from './datasets.actions';

@Injectable()
export class DatasetsEffects {
  private readonly actions$ = inject(Actions);
  private readonly datasetsService = inject(DatasetsService);

  loadDatasets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetsActions.loadDatasets),
      mergeMap(() =>
        this.datasetsService.getDatasets().pipe(
          map((datasets) =>
            DatasetsActions.loadDatasetsSuccess({ datasets })
          ),
          catchError((error) =>
            of(
              DatasetsActions.loadDatasetsFailure({
                error: error.message || 'Failed to load datasets',
              })
            )
          )
        )
      )
    )
  );

  loadDataset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetsActions.loadDataset),
      mergeMap((action) =>
        this.datasetsService.getDatasetById(action.id).pipe(
          map((dataset) =>
            DatasetsActions.loadDatasetSuccess({ dataset })
          ),
          catchError((error) =>
            of(
              DatasetsActions.loadDatasetFailure({
                error: error.message || 'Failed to load dataset',
              })
            )
          )
        )
      )
    )
  );

  loadDatasetSamples$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetsActions.loadDatasetSamples),
      mergeMap((action) =>
        this.datasetsService
          .getDatasetSamples(action.datasetId, {
            limit: action.limit,
            offset: action.offset,
          })
          .pipe(
            map((samples) =>
              DatasetsActions.loadDatasetSamplesSuccess({
                datasetId: action.datasetId,
                samples,
              })
            ),
            catchError((error) =>
              of(
                DatasetsActions.loadDatasetSamplesFailure({
                  error: error.message || 'Failed to load dataset samples',
                })
              )
            )
          )
      )
    )
  );

  createDataset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetsActions.createDataset),
      mergeMap((action) =>
        this.datasetsService.createDataset(action.dataset).pipe(
          map((dataset) =>
            DatasetsActions.createDatasetSuccess({ dataset })
          ),
          catchError((error) =>
            of(
              DatasetsActions.createDatasetFailure({
                error: error.message || 'Failed to create dataset',
              })
            )
          )
        )
      )
    )
  );

  updateDataset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetsActions.updateDataset),
      mergeMap((action) =>
        this.datasetsService
          .updateDataset(action.id, action.changes)
          .pipe(
            map((dataset) =>
              DatasetsActions.updateDatasetSuccess({ dataset })
            ),
            catchError((error) =>
              of(
                DatasetsActions.updateDatasetFailure({
                  error: error.message || 'Failed to update dataset',
                })
              )
            )
          )
      )
    )
  );

  deleteDataset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetsActions.deleteDataset),
      mergeMap((action) =>
        this.datasetsService.deleteDataset(action.id).pipe(
          map(() =>
            DatasetsActions.deleteDatasetSuccess({ id: action.id })
          ),
          catchError((error) =>
            of(
              DatasetsActions.deleteDatasetFailure({
                error: error.message || 'Failed to delete dataset',
              })
            )
          )
        )
      )
    )
  );
}
