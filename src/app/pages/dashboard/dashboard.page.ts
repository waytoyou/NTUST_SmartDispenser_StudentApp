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
  
  // variable for dispenser picture
  public url_dispenser_picture: string = "";
  
  // variable for device detector
  private isDesktopType: boolean = false;

  //variables for screen & item resolution
  public screenHeight: any;
  public screenWidth: any;
  public headerHeight: any;
  public contentHeight: any;

  // variables for components in the dashboard page
  public pageLeft: any;
  public jellyfishIconTop: any;
  public jellyfishIconLeft: any;

  // user personal settings (login id, track, report)
  public trackIsActive: boolean = false;
  public hasReportSubmitted: boolean = false;
  private emailAddress: string = "";

  // loadCtrl var
  private makeLoading: any;

  // identify if ngOnInit is done
  private ngOnInitDone: boolean;
  
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

    // initial ngOnInitDone
    this.ngOnInitDone = false;

    // create loading screen
    await this.createLoadCtrl();

    // check if preference is not build yet
    await this.checkPrefFirstTime();

    // this call the function to detect if the device is desktop or mobile device
    this.detectDevice();

    // if it is desktop there will be adjustment for the screen
    if (this.isDesktopType) {

      //if desktop
      this.adjustDynamicDesktopScreen();

    } else {

      // if mobile device
      this.adjustDynamicMobileScreen();
    }

    // get the device id from URL or pref and set to field variable
    await this.setDeviceIdFromUrl();

    // set the device id to preference
    await this.setPrefs();

    // set background picture based on dispenser picture
    await this.setAPIsData();

    // get login information and set to field variable
    await this.getLoginEmail();

    // dismiss the loading screen
    this.dismissLoadCtrl();

    // make ngOnInitDone to true so data can update
    this.ngOnInitDone = true;

    // call again to make sure that data from ngOnInit will load to ionViewDidEnter
    this.ionViewDidEnter();
  }

  async ionViewDidEnter() {   

    if (this.ngOnInitDone) {

      // always check if any report submitted from login id
      await this.setReportCondition(this.emailAddress);

      // always check if dispenser is being tracked
      await this.setTrackCondition(this.emailAddress);
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
   * This function is for detect the device type
   * and store the result to field variable.
   */
  private detectDevice() {
    this.isDesktopType = this.deviceDetector.isDesktop();
  }
  
  /**
   * This function is to get the desktop size if desktop is use
   * and store the result to field variable for display.
   */
  private getDesktopScreenSize(){
    this.screenHeight = window.innerHeight;
    this.screenWidth = this.screenHeight/16 * 9;
  }
    
  /**
   * This function is to get the desktop size if mobile device is use
   * and store the result to field variable for display.
   */
  private getMobileScreenSize(){
    this.screenHeight = window.innerHeight;
    this.screenWidth = window.innerWidth;
  }

  /**
   * This function is to adjust the screen based on device
   * use and store the value to field variables for display.
   */
  private adjustScreen(){
    if((!this.isDesktopType) && (window.innerHeight < window.innerWidth)){
      this.headerHeight = this.screenHeight * 0.6;
      this.contentHeight = this.screenHeight * 0.4;
    }else{
      this.headerHeight = this.screenHeight * 0.7;
      this.contentHeight = this.screenHeight * 0.3;
    }

    // set components based on display size
    this.pageLeft = window.innerWidth/2 - this.screenWidth/2;
    this.jellyfishIconTop = this.headerHeight - 60;
    this.jellyfishIconLeft = this.screenWidth/2 - 60;
  }

  /**
   * This function is for call adjustment if desktop is use.
   */
  private adjustDynamicDesktopScreen(){
    this.getDesktopScreenSize();    
    this.adjustScreen();
  }

  /**
   * This function is for call adjustment if mobile device is use.
   */
  private adjustDynamicMobileScreen() {
    this.getMobileScreenSize();
    this.adjustScreen();
  }

  /**
   * This function is for choosing use dekstop or mobile
   * configuration for display by listening the device
   * used by the user.
   */
  @HostListener('window:resize', ['$event'])
  onresize() {
    if(this.isDesktopType)
      this.adjustDynamicDesktopScreen();
    else
      this.adjustDynamicMobileScreen();
  }

  /**
   * Methods for routing to another page
   * - to Detail Information page
   * - to Maintenance Records page
   * - to Nearby Dispenser page
   * - to Maintenance Progress page
   */
  goToDetailedInformation(){
    this.updateCurrentSession();
    this.navCtrl.navigateForward(['detailed-information']);
  }

  goToMaintenanceRecords(){
    this.updateCurrentSession();
    this.navCtrl.navigateForward(['maintenance-records']);
  }

  goToNearbyDispenser () {
    this.updateCurrentSession();
    this.navCtrl.navigateForward(['nearby']);
  }

  async goToMaintenanceProgress() {

    // check login first, return true if login is true
    if (await this.checkLogin()) {
      this.updateCurrentSession();
      this.navCtrl.navigateForward(['mt-progress']);
    }
  }

  /**
   * This function is for the star button identify if the dispenser
   * is being tracked or not by the user. This active when user click
   * the button, it will also store the value to database through API.
   */
  async trackButton () {

    // create loading screen
    await this.createLoadCtrl();

    // check login first, return true if login is true
    if (await this.checkLogin()) {

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
    this.dismissLoadCtrl();
  }

  /**
   * This function is when the user wants to report a problem. It also
   * check whether the user has logged in or not.
   */
  async goToReportProblem(){

    // check login first, return true if login is true
    if (await this.checkLogin()) {

      this.updateCurrentSession();

      // if true then go to report problem
      this.navCtrl.navigateForward(['report-problem']);
    }
  }

  /**
   * This function is for check First Time Preference, this was for
   * mobile device because cannot load data from preference if key was
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
   * This function is for set device_id from URL also handling when URL 
   * doesn't has device id. It will get the device id from preference. When
   * both ways doesn't has device id, it will alert error message.
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
      errorAlert.present();

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
   * This function is for set device id to preference
   */
  async setPrefs () {

    // save device id to preference
    await this.pref.saveData(StaticVariable.KEY__DEVICE_ID, this.device_id);
  }

  /**
   * This function is for set the url for background picture from API
   */
  async setAPIsData () {
    this.url_dispenser_picture = await this.api.getDispenserPictureUrlOnly(this.device_id);   
  }

  /**
   * This function is to get email from preference session id
   */
  async getLoginEmail () {

    // check if user has report something
    this.emailAddress = await this.pref.getData(StaticVariable.KEY__SESSION_ID);
  }

  /**
   * This function is to check if the email is present and user report
   * is present then user can check his report.
   * 
   * @param email User's email address
   */
  async setReportCondition (email: string) {
    
    // if email is found from preference
    if (email !== "" || email !== null || email !== undefined) {

      // true if found any report submitted
      this.hasReportSubmitted = await this.api.checkAnyReportSubmitted(email, this.device_id);
    }
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
      await this.api.checkTrackStatus(this.device_id, email).then((result) => {

        // set trackIsActive based on result
        this.trackIsActive = result['Status'];
      });
    }
  }

  /**
   * This function is to perform an alert to do login
   * if the user is checked has not logged in.
   */
  async checkLogin () {
    
    // check if there any session ID
    let checkData = await this.checkSession();
    console.log(checkData);
    
    let returnValue = false;

    // if the data is not present or empty
    if (checkData < 1) {

      // initialize addString
      let addString = "";

      // set addString based on condition (note: 1 doesn't perform alert)
      if (checkData === -1) {
        addString = "You need to login first in order to report a problem or track dispenser status, please click the Log In button below!";
      } else if (checkData === 0) {
        addString = "Your session login has timed out, please re login to grant the access!";
      }

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
      loginAlert.present();
      
    } else {

      // return true if login process has done before
      returnValue = true;
    }

    return returnValue;
  }

  /**
   * This function is to check whether the session login of the user. If
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
    this.pref.saveData(StaticVariable.KEY__LAST_PAGE, currentPage);

    // initialize return value
    let returnValue = 0;

    if (checkData === "" || checkData === null) {

      // -1 means that user hasn't login yet
      returnValue = -1;
      
    } else if (difDate > StaticVariable.SESSION_TIMEOUT) {      

      // 0 means that user has session timed out
      returnValue = 0;

    } else if (difDate <= StaticVariable.SESSION_TIMEOUT) {

      // save new Date to preference
      this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);

      // 1 means that user is valid to access
      returnValue = 1;
    }

    return returnValue;
  }

  /**
   * This function is to update session login time whenever action is need
   */
  updateCurrentSession () {
    let nowDate = new Date();
    this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);
  }
}