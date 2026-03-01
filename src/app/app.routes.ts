import { Routes } from '@angular/router';
import { ServicesComponent } from './components/services/services';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { AboutComponent } from './components/about/about';
import { ProvidersComponent } from './components/providers/providers';
import { ServiceDetailComponent } from './components/service-detail/service-detail';

export const routes: Routes = [
  { path: '', redirectTo: 'services', pathMatch: 'full' },
  { path: 'services', component: ServicesComponent },
  { path: 'services/:id', component: ServiceDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'about', component: AboutComponent },
  { path: 'providers', component: ProvidersComponent },
];