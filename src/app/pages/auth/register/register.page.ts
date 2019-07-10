import { Component } from '@angular/core';

import { DispenserAPIService } from '../../../services/DispenserAPI/dispenser-api.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {

  email : string = "";
  password : string = "";
  repassword : string = "";

  constructor(
    private navCtrl: NavController,
    private api: DispenserAPIService
  ) { }

  async signUp () {

    let token = await this.api.getToken();
    const { email, password, repassword } = this;

    let result = await this.api.registerNewUser(email, password, repassword);
    console.log(result);
    if (result) {
      this.navCtrl.navigateForward(['home']);
    } else {
      console.log("Registration failed!");
    }

  }
}
