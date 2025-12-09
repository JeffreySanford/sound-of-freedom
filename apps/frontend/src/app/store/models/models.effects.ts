/**
 * Models Effects
 * Handles model artifact side effects and API calls
 */

import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ModelsService } from '../../services/models.service';
import * as ModelsActions from './models.actions';

@Injectable()
export class ModelsEffects {
  private readonly actions$ = inject(Actions);
  private readonly modelsService = inject(ModelsService);

  loadModels$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelsActions.loadModels),
      mergeMap(() =>
        this.modelsService.getModels().pipe(
          map((models) => ModelsActions.loadModelsSuccess({ models })),
          catchError((error) =>
            of(
              ModelsActions.loadModelsFailure({
                error: error.message || 'Failed to load models',
              })
            )
          )
        )
      )
    )
  );

  loadModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelsActions.loadModel),
      mergeMap((action) =>
        this.modelsService.getModelById(action.id).pipe(
          map((model) => ModelsActions.loadModelSuccess({ model })),
          catchError((error) =>
            of(
              ModelsActions.loadModelFailure({
                error: error.message || 'Failed to load model',
              })
            )
          )
        )
      )
    )
  );

  createModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelsActions.createModel),
      mergeMap((action) =>
        this.modelsService.createModel(action.model).pipe(
          map((model) => ModelsActions.createModelSuccess({ model })),
          catchError((error) =>
            of(
              ModelsActions.createModelFailure({
                error: error.message || 'Failed to create model',
              })
            )
          )
        )
      )
    )
  );

  updateModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelsActions.updateModel),
      mergeMap((action) =>
        this.modelsService.updateModel(action.id, action.changes).pipe(
          map((model) => ModelsActions.updateModelSuccess({ model })),
          catchError((error) =>
            of(
              ModelsActions.updateModelFailure({
                error: error.message || 'Failed to update model',
              })
            )
          )
        )
      )
    )
  );

  deleteModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelsActions.deleteModel),
      mergeMap((action) =>
        this.modelsService.deleteModel(action.id).pipe(
          map(() => ModelsActions.deleteModelSuccess({ id: action.id })),
          catchError((error) =>
            of(
              ModelsActions.deleteModelFailure({
                error: error.message || 'Failed to delete model',
              })
            )
          )
        )
      )
    )
  );
}
