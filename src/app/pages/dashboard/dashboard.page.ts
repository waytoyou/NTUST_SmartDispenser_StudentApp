import { Component, OnInit } from '@angular/core';
import { HostListener } from "@angular/core";
import { DeviceDetectorService } from 'ngx-device-detector';
import { NavController, AlertController, LoadingController } from '@ionic/angular';
import { ActivatedRoute } from "@angular/router";
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';
import { PreferenceManagerService } from 'src/app/services/PreferenceManager/preference-manager.service';
import { StaticVariable } from 'src/app/classes/StaticVariable/static-variable';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})

export class DashboardPage implements OnInit {

  // variable for store device id
  private device_id: string = "";
  // variable for dispenser data
  public url_dispenser_picture: string = "";
  private dispenser_detail: any;

  public bubble_text_location: string;
  public dispenser_building_location: string = "";
  public dispenser_floor_location: string = "";

  // variable for device detector
  private isDesktopType: boolean = false;

  //variables for screen & item resolution
  public screenHeight: any;
  public screenWidth: any;
  public headerHeight: any;
  public contentHeight: any;

  public pageLeft: any;

  // user personal settings (login id, track, report)
  private static logoutButton: boolean = false;
  public trackIsActive: boolean = false;
  public hasReportSubmitted: boolean = false;
  private emailAddress: string = null;

  // loadCtrl var
  private makeLoading: any;

  // identify if ngOnInit is done
  private ngOnInitDone: boolean = false;

  constructor(
      private deviceDetector: DeviceDetectorService,
      private pref: PreferenceManagerService,
      private navCtrl: NavController,
      private alertCtrl: AlertController,
      private api: DispenserAPIService,
      private actRoute: ActivatedRoute,
      private loadCtrl: LoadingController
  ) { }

  async ngOnInit() {
    this.detectDevice();

    if (this.isDesktopType)
      this.adjustDynamicDesktopScreen();
    else
      this.adjustDynamicMobileScreen();

    // create loading screen
    await this.showLoadScreen();

    await this.setDeviceIdFromUrl();
    await this.setAPIsData();
    await this.setLocationText();

    // check if preference is not build yet
    await this.checkPrefFirstTime();
    await this.setPrefs();
    await this.getLoginEmail();

    await this.dismissLoadScreen();

    // make ngOnInitDone to true so data can update
    this.ngOnInitDone = true;

    // call again to make sure that data from ngOnInit will load to ionViewDidEnter
    await this.ionViewDidEnter();
  }

  async ionViewDidEnter() {
    if (this.ngOnInitDone) {
      await this.getLoginEmail();

      // Log out button appear if user logged in.
      await DashboardPage.setLogOut(this.emailAddress);

      // always check if any report submitted from login id
      await this.setReportCondition(this.emailAddress);

      // always check if dispenser is being tracked
      await this.setTrackCondition(this.emailAddress);
    }
  }

  getLogoutButton(): boolean {
    return DashboardPage.logoutButton;
  }

  public static setLogoutButton(value: boolean) {
    this.logoutButton = value;
  }

  /**
   * create the loading controller
   */
  async showLoadScreen() {
    this.makeLoading = await this.loadCtrl.create({
      message: 'Loading data ...',
      spinner: 'crescent'
    });

    await this.makeLoading.present();
  }

  /**
   * dismiss the loading controller
   */
  async dismissLoadScreen () {
    this.makeLoading.dismiss();
  }

  /**
   * Detect the device type and store the result to field variable.
   */
  private detectDevice(): void {
    this.isDesktopType = this.deviceDetector.isDesktop();
  }

  /**
   * Get the desktop size if desktop is use
   * and store the result to field variable for display.
   */
  private getDesktopScreenSize(): void{
    this.screenHeight = window.innerHeight;
    this.screenWidth = this.screenHeight/16 * 9;
  }
  /**
   * get the desktop size if mobile device is use
   * and store the result to field variable for display.
   */
  private getMobileScreenSize(): void{
    this.screenHeight = window.innerHeight;
    this.screenWidth = window.innerWidth;
  }

  /**
   * 1. Set the size of the height and width of the header and the content.
   * 2. set the page size when portrait and landscape orientation.
   * 3. Set the page
   */
  private adjustScreen(): void{
    if((!this.isDesktopType) && (window.innerHeight < window.innerWidth)){
      this.headerHeight = this.screenHeight * 0.6;
      this.contentHeight = this.screenHeight * 0.4;
    }else{
      this.headerHeight = this.screenHeight * 0.7;
      this.contentHeight = this.screenHeight * 0.3;
    }

    if(this.isDesktopType){
      // set components based on display size
      this.pageLeft = window.innerWidth/2 - this.screenWidth/2;
    }
  }

  /**
   * Adjust the page with the desktop screen dynamically.
   */
  private adjustDynamicDesktopScreen(): void{
    this.getDesktopScreenSize();
    this.adjustScreen();
  }

  /**
   * Adjust the page with the mobile screen dynamically.
   */
  private adjustDynamicMobileScreen(): void{
    this.getMobileScreenSize();
    this.adjustScreen();
  }

  /**
   * Listen to the screen resolution changes & adjust the page
   * to the screen.
   */
  @HostListener('window:resize', ['$event'])
  onresize(): void {
    if(this.isDesktopType)
      this.adjustDynamicDesktopScreen();
    else
      this.adjustDynamicMobileScreen();
  }

  /**
   * Route to Detailed Information page.
   */
  goToDetailedInformation(): void{
    this.updateCurrentSession();
    this.navCtrl.navigateForward(['detailed-information']);
  }

  /**
   * Route to Maintenance Records page.
   */
  goToMaintenanceRecords(): void{
    this.updateCurrentSession();
    this.navCtrl.navigateForward(['maintenance-records']);
  }

  /**
   * Route to Nearby Dispenser page.
   */
  goToNearbyDispenser(): void{
    this.updateCurrentSession();
    this.navCtrl.navigateForward(['nearby']);
  }

  /**
   * Route to Maintennace Progress page.
   */
  async goToMaintenanceProgress(){

    // check login first, return true if login is true
    if (await this.checkLoggedIn()) {
      this.updateCurrentSession();
      this.navCtrl.navigateForward(['mt-progress']);
    }
  }

  /**
   * Identify the star button if the dispenser is being tracked or not by the user.
   * This button is activated when the user click it, and it will store the track
   * value to database through API.
   */
  async trackButton(){

    // create loading screen
    await this.showLoadScreen();

    // check login first, return true if login is true
    if (await this.checkLoggedIn()) {

      this.updateCurrentSession();

      // if clicked then go to the opposite of the store one
      this.trackIsActive = !this.trackIsActive;

      // get returnValue from API service
      let value = await this.api.wantUpdateTrack(this.device_id, this.emailAddress, this.trackIsActive);

      // send want to track or not to database using API
      if (value) {
        let addString = "";

        // check whether the user add or remove
        if (this.trackIsActive) {
          addString = "Added into ";
        } else {
          addString = "Removed from ";
        }

        // gives alert that track is success
        let alert = await this.alertCtrl.create({
          mode: 'ios',
          message: addString + 'tracked dispenser success!',
          buttons: [
            {
              text: 'OK',
              handler: () => { }
            }
          ]
        });

        // display the alert controller
        alert.present();

      } else {

        // gives alert that track is failed
        let alert = await this.alertCtrl.create({
          mode: 'ios',
          message: 'Failed to update tracked dispenser!',
          buttons: [
            {
              text: 'OK',
              handler: () => { }
            }
          ]
        });
        // display the alert controller
        alert.present();

      }
    }

    // dismiss the loading screen
    await this.dismissLoadScreen();
  }

  /**
   * 1. This function is when the user wants to report a problem.
   * 2. It also check whether the user has logged in or not.
   */
  async goToReportProblem(){

    // check login first, return true if login is true
    if (await this.checkLoggedIn()) {

      this.updateCurrentSession();

      // if true then go to report problem
      await this.navCtrl.navigateForward(['report-problem']);
    }
  }

  /**
   * Check First Time Preference, this function is for mobile device
   * because it cannot load data from preference if key was
   * not build first.
   */
  async checkPrefFirstTime () {

    // in here check the first time when app opened
    let a = await this.pref.getData(StaticVariable.KEY__CHECK_PREF_CREATED);

    // if identified that user first time use
    if (a === null || a === undefined) {

      // create some key first using empty data
      await this.pref.saveData(StaticVariable.KEY__CHECK_PREF_CREATED, true);
      await this.pref.saveData(StaticVariable.KEY__LAST_DATE, new Date());
      await this.pref.saveData(StaticVariable.KEY__LAST_PAGE, "");
      await this.pref.saveData(StaticVariable.KEY__DEVICE_ID, "");
      await this.pref.saveData(StaticVariable.KEY__SESSION_ID, "");
    }
  }

  /**
   * 1. Set device_id from URL also handling when URL doesn't has device id.
   * 2. Get the device id from preference.
   * 3. When both ways doesn't has device id, it will alert error message.
   */
  async setDeviceIdFromUrl (){

    // get device ID from URL
    let getId = await this.actRoute.snapshot.paramMap.get('device_id');

    // if not found then check from preference
    if (getId === null) {
      // get device id from preference
      getId = await this.pref.getData(StaticVariable.KEY__DEVICE_ID);
    } else {

      // if found from URL then store to field variable
      this.device_id = getId;

      // then return
      return;
    }

    // check again if from preference still not found
    if (getId === "" || getId === undefined) {

      // create an alert
      let errorAlert = await this.alertCtrl.create({
        mode: 'ios',
        header: 'Error occured',
        message: 'Dispenser is not detected, please try again!',
        buttons: [
          {
            text: 'OK',
            handler: () => { }
          }
        ]
      });

      // display the alert controller
      await errorAlert.present();

    } else {
      // if found from preference then use from it
      this.device_id = getId;

      // create an alert
      let errorAlert = await this.alertCtrl.create({
        mode: 'ios',
        header: 'Error link',
        message: 'Dispenser is not detected, use the data from previous dispenser!',
        buttons: [
          {
            text: 'OK',
            handler: () => { }
          }
        ]
      });

      // display the alert controller
      errorAlert.present();
    }
  }

  /**
   * Set device id to preference
   */
  async setPrefs () {
    await this.pref.saveData(StaticVariable.KEY__DEVICE_ID, this.device_id);
  }

  /**
   * Set the url for background picture from API
   */
  async setAPIsData () {
    this.url_dispenser_picture = await this.api.getDispenserPictureUrlOnly(this.device_id);
    this.dispenser_detail = await this.api.getDispenserDetail(this.device_id);
  }

  /**
   * Get email from preference session id
   */
  async getLoginEmail () {
    // check if user has report something
    this.emailAddress = await this.pref.getData(StaticVariable.KEY__SESSION_ID);
  }

  /**
   * 1. Remove the user email from the preference.
   * 2. Display an alert when the logout is success.
   */
  async logout(){
    await this.pref.saveData(StaticVariable.KEY__SESSION_ID, "");

    // gives alert that track is success
    let alert = await this.alertCtrl.create({
      mode: 'ios',
      message: 'Logout success!',
      buttons: [
        {
          text: 'OK',
          handler: () => { }
        }
      ]
    });

    // display the alert controller
    await alert.present();

    DashboardPage.reloadPage();
  }

  /**
   * Reload the current page.
   */
  private static reloadPage(): void{
    window.location.reload();
  }

  /**
   * Set the information in the location bubble text.
   */
  setLocationText(): void{
    this.bubble_text_location = "Hi! I am Jellyfish and lives in the ";
    this.dispenser_building_location = this.dispenser_detail['Building'];
    this.dispenser_floor_location = "," + "\n" + this.dispenser_detail['Position'] + "!";
  }

  /**
   * User check his report when email & user report are present.
   *
   * @param email User's email address
   */
  async setReportCondition (email: string) {
    // if email is found from preference
    if (email !== "") {

      // true if found any report submitted
      this.hasReportSubmitted = await this.api.checkAnyReportSubmitted(email, this.device_id);
    }
  }

  /**
   * Set the Log out button is on or off depend of the existence of the user's email.
   *
   * @param email User's email address.
   */
  static async setLogOut (email: string) {
    //If email is exist, display Logout button.
    if (email !== "") {
      DashboardPage.setLogoutButton(true);
    } else {
      DashboardPage.setLogoutButton(false);
    }
  }

  /**
   * 1. Set the track button if the user is logged in.
   * 2. The track button is on when the user tracked the dispenser and vice versa.
   *
   * @param email User's email address.
   */
  async setTrackCondition (email: string) {

    // if email is found from preference
    if (email !== "") {

      // check with checkTractStatus from service to get from API
      await this.api.checkTrackStatus(this.device_id, email).then((result) => {
        // set trackIsActive based on result
        this.trackIsActive = result['Status'];
      });
    }
  }

  /**
   * perform an alert to do login
   * if the user is checked has not logged in.
   */
  async checkLoggedIn () {
    // check if there any session ID
    let checkData = await this.checkSession();

    // if the data is not present or empty
    if (checkData < 1) {
      // User is not logged in.
      DashboardPage.setLogoutButton(false);

      // initialize addString
      let addString = "";

      // set addString based on condition (note: 1 doesn't perform alert)
      if (checkData === -1)
        addString = "You need to login first in order to report a problem or track dispenser status, please click the Log In button below!";
      else if (checkData === 0)
        addString = "Your session login has timed out, please re login to grant the access!";

      // create alert to choose login or not
      let loginAlert = await this.alertCtrl.create({
        mode: 'ios',
        header: 'Log In Required',
        message: addString,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              console.log('Cancel clicked');
            }
          },
          {
            text: 'Log In',
            handler: () => {
              // direct the user to login page
              this.navCtrl.navigateForward(['login']);
            }
          }
        ]
      });

      // display the alert controller
      await loginAlert.present();
    } else {
      // User is logged in
      DashboardPage.setLogoutButton(true);
    }

    return this.getLogoutButton();
  }

  /**
   * check whether the session login of the user. If
   * the user still logged in under the session timeout limit then access
   * is granted, and not if above the time limit or no session id is present.
   */
  async checkSession() {

    // check session ID and date
    let nowDate = new Date();
    let lastDate = new Date(await this.pref.getData(StaticVariable.KEY__LAST_DATE));
    let difDate = nowDate.getTime() - lastDate.getTime();

    // check if there any session ID
    let checkData = await this.pref.getData(StaticVariable.KEY__SESSION_ID);

    // save the name of page
    let currentPage = "dashboard";
    await this.pref.saveData(StaticVariable.KEY__LAST_PAGE, currentPage);

    // initialize return value
    let returnValue = 0;

    if (checkData === "" || checkData === null)
      returnValue = -1; // -1 means that user hasn't login yet
    else if (difDate > StaticVariable.SESSION_TIMEOUT)
      returnValue = 0; // 0 means that user has session timed out
    else if (difDate <= StaticVariable.SESSION_TIMEOUT){
      await this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate); // save new Date to preference
      returnValue = 1; // 1 means that user is valid to access
    }

    return returnValue;
  }

  /**
   * Update session login time whenever action is need
   */
  updateCurrentSession(): void{
    let nowDate = new Date();
    this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);
  }
}
