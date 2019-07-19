import { Component } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})

export class RegisterPage {

  email : string = "";
  password : string = "";
  repassword : string = "";

  // identification for input email and password is valid (false) or not (true)
  emailFalse = false;
  passwordFalse = false;

  constructor(
    private navCtrl: NavController,
    private api: DispenserAPIService,
    private toastCtrl: ToastController
  ) { }

  /**
   * This function is to going back, or route back, to the previous
   * opened page.
   */
  backFunc() {
    this.navCtrl.back();
  }

  checkEmail (email: any) {

    // regex string
    let regexString = '[^@]+@[^\.\..+]+';

    // create new regex with regexString logic
    let reg = new RegExp(regexString);

    // test if input email is valid
    if (reg.test(email)){
      
      // if valid with regex
      this.emailFalse = false;
      
    } else {

      // if not valid with regex
      this.emailFalse = true;

    }

  }

  checkPassword (password: any) {

    // regex string
    let regexString = '^(?=.*[0-9]+.*)(?=.*[a-zA-Z]+.*)[0-9a-zA-Z]{6,}$';

    // create new regex with regexString logic
    let reg = new RegExp(regexString);

    // test if input password is valid
    if (reg.test(password)){
      
      // if valid with regex
      this.passwordFalse = false;
      
    } else {

      // if not valid with regex
      this.passwordFalse = true;

    }

  }

  /**
   * This function is run when user press the Sign Up button. Get
   * the values from ion input, passed to API, and return with
   * validation of registration.
   */
  async signUp () {

    // get values from ion input
    const { email, password, repassword } = this;

    // initial result variable
    let resultData: any = {
      'RespondNum': -1,
      'Message': "There is an unexpected error, please try again later!"
    };

    // first check if password and re password is valid
    if (!this.emailFalse && !this.passwordFalse) {

      // if valid then passed into API
      resultData = await this.api.registerNewUser(email, password, repassword);

    } else {

      // if not valid then set the result to announce invalid input
      resultData = {
        'RespondNum': 0,
        'Message': "Please enter valid email address or password!"
      };
    }

    // if from API respond 1 (success)
    if (resultData['RepsondNum'] === 1) {

      // back to previous page
      this.backFunc();

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
