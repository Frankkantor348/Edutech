import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { RolGuard } from './rol-guard';
import { AuthService } from '../services/auth.service';

describe('RolGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { getRol: () => 'Estudiante' } }
      ]
    });
  });

  it('should be created', () => {
    const guard = TestBed.inject(RolGuard);
    expect(guard).toBeTruthy();
  });
});
