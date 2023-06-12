import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { SignInPage } from './pages/sign-in/sign-in.page';

const routes: Routes = [
  {
    path: ROUTER_UTILS.config.auth.signIn,
    component: SignInPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
