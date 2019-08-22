import { Component } from '@angular/core';
import { NavController, ToastController, LoadingController } from '@ionic/angular';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})

export class RegisterPage {

  // field variable to store input
  email : string = "";
  password : string = "";
  repassword : string = "";

  // identification for input email and password is valid (false) or not (true)
  emailFalse = false;
  passwordFalse = false;

  // loadCtrl var
  makeLoading: any;

  constructor(
    private navCtrl: NavController,
    private api: DispenserAPIService,
    private toastCtrl: ToastController,
    private loadCtrl: LoadingController
  ) { }

  /**
   * This function is to going back, or route back, to the previous
   * opened page.
   */
  backFunc() {
    this.navCtrl.back();
  }

  /**
   * This function is for create the loading controller
   */
  async createLoadCtrl () {

    // create the loading controller
    this.makeLoading = await this.loadCtrl.create({
      message: 'Loading data ...',
      spinner: 'crescent',
      duration: 10000
    })

    // display the loading controller
    this.makeLoading.present();
  }

  /**
   * This function is for dismiss the loading controller
   */
  async dismissLoadCtrl () {

    // remove or dismiss the loading controller
    this.makeLoading.dismiss();
  }

  /**
   * This function is to check email address from ion-input when there is
   * invalid form with check using regex. If input is invalid then
   * it will identify using emailFalse variable and triggered event
   * in ion-input in HTML code
   * 
   * @param email User's email address
   */
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

  /**
   * This function is to check password from ion-input when there is
   * invalid form with check using regex. If input is invalid then
   * it will identify using passwordFalse variable and triggered event
   * in ion-input in HTML code.
   * 
   * @param password User's password
   */
  checkPassword (password: any) {

    // regex string
    let regexString = '^(?=.*[0-9]+.*)(?=.*[a-zA-Z]+.*)[0-9a-zA-Z]{8,}$';

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

    // create loading screen
    await this.createLoadCtrl();

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

    /*
      create Toast with message from API
      - success = Registration success
      - email fault = Email has been used
      - error = There is an unexpected error, please try again later!
    */
    let myToast = await this.toastCtrl.create({
      message: resultData['Message'],
      duration: 2000,
      position: 'top',
      showCloseButton: true,
      closeButtonText: 'Close'
    });

    // display the Toast
    myToast.present();

    // dismiss the loading screen
    this.dismissLoadCtrl();
  }
}
