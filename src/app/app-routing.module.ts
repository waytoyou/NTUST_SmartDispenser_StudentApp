import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard/:device_id', pathMatch: 'full' },
  { path: 'dashboard', loadChildren: './pages/dashboard/dashboard.module#DashboardPageModule' },
  { path: 'dashboard/:device_id', loadChildren: './pages/dashboard/dashboard.module#DashboardPageModule' },
  { path: 'detailed-information', loadChildren: './pages/detailed-information/detailed-information.module#DetailedInformationPageModule' },
  { path: 'maintenance-records', loadChildren: './pages/maintenance-records/maintenance-records.module#MaintenanceRecordsPageModule' },
  { path: 'report-problem', loadChildren: './pages/report-problem/report-problem.module#ReportProblemPageModule'},
  
  { path: 'mt-progress', loadChildren: './pages/mt-progress/mt-progress.module#MtProgressPageModule'},
  { path: 'nearby', loadChildren: './pages/nearby/nearby.module#NearbyPageModule'},
  
  { path: 'login', loadChildren: './pages/auth/login/login.module#LoginPageModule'},
  { path: 'register', loadChildren: './pages/auth/register/register.module#RegisterPageModule'}
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
