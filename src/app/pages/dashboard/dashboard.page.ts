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
  
  deviceInfo = null;

  constructor(
    private http:HttpClient, 
    private router: Router, 
    private deviceDetector: DeviceDetectorService,
    private pref: PreferenceManagerService) {
  }

  ngOnInit() {
    this.detectDevice();

    if(this.isDesktopType)
      this.adjustDynamicDesktopScreen();
    else
      this.adjustDynamicMobileScreen();

    this.main();
  }

  async main () {
    await this.checkPrefFirstTime();
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
    this.headerHeight = this.screenHeight * 0.7;
    this.contentHeight = this.screenHeight * 0.3;

    this.pageLeft = window.innerWidth/2 - this.screenWidth/2;
    this.jellyfishIconTop = this.headerHeight - 60;
    this.jellyfishIconLeft = this.screenWidth/2 - 60;
  }
  
  private adjustDynamicDesktopScreen(){
    this.getDesktopScreenSize();    
    this.adjustScreen();
  }

  private adjustDynamicMobileScreen(event?: any) {
    this.getMobileScreenSize();
    this.adjustScreen();
  }

  @HostListener('window:resize', ['$event'])
  onresize(event?: any) {
    if(this.isDesktopType)
      this.adjustDynamicDesktopScreen();
    else
      this.adjustDynamicMobileScreen();
  }

  
  public maintenanceStatus(){
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
    
  public getDispenserPictureUrl(){
    return this.url_dispenser_picture;
  }

  /**
   * Methods for routing to another page
   */
  public goToDetailedInformation(){
    this.router.navigate(['detailed-information']);
  }

  public goToReportProblem(){
    this.router.navigate(['report-problem']);
  }

  public goToMaintenanceRecords(){
    this.router.navigate(['maintenance-records']);
  }

  /**
   * Methods for button status is on or off
   */
  public trackButton(){
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