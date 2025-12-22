import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app'; // Fixed: Changed 'App' to 'AppComponent'
import { FormsModule } from '@angular/forms'; // Needed for ngModel
import { CommonModule } from '@angular/common'; // Needed for *ngIf and *ngFor

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent, 
        FormsModule, 
        CommonModule
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the chat partner name in the header', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges(); // Trigger initial data binding
    const compiled = fixture.nativeElement as HTMLElement;
    
    // We look for <h3> because that is where {{ chatPartner }} is in your app.html
    expect(compiled.querySelector('h3')?.textContent).toContain('Public Group');
  });
});