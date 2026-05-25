import { TestBed } from '@angular/core/testing';
import { TareasListaComponent } from './tareas-lista.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

describe('TareasListaComponent', () => {
  let fixture: any;
  let component: TareasListaComponent;
  let httpMock: HttpTestingController;
  const mockAuth = { getRol: () => 'Estudiante' } as Partial<AuthService>;
  const mockToastr = { error: vi.fn(), warning: vi.fn(), success: vi.fn() } as Partial<ToastrService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TareasListaComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: ToastrService, useValue: mockToastr }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TareasListaComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('isVencida should detect past and future dates', () => {
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
    const mañana = new Date(); mañana.setDate(mañana.getDate() + 1);
    expect(component.isVencida(ayer)).toBeTruthy();
    expect(component.isVencida(mañana)).toBeFalsy();
  });

  it('aplicarFiltro should filter tareas for estudiante', () => {
    component.tareas = [
      { id:1, titulo:'A', descripcion:'', fechaPublicacion:new Date(), fechaLimite:new Date(Date.now()+86400000), colorSemaforo:'', curso:'X', docenteId:'d', entregada:false },
      { id:2, titulo:'B', descripcion:'', fechaPublicacion:new Date(), fechaLimite:new Date(Date.now()-86400000), colorSemaforo:'', curso:'X', docenteId:'d', entregada:true }
    ] as any;
    component.esDocente = false;

    component.filtroActual = 'pendiente';
    component.aplicarFiltro();
    expect(component.tareasFiltradas.every((t: any) => !t.entregada)).toBeTruthy();

    component.filtroActual = 'entregada';
    component.aplicarFiltro();
    expect(component.tareasFiltradas.every((t: any) => t.entregada)).toBeTruthy();
  });

  it('abrirMaterial without ruta should show warning and not open window', () => {
    vi.spyOn(window as any, 'open').mockImplementation(() => null);
    component.abrirMaterial(undefined, undefined);
    expect(mockToastr.warning).toHaveBeenCalled();
    expect((window.open as any)).not.toHaveBeenCalled();
  });

  it('cargarCursos should populate cursosDisponibles from API', () => {
    component.cargarCursos();
    const req = httpMock.expectOne(`${environment.apiUrl}/TareasApi/cursos`);
    expect(req.request.method).toBe('GET');
    req.flush(['Curso1','Curso2']);
    expect(component.cursosDisponibles.length).toBe(2);
  });
});
