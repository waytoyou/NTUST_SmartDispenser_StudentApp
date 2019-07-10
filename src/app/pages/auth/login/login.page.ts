import { Component } from '@angular/core';
import { NavController } from '@ionic/angular'

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
    private api: DispenserAPIService
    ) { }

  ngOnInit() {
  }

  async login() {
    const { email, password } = this;

    let resultData = await this.api.loginUser(email, password);
    console.log(resultData);

    if (resultData === true) {

      // save the email into session_id
      await this.pref.saveData(StaticVariable.KEY__SESSION_ID, email);
      
      // save the date into last_date
      let nowDate = new Date();
      await this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);

      // get last page if exists
      let lastPage = await this.pref.getData(StaticVariable.KEY__LAST_PAGE);

      if (lastPage === null) {

        // if null route to home as default
        this.navCtrl.navigateForward(['home']);

      } else {

        // delete last_page from preference
        await this.pref.removeData(StaticVariable.KEY__LAST_PAGE);

        // route to going back
        // this is because when login page called is above the current page
        this.navCtrl.back();
      }

      console.log("Login successed!");

    } else {
      console.log("The email or password is incorrect!");
    }

  }

  registerlink() {
    this.navCtrl.navigateForward(['register']); 
  }
  
}
