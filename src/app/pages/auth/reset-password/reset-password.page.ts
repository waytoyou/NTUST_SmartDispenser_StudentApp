import { Component, OnInit } from '@angular/core';
import { NavController, ToastController, LoadingController } from '@ionic/angular';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
})
export class ResetPasswordPage implements OnInit {

  // field variable to store input
  email = "";
  password = "";
  re_password = "";
  verif_code = "";

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

  async reset () {

    // initial local variables
    let myToast: any;
    let myToastMessage: string = "";

    // create loading screen
    await this.createLoadCtrl();

    // if form is not completed
    if (
      this.email === "" ||
      this.password === "" ||
      this.re_password === "" ||
      this.verif_code === ""
    ) {
      myToastMessage = "Please fill in all the required form!";
    } else {

      const { email, password, re_password, verif_code } = this;
      let resultData = await this.api.userResetPassword(email, password, re_password, verif_code);
      
      if (resultData === 1) {
        myToastMessage = "Your account password has successfully reset!";
        this.navCtrl.back();
        this.navCtrl.back();
      } else if (resultData === 0) {
        myToastMessage = "Password not match!";
      } else if (resultData === -3) {
        myToastMessage = "The Email does not exist or Verification Code is not valid";
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