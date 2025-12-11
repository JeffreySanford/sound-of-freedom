import 'zone.js';
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { COMPILER_OPTIONS } from '@angular/core';
import { DOCUMENT } from '@angular/common';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting([
    {
      provide: COMPILER_OPTIONS,
      useValue: {},
      multi: true,
    },
    // Provide the DOM `Document` at the platform level so modules (like
    // Angular CDK/Material A11y) which inject `DOCUMENT`/DocumentToken during
    // module initialization find it.
    {
      provide: DOCUMENT,
      useValue: typeof document !== 'undefined' ? document : {},
    },
  ])
);

// Ensure `DOCUMENT` token (DocumentToken) is provided to CDK/Material modules that expect it.
// Also add a global provider on the dynamic test module in case individual
// tests override providers or rely on module-level injection.
getTestBed().configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: typeof document !== 'undefined' ? document : {} }] });
