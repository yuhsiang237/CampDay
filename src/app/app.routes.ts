import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Result } from './features/result/result';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'result', component: Result },
];
