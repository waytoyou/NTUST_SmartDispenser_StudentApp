import { StaticVariable } from './../../classes/StaticVariable/static-variable';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { HostListener } from "@angular/core";
import { DeviceDetectorService } from 'ngx-device-detector';
import { PreferenceManagerService } from '../../services/PreferenceManager/preference-manager.service';
import { NavController, AlertController } from '@ionic/angular';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})

export class DashboardPage implements OnInit {
  private device_id: string;
  
  //variables for maintenance progress information
  private url_maintenance_progress = 'https://smartcampus.et.ntust.edu.tw:5425/Dispenser/Repair?Device_ID=' + this.device_id;
  private maintenance_status: any;
  private maintenance_data: any;
  private no_report_problem: boolean;

  //variables for dispenser picture
  public url_dispenser_picture: string;
  
  //variables for device detector
  private isDesktopDevice;

  //variables for screen & item resolution
  public screenHeight: any;
  public screenWidth: any;
  public scaledWidth: any;

  public headerHeight: any;
  public contentHeight: any;

  public pageLeft: any;
  public jellyfishIconTop: any;
  public jellyfishIconLeft: any;

  //Variable for tracking progress
  public trackIsActive: boolean = false;

  public hasReportSubmitted: boolean = false;
  
  deviceInfo = null;
  constructor(
    private http:HttpClient, 
    private deviceService: DeviceDetectorService,
    private pref: PreferenceManagerService,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private api: DispenserAPIService) 
  {  }

  ngOnInit() {
    this.main();
  }

  ionViewDidEnter() {
    this.detectDevice();
    this.getScreenSize();
  }

  async main () {
    
    // check if preference is not build yet
    await this.checkPrefFirstTime();

    /////////////////////////////////
    // this is for testing only
    await this.pref.saveData(StaticVariable.KEY__DEVICE_ID, "MA_05_01");
    // await this.pref.saveData(StaticVariable.KEY__SESSION_ID, "ntust.smartcampus@gmail.com");
    ////////////////////////////////
    
    // get the device ID
    this.device_id = await this.pref.getData(StaticVariable.KEY__DEVICE_ID);

    // set background picture
    this.url_dispenser_picture = await this.api.getDispenserPictureUrlOnly(this.device_id);

    // check if user has report something
    let email = await this.pref.getData(StaticVariable.KEY__SESSION_ID);
    if (email !== "" || email !== null || email !== undefined) {
      this.hasReportSubmitted = await this.api.checkAnyReportSubmitted(email, this.device_id);
    }
  }

  detectDevice() {
    this.isDesktopDevice = this.deviceService.isDesktop();
  }
  
  @HostListener('window:resize', ['$event'])
  getScreenSize(event?: any) {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;

    if(this.isDesktopDevice)
      this.scaledWidth = this.screenHeight/16 * 9;
    else
      this.scaledWidth = this.screenWidth;
    
    this.headerHeight = this.screenHeight * 0.7;
    this.contentHeight = this.screenHeight * 0.3;

    this.pageLeft = this.screenWidth/2 - this.scaledWidth/2;
    this.jellyfishIconTop = this.headerHeight - 60;
    this.jellyfishIconLeft = this.scaledWidth/2 - 60;
  }

  maintenanceStatus(){
    this.http.get(this.url_maintenance_progress).subscribe(res => {
      this.maintenance_data = res["Data"];
      this.maintenance_status = this.maintenance_data["status"];
    })
    
    if(this.maintenance_status != 4)
      this.no_report_problem = true;
    else
      this.no_report_problem = false;
      
    console.log('Report status: ' + this.no_report_problem);
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
      if(!this.trackIsActive)
        this.trackIsActive = true;
      else
        this.trackIsActive = false;

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
   * Check First Time Prefference
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

    // check in console
      // console.log(nowDate);
      // console.log(lastDate);
      // console.log(difDate);
      // console.log(await this.pref.getData(StaticVariable.KEY__SESSION_ID));

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