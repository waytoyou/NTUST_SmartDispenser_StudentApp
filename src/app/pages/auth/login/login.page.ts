import { Component } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular'
import { PreferenceManagerService } from 'src/app/services/PreferenceManager/preference-manager.service';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';
import { StaticVariable } from 'src/app/classes/StaticVariable/static-variable';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {

  email: string = "";
  password: string = "";

  constructor(
    private navCtrl: NavController,
    private pref: PreferenceManagerService,
    private api: DispenserAPIService,
    private toastCtrl: ToastController
    ) { }

  ngOnInit() {
  }

  /**
   * This function is to going back, or route back, to the previous
   * opened page.
   */
  backFunc() {
    this.navCtrl.back();
  }

  async login() {

    // get email and password from ion input
    const { email, password } = this;

    // check using API, return with number value
    let resultData = await this.api.loginUser(email, password);

    // if true
    if (resultData === 1) {

      // save the email into session_id
      await this.pref.saveData(StaticVariable.KEY__SESSION_ID, email);
      
      // save the date into last_date
      let nowDate = new Date();
      await this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);

      // get last page if exists (true)
      let lastPage = await this.pref.getData(StaticVariable.KEY__LAST_PAGE);

      if (lastPage === false) {

        // if no last page, route to dashboard as default
        this.navCtrl.navigateForward(['dashboard']);

      } else {

        // set last_page to false from preference
        await this.pref.saveData(StaticVariable.KEY__LAST_PAGE, false);

        // route to going back because when login page called is above the current page
        this.navCtrl.back();
      }

      let myToast = await this.toastCtrl.create({
        message: "Login success!",
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });
  
      myToast.present();

    } else if (resultData === 0) {
      
      let myToast = await this.toastCtrl.create({
        message: 'Email address or password is incorrect!',
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });

      myToast.present();

    } else {
      
      let myToast = await this.toastCtrl.create({
        message: 'There is an unexpected error, please try again later!',
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });

      myToast.present();

    }

  }

  registerlink() {
    this.navCtrl.navigateForward(['register']); 
  }
  
}
