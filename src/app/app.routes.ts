import { Routes } from '@angular/router';
import { ServicesComponent } from './components/services/services';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { AboutComponent } from './components/about/about';
import { ProvidersComponent } from './components/providers/providers';
import { ServiceDetailComponent } from './components/service-detail/service-detail';
import { ProviderDashboardComponent } from './components/provider-dashboard/provider-dashboard';
import { CustomerDashboardComponent } from './components/customer-dashboard/customer-dashboard';
import { AccountSettingsComponent } from './components/account-settings/account-settings';
import { ProviderProfileComponent } from './components/provider-profile/provider-profile';

export const routes: Routes = [
  { path: '', redirectTo: 'services', pathMatch: 'full' },
  { path: 'services', component: ServicesComponent },
  { path: 'services/:id', component: ServiceDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'about', component: AboutComponent },
  { path: 'providers', component: ProvidersComponent },
  { path: 'providers/:id', component: ProviderProfileComponent },
  { path: 'provider-dashboard', component: ProviderDashboardComponent },
  { path: 'customer-dashboard', component: CustomerDashboardComponent },
  { path: 'account-settings', component: AccountSettingsComponent },
];