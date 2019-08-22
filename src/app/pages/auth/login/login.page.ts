import { Component } from '@angular/core';
import { NavController, ToastController, LoadingController } from '@ionic/angular'
import { PreferenceManagerService } from 'src/app/services/PreferenceManager/preference-manager.service';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';
import { StaticVariable } from 'src/app/classes/StaticVariable/static-variable';
import {DashboardPage} from "../../dashboard/dashboard.page";

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {

  // field variable to store input
  email: string = "";
  password: string = "";

  // loadCtrl var
  makeLoading: any;

  constructor(
    private navCtrl: NavController,
    private pref: PreferenceManagerService,
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
    });

    // display the loading controller
    await this.makeLoading.present();
  }

  /**
   * This function is for dismiss the loading controller
   */
  async dismissLoadCtrl () {

    // remove or dismiss the loading controller
    this.makeLoading.dismiss();
  }

  async login() {

    // create loading screen
    await this.createLoadCtrl();

    // get email and password from ion input
    const { email, password } = this;

    // check using API, return with number value
    let resultData = await this.api.loginUser(email, password);

    // initial variable for Toast
    let myToast: any;

    // if login is success with return value equal to 1
    if (resultData === 1) {

      // save the email into session_id
      await this.pref.saveData(StaticVariable.KEY__SESSION_ID, email);
      
      // save the date into last_date
      let nowDate = new Date();
      await this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);

      // get last page if exists (true)
      let lastPage = await this.pref.getData(StaticVariable.KEY__LAST_PAGE);

      // set the login status in dashboard to be true.
      DashboardPage.setLogoutButton(true);

      if (lastPage === false) {

        // if no last page, route to dashboard as default
        this.navCtrl.navigateRoot(['dashboard']);

      } else {

        // set last_page to false from preference
        await this.pref.saveData(StaticVariable.KEY__LAST_PAGE, false);

        // route to going back because when login page called is above the current page
        this.navCtrl.back();
      }

      // create Toast when login is success
      myToast = await this.toastCtrl.create({
        message: "Login success!",
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });

    // if login is failed because incorrect param with return value equal to 0
    } else if (resultData === 0) {
      
      // create Toast when email/password is incorrect
      myToast = await this.toastCtrl.create({
        message: 'Email address or password is incorrect!',
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });

    // if something error when login process
    } else {
      
      // create Toast when there is an error
      myToast = await this.toastCtrl.create({
        message: 'There is an unexpected error, please try again later!',
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });

    }

    // display the Toast
    await myToast.present();

    // dismiss the loading screen
    this.dismissLoadCtrl();
  }

  /**
   * This function is to route the user go to Register Page
   */
  registerlink() {
    this.navCtrl.navigateForward(['register']); 
  }  

  /**
   * This function is to route the user go to Forgot Password Page
   */
  recovery() {
    this.navCtrl.navigateForward(['forgot-password']); 
  }  
}
