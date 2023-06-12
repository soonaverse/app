import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AuthRoutingModule } from './auth-routing.module';
import { SignInPage } from './pages/sign-in/sign-in.page';

@NgModule({
  declarations: [SignInPage],
  imports: [CommonModule, AuthRoutingModule],
})
export class AuthModule {}
