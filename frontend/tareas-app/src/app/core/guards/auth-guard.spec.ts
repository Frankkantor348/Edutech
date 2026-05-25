import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthGuard } from './auth-guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => true, getToken: () => null } }
      ]
    });
  });

  it('should be created', () => {
    const guard = TestBed.inject(AuthGuard);
    expect(guard).toBeTruthy();
  });
});
