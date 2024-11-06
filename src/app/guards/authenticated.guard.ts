import { CanActivateFn } from '@angular/router';

export const authenticatedGuard: CanActivateFn = (route, state) => {
  // valida el ingreso de usuarios autenticados
  return true;
};
