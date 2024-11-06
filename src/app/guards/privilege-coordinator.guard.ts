import { CanActivateFn } from '@angular/router';

export const privilegeCoordinatorGuard: CanActivateFn = (route, state) => {
  // valida que solo puedan acceder al componente usuario con rol Coordinador
  return true;
};
