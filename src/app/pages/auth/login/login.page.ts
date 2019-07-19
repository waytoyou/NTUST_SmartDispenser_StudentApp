import { Component } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular'

import { PreferenceManagerService } from '../../../services/PreferenceManager/preference-manager.service';
import { StaticVariable } from '../../../classes/StaticVariable/static-variable';
import { DispenserAPIService } from '../../../services/DispenserAPI/dispenser-api.service';

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

  backFunc() {
    this.navCtrl.back();
  }

  async login() {
    const { email, password } = this;

    let resultData = await this.api.loginUser(email, password);
    console.log(resultData);

    if (resultData === 1) {

      // save the email into session_id
      await this.pref.saveData(StaticVariable.KEY__SESSION_ID, email);
      
      // save the date into last_date
      let nowDate = new Date();
      await this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);

      // get last page if exists
      let lastPage = await this.pref.getData(StaticVariable.KEY__LAST_PAGE);

      if (lastPage === null) {

        // if null route to home as default
        this.navCtrl.navigateForward(['dashboard']);

      } else {

        // delete last_page from preference
        await this.pref.removeData(StaticVariable.KEY__LAST_PAGE);

        // route to going back
        // this is because when login page called is above the current page
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
