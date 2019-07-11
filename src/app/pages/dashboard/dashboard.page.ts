import { StaticVariable } from './../../classes/StaticVariable/static-variable';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { HostListener } from "@angular/core";
import { Router } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';
import { PreferenceManagerService } from '../../services/PreferenceManager/preference-manager.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})

export class DashboardPage implements OnInit {
  private device_id = 'T4_07_01';
  
  //variables for maintenance progress information
  private url_maintenance_progress = 'https://smartcampus.et.ntust.edu.tw:5425/Dispenser/Repair?Device_ID=' + this.device_id;
  private maintenance_status: any;
  private maintenance_data: any;
  private no_report_problem: boolean;

  //variables for dispenser picture
  public url_dispenser_picture = 'https://smartcampus.et.ntust.edu.tw:5425/Dispenser/Image?Device_ID=' + this.device_id;
  
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
    private pref: PreferenceManagerService) {
    this.detectDevice();
  }

  ngOnInit() {
    this.getScreenSize();
    this.main();
  }

  async main () {
    await this.checkPrefFirstTime();
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
    
  getDispenserPictureUrl(){
    return this.url_dispenser_picture;
  }

  /**
   * Methods for routing to another page
   */
  goToDetailedInformation(){
    this.router.navigate(['detailed-information']);
  }

  goToReportProblem(){
    this.router.navigate(['report-problem']);
  }

  goToMaintenanceRecords(){
    this.router.navigate(['maintenance-records']);
  }

  /**
   * Methods for button status is on or off
   */
  trackButton(){
    if(!this.trackIsActive)
      this.trackIsActive = true;
    else
      this.trackIsActive = false;
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
      await this.pref.saveData(StaticVariable.KEY__LAST_PAGE, null);
      await this.pref.saveData(StaticVariable.KEY__MAINTENANCE_PROGRESS__DEVICE_ID, null);
      await this.pref.saveData(StaticVariable.KEY__NEARBY_DISPENSER__DEVICE_ID, null);
      await this.pref.saveData(StaticVariable.KEY__SESSION_ID, null); 
    }
  }     
}