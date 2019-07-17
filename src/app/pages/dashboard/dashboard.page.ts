import { StaticVariable } from './../../classes/StaticVariable/static-variable';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { HostListener } from "@angular/core";
import { Router } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';
import { PreferenceManagerService } from '../../services/PreferenceManager/preference-manager.service';
import {DispenserAPIService} from "../../services/DispenserAPI/dispenser-api.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})

export class DashboardPage implements OnInit {
  private device_id = 'T4_07_01';
  
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

  constructor(
    private http:HttpClient, 
    private router: Router, 
    private deviceDetector: DeviceDetectorService,
    private pref: PreferenceManagerService,
    private api: DispenserAPIService) {
  }

  async ngOnInit() {
    this.detectDevice();

    if(this.isDesktopType)
      this.adjustDynamicDesktopScreen();
    else
      this.adjustDynamicMobileScreen();

    await this.checkPrefFirstTime();
    await this.setAPIsData();
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

  async setAPIsData(){
    this.url_dispenser_picture = await this.api.getDispenserPictureUrlOnly(this.device_id);
  }
}