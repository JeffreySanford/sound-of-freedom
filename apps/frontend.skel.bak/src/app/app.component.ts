import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column">
      <h1>Sound Creator</h1>
      <button mat-raised-button color="primary" (click)="generate()">Generate Sound</button>
      <p *ngIf="message">{{ message }}</p>
    </div>
  `
})
export class AppComponent {
  message = '';
  generate() {
    this.message = 'Generation triggered! (This is a placeholder for the sound-gen flow)';
  }
}
