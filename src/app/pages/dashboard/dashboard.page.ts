import { StaticVariable } from './../../classes/StaticVariable/static-variable';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { HostListener } from "@angular/core";
import { DeviceDetectorService } from 'ngx-device-detector';
import { PreferenceManagerService } from '../../services/PreferenceManager/preference-manager.service';
import { NavController, AlertController } from '@ionic/angular';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})

export class DashboardPage implements OnInit {
  private device_id: string;
  
  //variables for dispenser picture
  public url_dispenser_picture: string;
  
  //variables for device detector
  private isDesktopType: boolean;

  //variables for screen & item resolution
  public screenHeight: any;
  public screenWidth: any;

  public headerHeight: any;
  public contentHeight: any;

  public pageLeft: any;

  public jellyfishIconTop: any;
  public jellyfishIconLeft: any;

  //Variable for tracking progress
  public trackIsActive: boolean = false;
  public hasReportSubmitted: boolean = false;
  
  constructor(
    private http:HttpClient,
    private deviceDetector: DeviceDetectorService,
    private pref: PreferenceManagerService,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private api: DispenserAPIService,
    private actRoute: ActivatedRoute)
  {}

  async ngOnInit() {
    this.detectDevice();

    if(this.isDesktopType)
      this.adjustDynamicDesktopScreen();
    else
      this.adjustDynamicMobileScreen();

    this.setDeviceIdFromUrl();

    // Get the device id from URL
    this.device_id = this.actRoute.snapshot.paramMap.get('device_id');
    await this.setPrefs();

    // check if preference is not build yet
    await this.checkPrefFirstTime();
    await this.setAPIsData();
  }

  ionViewDidEnter() {
    this.setLoginPref();
  }

  private detectDevice() {
    this.isDesktopType = this.deviceDetector.isDesktop();
  }
  
  private getDesktopScreenSize(){
    this.screenHeight = window.innerHeight;
    this.screenWidth = this.screenHeight/16 * 9;
  }
    
  private getMobileScreenSize(){
    this.screenHeight = window.innerHeight;
    this.screenWidth = window.innerWidth;
  }

  private adjustScreen(){
    if((!this.isDesktopType) && (window.innerHeight < window.innerWidth)){
      this.headerHeight = this.screenHeight * 0.6;
      this.contentHeight = this.screenHeight * 0.4;
    }else{
      this.headerHeight = this.screenHeight * 0.7;
      this.contentHeight = this.screenHeight * 0.3;
    }

    this.pageLeft = window.innerWidth/2 - this.screenWidth/2;
    this.jellyfishIconTop = this.headerHeight - 60;
    this.jellyfishIconLeft = this.screenWidth/2 - 60;
  }

  private adjustDynamicDesktopScreen(){
    this.getDesktopScreenSize();    
    this.adjustScreen();
  }

  private adjustDynamicMobileScreen() {
    this.getMobileScreenSize();
    this.adjustScreen();
  }

  @HostListener('window:resize', ['$event'])
  onresize() {
    if(this.isDesktopType)
      this.adjustDynamicDesktopScreen();
    else
      this.adjustDynamicMobileScreen();
  }

  /**
   * Methods for routing to another page
   */
  goToDetailedInformation(){
    this.navCtrl.navigateForward(['detailed-information']);
  }

  goToMaintenanceRecords(){
    this.navCtrl.navigateForward(['maintenance-records']);
  }

  goToNearbyDispenser () {
    this.navCtrl.navigateForward(['nearby']);
  }

  goToMaintenanceProgress() {
    this.navCtrl.navigateForward(['mt-progress']);
  }

  /**
   * Methods for button status is on or off
   */
  async trackButton(){

    // check login first, return true if login is true
    if (await this.checkLogin()) {

      // act the active to
      this.trackIsActive = !this.trackIsActive;

      let email = await this.pref.getData(StaticVariable.KEY__SESSION_ID);
      await this.api.wantUpdateTrack(this.device_id, email, this.trackIsActive);
    }
  }

  async goToReportProblem(){

    // check login first, return true if login is true
    if (await this.checkLogin()) {
      this.navCtrl.navigateForward(['report-problem']);
    }
  }

  /**
   * Check First Time Preference
   */
  async checkPrefFirstTime () {
      
    // in here check the first time when app opened
    let a = await this.pref.getData(StaticVariable.KEY__CHECK_PREF_CREATED);
    if (a === null || a === undefined) {

      // create some first
      await this.pref.saveData(StaticVariable.KEY__CHECK_PREF_CREATED, true);
      await this.pref.saveData(StaticVariable.KEY__LAST_DATE, new Date());
      await this.pref.saveData(StaticVariable.KEY__LAST_PAGE, "");
      await this.pref.saveData(StaticVariable.KEY__DEVICE_ID, "");
      await this.pref.saveData(StaticVariable.KEY__SESSION_ID, ""); 
    }
  }
  
  async setAPIsData(){
    this.url_dispenser_picture = await this.api.getDispenserPictureUrlOnly(this.device_id);   
  }

  async setPrefs(){
    await this.pref.saveData(StaticVariable.KEY__DEVICE_ID, this.device_id);
  }

  async setLoginPref(){
    // check if user has report something
    let email = await this.pref.getData(StaticVariable.KEY__SESSION_ID);
    if (email !== "" || email !== null || email !== undefined) {
      this.hasReportSubmitted = await this.api.checkAnyReportSubmitted(email, this.device_id);
    }
  }

  setDeviceIdFromUrl (){
    this.device_id = this.actRoute.snapshot.paramMap.get('device_id');
  }

  async checkLogin () {
    
    // check if there any session ID
    let checkData = await this.checkSession();
    let returnValue = false;

    // if the data is not present or empty
    if (!checkData) {

      // create alert to choose login or not
      let loginAlert = await this.alertCtrl.create({
        mode: 'ios',
        header: 'Log In Required',
        message: 'You need to login first in order to report a problem or track dispenser status, please click the Log In button below.',
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

              console.log('Log In clicked');
            }
          }
        ]
      });

      // display the alert controller
      loginAlert.present();
      
    } else {

      // return true if login process is done
      returnValue = true;
    }

    return returnValue;
  }

  async checkSession() {
    
    // check session ID and date
    let nowDate = new Date();
    let lastDate = new Date(await this.pref.getData(StaticVariable.KEY__LAST_DATE));
    let difDate = nowDate.getTime() - lastDate.getTime();

    // check if there any session ID
    let checkData = await this.pref.getData(StaticVariable.KEY__SESSION_ID);

    let currentPage = "dashboard";

    if (checkData === "" || checkData === null) {

      return false;
      
    } else if (difDate > StaticVariable.SESSION_TIMEOUT) {

      // remove the session ID from preference
      this.pref.removeData(StaticVariable.KEY__SESSION_ID);

      // save the name of page
      this.pref.saveData(StaticVariable.KEY__LAST_PAGE, currentPage);

      return false;

    } else if (!checkData && difDate <= StaticVariable.SESSION_TIMEOUT) {

      // save new Date
      this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);

      return true;
    }
  }
}