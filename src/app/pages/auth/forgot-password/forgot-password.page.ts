import { Component, OnInit } from '@angular/core';
import { NavController, ToastController, LoadingController } from '@ionic/angular';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage implements OnInit {

  // field variable to store input
  email: string = "";

  // loadCtrl var
  makeLoading: any;

  constructor(
    private navCtrl: NavController,
    private api: DispenserAPIService,
    private toastCtrl: ToastController,
    private loadCtrl: LoadingController
  ) { }

  /**
   * To going back, or route back, to the previous
   * opened page.
   */
  backFunc() {
    this.navCtrl.back();
  }

  /**
   * Create the loading controller
   */
  async createLoadCtrl () {

    // insert component of loading controller
    this.makeLoading = await this.loadCtrl.create({
      message: 'Loading data ...',
      spinner: 'crescent',
      duration: 10000
    });

    // display the loading controller
    await this.makeLoading.present();
  }

  /**
   * Dismiss the loading controller
   */
  async dismissLoadCtrl () {
    this.makeLoading.dismiss();
  }

  ngOnInit() {
  }

  async reset (hasEmail: boolean) {
    
    if (!hasEmail) {

      // if user click RESET button
      this.navCtrl.navigateForward(['reset-password']);

    } else {

      // initial local variables
      let myToast: any;
      let myToastMessage: string = "";
      const { email } = this;

      if (this.email === "") {
        myToastMessage = "Please fill in all the required form!"
      } else {

        // create loading screen
        await this.createLoadCtrl();

        // if user click CONTINUE button        
        let resultData = await this.api.userForgotPassword(email);
        
        if (resultData === 1) {
          myToastMessage = "Verification code has been sent to your email address!";
          this.navCtrl.navigateForward(['reset-password']);
        } else if (resultData === 0) {
          myToastMessage = "Email address is not found, please try again!";
        } else {
          myToastMessage = "There is an unexpected error, please try again later!";
        }
      }

      // create Toast with myToastMessage as message display
      myToast = await this.toastCtrl.create({
        message: myToastMessage,
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });

      // display the Toast
      await myToast.present();

      // dismiss the loading screen
      this.dismissLoadCtrl();
    }
  }
}