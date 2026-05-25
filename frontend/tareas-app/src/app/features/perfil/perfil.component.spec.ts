import { TestBed } from '@angular/core/testing';
import { PerfilComponent } from './perfil.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from '../../../environments/environment';

describe('PerfilComponent', () => {
  let fixture: any;
  let component: PerfilComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilComponent, HttpClientTestingModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('cargarPerfil should set perfil from API', () => {
    const mockResp = { email: 'user@example.com', nombre: 'Usuario', telefono: '123' };
    component.cargarPerfil();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/current-user`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResp);
    expect(component.perfil.email).toBe('user@example.com');
    expect(component.loading).toBeFalsy();
  });

  it('guardar should send PUT and handle success', () => {
    const mockResp = { mensaje: 'Actualizado' };
    component.perfil = { email: 'a', nombre: 'N', telefono: '1', rol: '' };
    component.guardar();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/actualizar-perfil`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockResp);
    expect(component.successMessage).toContain('Actualizado');
    expect(component.saving).toBeFalsy();
  });
});
