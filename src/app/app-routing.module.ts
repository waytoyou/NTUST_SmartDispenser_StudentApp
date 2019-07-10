import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadChildren: './pages/dashboard/dashboard.module#DashboardPageModule' },
  { path: 'detailed-information', loadChildren: './pages/detailed-information/detailed-information.module#DetailedInformationPageModule' },
  { path: 'maintenance-records', loadChildren: './pages/maintenance-records/maintenance-records.module#MaintenanceRecordsPageModule' },
  { path: 'report-problem', loadChildren: './pages/report-problem/report-problem.module#ReportProblemPageModule' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
