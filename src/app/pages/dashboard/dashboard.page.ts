import { StaticVariable } from './../../classes/StaticVariable/static-variable';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { HostListener } from "@angular/core";
import { Router } from '@angular/router';
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
  
  deviceInfo = null;
  constructor(
    private http:HttpClient, 
    private router: Router, 
    private deviceService: DeviceDetectorService,
    private pref: PreferenceManagerService,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private api: DispenserAPIService) {
    this.detectDevice();
  }

  ngOnInit() {
    this.getScreenSize();
    this.main();
  }

  async main () {
    
    // check if preference is not build yet
    await this.checkPrefFirstTime();

    /////////////////////////////////
    // this is for testing only
    await this.testingSetDeviceId();
    ////////////////////////////////
    
    // get the device ID
    this.device_id = await this.getDeviceId();

    // set background picture
    this.url_dispenser_picture = await this.getDispenserPictureUrl();

  }

  // this is for testing only
  async testingSetDeviceId () {
    await this.pref.saveData(StaticVariable.KEY__DEVICE_ID, "T4_07_01");
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

  getDeviceId () {
    return this.pref.getData(StaticVariable.KEY__DEVICE_ID);
  }
    
  getDispenserPictureUrl(){
    return this.api.getDispenserPictureUrlOnly(this.device_id);
  }

  /**
   * Methods for routing to another page
   */
  goToDetailedInformation(){
    this.router.navigate(['detailed-information']);
  }

  goToMaintenanceRecords(){
    this.router.navigate(['maintenance-records']);
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
      this.router.navigate(['report-problem']);
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
    let checkData = await this.pref.getData(StaticVariable.KEY__SESSION_ID);
    let returnValue = false;

    // if the data is not present or empty
    if (checkData === "" || checkData === null || checkData === undefined) {

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
}