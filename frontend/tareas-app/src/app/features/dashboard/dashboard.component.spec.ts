import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardComponent } from './dashboard.component';
import { Router } from '@angular/router';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule]
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should navigate to tareas with the selected filtro', () => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.irATareas('pendiente');
    expect(spy).toHaveBeenCalledWith(['/tareas'], { queryParams: { filtro: 'pendiente' } });

    component.irATareas('calificadas');
    expect(spy).toHaveBeenCalledWith(['/tareas'], { queryParams: { filtro: 'calificadas' } });

    component.irATareas('estudiantes');
    expect(spy).toHaveBeenCalledWith(['/tareas'], { queryParams: { filtro: 'estudiantes' } });
  });
});
