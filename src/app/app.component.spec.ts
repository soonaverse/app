import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '@components/auth/services/auth.service';
import { MockProvider } from 'ng-mocks';
import { WenComponent } from './app.component';

describe('WenComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [MockProvider(AuthService)],
      declarations: [WenComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(WenComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
