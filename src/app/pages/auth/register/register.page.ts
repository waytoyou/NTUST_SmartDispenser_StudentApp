import { Component } from '@angular/core';

import { DispenserAPIService } from '../../../services/DispenserAPI/dispenser-api.service';
import { NavController, ToastController } from '@ionic/angular';

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
    private api: DispenserAPIService,
    private toastCtrl: ToastController
  ) { }

  emailFalse = false;
  checkEmail (email) {
    let regexString = '[^@]+@[^\.\..+]+';
    let reg = new RegExp(regexString);

    if (reg.test(email))
      this.emailFalse = false;
    else
      this.emailFalse = true;

    console.log("Email: " + this.emailFalse);
  }

  passwordFalse = false;
  checkPassword (password) {
    let regexString = '^(?=.*[0-9]+.*)(?=.*[a-zA-Z]+.*)[0-9a-zA-Z]{6,}$';
    let reg = new RegExp(regexString);

    if (reg.test(password))
      this.passwordFalse = false;
    else
      this.passwordFalse = true;

      console.log("Pass: " + this.passwordFalse);
  }

  async signUp () {

    const { email, password, repassword } = this;
    let resultData: any;

    if (!this.emailFalse && !this.passwordFalse) {
      resultData = await this.api.registerNewUser(email, password, repassword);
    } else {
      resultData = {
        'RespondNum': 0,
        'Message': "Please enter valid email address or password!"
      };
    }

    if (resultData['RepsondNum'] === 1) {
      this.navCtrl.navigateForward(['dashboard']);
    }

    let myToast = await this.toastCtrl.create({
      message: resultData['Message'],
      duration: 2000,
      position: 'top',
      showCloseButton: true,
      closeButtonText: 'Close'
    });

    myToast.present();

  }
}
