import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController, ToastController } from '@ionic/angular';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';
import { StaticVariable } from 'src/app/classes/StaticVariable/static-variable';
import { PreferenceManagerService } from 'src/app/services/PreferenceManager/preference-manager.service';

@Component({
  selector: 'app-report-problem',
  templateUrl: './report-problem.page.html',
  styleUrls: ['./report-problem.page.scss'],
})
export class ReportProblemPage implements OnInit {

  // Initiate data get from previous page
  selectedDeviceId: string = "";
  Email: string = "";
  backgroundImg: any;

  // Initial data for report problem
  ErrorType = 0;
  Description: string = '';
  urlImage: any = [null, null, null];
  fileImage: any = [null, null, null];
  imageIndex = 0;
  updateTrack: boolean = false;

  // Initial data for toggle(make check button as radio button)
  selectedButton: string;
  type;

  // loadCtrl var
  makeLoading: any;

  // list of problem
  problems = [
    { problem: 'Button does not respond' },
    { problem: 'Unable to water' },
    { problem: 'Leaking water' },
    { problem: 'Screen not shown' },
    { problem: 'Other' }
  ];

  constructor(
    private alertCtrl: AlertController,
    private api: DispenserAPIService, 
    private pref: PreferenceManagerService,
    private loadCtrl: LoadingController,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) { }

  /**
     * ngOnInit() is the function that called when page being loaded.
     * Like in many programming, it's like main function.
     * 
     * If want to use async function:
     * - create new function with async (ex: async myFunctionName() { } )
     * - call in here with "this.myFunctionName();"
     */
  async ngOnInit() {

    // get Device_ID
    await this.prefDeviceId();

    // get Email
    await this.prefEmail();

    // Get background
    this.backgroundImg = await this.getPicture(this.selectedDeviceId);

    // set update track from database, this handling when user already track the dispenser
    await this.setTrackCondition(this.Email);
  }

  ionViewDidEnter () {
    this.checkSession();
  }

  /**
  * Method to make check button like radio button
  */
  async toggle(selectedButton, type) {

    this.updateCurrentSession();

    this.ErrorType = type + 1;

    // If not 'Other' option
    if (type != 4) {
      this.Description = '';
    }

    // Make other option null
    for (let index = 0; index < this.problems.length; index++) {

      if (this.problems['problem'] != selectedButton['problem']) {
        this.problems[index]['isChecked'] = null;
      }
    }
  }

  /**
  * Method to clear all check problem and check other if other description is filled
  */
  async checkOther() {

    this.updateCurrentSession();

    for (let index = 0; index < this.problems.length; index++) {
      this.problems[index]['isChecked'] = null;
    }

    this.problems[4]['isChecked'] = 1;
    this.ErrorType = 5;
  }

  /**
  * Method if user submit the report problem  
  */
  async submit() {

    this.updateCurrentSession();

    // create loading screen
    await this.createLoadCtrl();

    // create variable to store alertCtrl
    let alert: any;

    // If user not fill the problem  make alert message else do next 
    if (this.ErrorType == 0) {

      // Make alert message
      alert = await this.alertCtrl.create({
        mode: "ios",
        header: 'Dispenser problem is incorret',
        message: 'Please choose one of the problems above!',
        buttons: [
          {
            text: 'OK',
            handler: () => {  }
          }
        ]
      });     

    } else {

      // If user not fill 'Other' problem  make alert message else do thank message
      if ((this.Description == '') && (this.ErrorType == 5)) {

        // Make alert message
        alert = await this.alertCtrl.create({
          mode: "ios",
          header: 'Dispenser problem is left blank',
          message: 'Please fill the description when choose other option!',
          buttons: [
            {
              text: 'OK',
              handler: () => {  }
            }
          ]
        });

      } else {

        let reportProblems = new FormData();
        for (let i = 0; i < this.fileImage.length; i++) {
          reportProblems.append('File', this.fileImage[i]);
        }
        reportProblems.append('Device_ID', this.selectedDeviceId);
        reportProblems.append('Email', this.Email);
        reportProblems.append('ErrorType', String(this.ErrorType));
        reportProblems.append('Description', this.Description);

        console.log(reportProblems.get('File'));

        // Make thank message
        alert = await this.alertCtrl.create({
          mode: "ios",
          header: 'Thank you for your assistance!',
          message: 'We have received a problem report',
          buttons: [
            {
              text: 'OK',
              handler: () => {  }
            }
          ]
        });

        // // Send data from API
        // this.api.reportProblem(
        //   this.fileImage, 
        //   this.selectedDeviceId, 
        //   this.Email, 
        //   this.ErrorType, 
        //   this.Description
        // );

        // // If update track is true
        // if (this.updateTrack == true) {
        //   this.api.wantUpdateTrack(this.selectedDeviceId, this.Email, true);
        // }
      }
    }

    // dismiss the loading screen
    this.dismissLoadCtrl();

    // display the alert
    alert.present();

    // Go back to dashboard 
    // this.navCtrl.back();
  }


  /**
  * Method to show alert message if user left the page
  */
  async AlertConfirm() {

    this.updateCurrentSession();

    const alert = await this.alertCtrl.create({
      mode: "ios",
      header: 'Discard Editing?',
      message: 'If you go back now, you will lose editing.',
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Discard',
          cssClass: 'icon-color',
          handler: () => {
            console.log('Confirm Discard');
            
            // Go back to dashboard 
            this.navCtrl.back();
          }
        }
      ]
    });

    // display the alert
    alert.present();
  }

  /**
  * Method to add image
  */
  async onFileSelect(event: any, index: number) {

    this.updateCurrentSession();
    console.log(index);

    // Limit size image to 10 Mb
    if (event.target.files[0].size <= 10485760) {

      // Check image length, image cannot empty
      if (event.target.files.length > 0) {
        this.fileImage[index] = event.target.files[0];

        var reader = new FileReader();

        // Read file as data url
        reader.readAsDataURL(event.target.files[0]);

        // Called once readAsDataURL is completed
        reader.onload = (event) => {
          this.urlImage[index] = reader.result;
          // this.imageIndex++;
        }
      }

    } else {

      // Send message if data is to big
      const toBig = await this.alertCtrl.create({
        mode: "ios",
        header: 'File Size is to Big',
        message: 'Please upload file below 10 Mb!',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              console.log('Confirm Cancel: Ok');
            }
          }
        ]
      });
      await toBig.present();
    }
  }

  /**
   * @param index is number image uploaded by user 
   * Method to rearrange array if user delete the image
   */
  async delete(index: number) {

    this.updateCurrentSession();

    this.fileImage[index] = null;
    this.urlImage[index] = null;

    // // Change the image array if image is delete by user
    // if (index === 0) {
    //   this.urlImage[0] = this.urlImage[1];
    //   this.urlImage[1] = this.urlImage[2];
    //   this.urlImage[2] = null;
    //   this.fileImage[0] = this.fileImage[1];
    //   this.fileImage[1] = this.fileImage[2];
    //   this.fileImage[2] = null;

    // } else if (index === 1) {
    //   this.urlImage[1] = this.urlImage[2];
    //   this.urlImage[2] = null;
    //   this.fileImage[1] = this.fileImage[2];
    //   this.fileImage[2] = null;
    // } else {

    //   this.urlImage[2] = null;
    //   this.fileImage[2] = null;
    // }
    // this.imageIndex--;
  }

  /**
  * Method to get Device ID
  */
  async prefDeviceId() {
    await this.pref.getData(StaticVariable.KEY__DEVICE_ID).then((value) => {
      this.selectedDeviceId = value;
    });
  }

  /**
  * Method to get Email
  */
  async prefEmail() {
    await this.pref.getData(StaticVariable.KEY__SESSION_ID).then((value) => {
      this.Email = value;
    });
  }

  /**
  * Method to get picture of device
  */
  async getPicture(device_id) {
    let picUrl = await this.api.getDispenserPictureUrlOnly(device_id);
    return picUrl;
  }

  /**
   * This function is to check if session login of the user has already
   * timed out or not. If session login is valid then user can access
   * the page, otherwise user should re-login.
   */
  async checkSession() {
    
    // check session ID and date
    let nowDate = new Date();
    let lastDate = await this.pref.getData(StaticVariable.KEY__LAST_DATE)
    let difDate = nowDate.getTime() - lastDate.getTime();

    // check if there any session ID
    let checkData = await this.pref.getData(StaticVariable.KEY__SESSION_ID);

    if (checkData === "" || checkData === null) {

      // create toast when session login is ended (above 5 minutes)
      let myToast = await this.toastCtrl.create({
        message: "Session ID is invalid, please login first!",
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });

      // present the Toast
      myToast.present();

      // direct the user to login page
      this.navCtrl.navigateForward(['login']);
      
    } else if (difDate > StaticVariable.SESSION_TIMEOUT) {

      // create toast when session login is ended (above 5 minutes)
      let myToast = await this.toastCtrl.create({
        message: "Your session is ended, please re-login to grant access!",
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });

      // present the Toast
      myToast.present();

      // dismiss the loading screen
      this.dismissLoadCtrl();
      
      // save the name of page
      this.pref.saveData(StaticVariable.KEY__LAST_PAGE, true);

      // direct the user to login page
      this.navCtrl.navigateForward(['login']);

    } else if (difDate <= StaticVariable.SESSION_TIMEOUT) {

      // save new Date
      this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);
    }
  }

  /**
   * This function is for create the loading controller
   */
  async createLoadCtrl () {
    this.makeLoading = await this.loadCtrl.create({
      message: 'Loading data ...',
      spinner: 'crescent'
    })

    this.makeLoading.present();
  }

  /**
   * This function is for dismiss the loading controller
   */
  async dismissLoadCtrl () {
    this.makeLoading.dismiss();
  }

  /**
   * This function is to check if the email is present and user has check the
   * dispenser as being tracked or not. If it being tracked after user logged
   * in then the star will filled and vice versa. Star displayed as filled or
   * not based on trackIsActive variable.
   * 
   * @param email User's email address
   */
  async setTrackCondition (email: string) {

    // if email is found from preference
    if (email !== "" || email !== null || email !== undefined) {

      // check with checkTractStatus from service to get from API
      await this.api.checkTrackStatus(this.selectedDeviceId, email).then((result) => {

        // set trackIsActive based on result
        this.updateTrack = result['Status'];
      });
    }
  }

  /**
   * This function is to update session login time whenever action is need
   */
  updateCurrentSession () {
    this.checkSession();
  }
}