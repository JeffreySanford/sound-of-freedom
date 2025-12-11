import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { App } from './app';
import { appRoutes } from './app.routes';
import { AppMaterialModule } from './app-material.module';
import { AuthModule } from './features/auth/auth.module';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

// Reducers
import { authReducer } from './store/auth/auth.reducer';
import { modelsReducer } from './store/models/models.reducer';
import { datasetsReducer } from './store/datasets/datasets.reducer';
import { jobsReducer } from './store/jobs/jobs.reducer';
import { profileReducer } from './store/profile/profile.state';

// Effects
import { AuthEffects } from './store/auth/auth.effects';
import { ModelsEffects } from './store/models/models.effects';
import { DatasetsEffects } from './store/datasets/datasets.effects';
import { JobsEffects } from './store/jobs/jobs.effects';
import { ProfileEffects } from './store/profile/profile.effects';
// Song generation reducer/effects moved to the lazy-loaded feature module

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppMaterialModule,
    AuthModule,
    RouterModule.forRoot(appRoutes),
    StoreModule.forRoot(
      {
        auth: authReducer,
        models: modelsReducer,
        datasets: datasetsReducer,
        jobs: jobsReducer,
        profile: profileReducer,
      },
      {
        runtimeChecks: {
          strictStateImmutability: true,
          strictActionImmutability: true,
          strictStateSerializability: true,
          strictActionSerializability: true,
          strictActionWithinNgZone: true,
          strictActionTypeUniqueness: true,
        },
      }
    ),
    EffectsModule.forRoot([
      AuthEffects,
      ModelsEffects,
      DatasetsEffects,
      JobsEffects,
      // library: libraryReducer, // registered in lazy-loaded LibraryModule
      // LibraryEffects registered in lazy-loaded LibraryModule
      ProfileEffects,
      // SongGenerationEffects is registered in the lazy-loaded feature
    ]),
    // Only enable Store DevTools in development builds to keep the runtime and
    // main bundle small for production. Use the `environment.production` flag
    // with Angular file replacements so this is a compile-time constant for AOT.
    ...(!environment.production
      ? [
          StoreDevtoolsModule.instrument({
            maxAge: 25,
            logOnly: false,
            autoPause: true,
            trace: false,
            traceLimit: 75,
          }),
        ]
      : []),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggingInterceptor,
      multi: true,
    },
  ],
  exports: [RouterModule],
  bootstrap: [App],
})
export class AppModule {}
