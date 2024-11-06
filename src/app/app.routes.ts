import { Routes } from '@angular/router';
import { authenticatedGuard } from './guards/authenticated.guard';
import { privilegeCoordinatorGuard } from './guards/privilege-coordinator.guard';
import { DisconnectionDetailComponent } from './pages/session/coordinator-disconnections/disconnection-detail/disconnection-detail.component';

export const routes: Routes = [
    {
        path: 'sesion',
        loadComponent: () => import('./pages/session/session/session.component'),
        canActivate: [authenticatedGuard],
        children: [
            {
                path: 'desconexiones',
                loadComponent: () => import('./pages/session/coordinator-disconnections/coordinator-disconnections.component'),
                canActivate: [privilegeCoordinatorGuard]
            },
            { 
                path: 'desconexiones/desconexion/:id', 
                component: DisconnectionDetailComponent, 
                canActivate: [privilegeCoordinatorGuard] },
            {
                path: 'balances',
                loadComponent: () => import('./pages/session/coordinator-balances/coordinator-balances.component'),
                canActivate: [privilegeCoordinatorGuard]
            },
            {
                path: 'fuerzas_mayores',
                loadComponent: () => import('./pages/session/coordinator-force-majeure/coordinator-force-majeure.component'),
                canActivate: [privilegeCoordinatorGuard]
            }
        ],

    },
    { path: '**', redirectTo: 'sesion/desconexiones' }

];
