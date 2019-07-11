import { StaticVariable } from './../../classes/StaticVariable/static-variable';
import { Component, OnInit } from '@angular/core';
import { HostListener } from "@angular/core";
import { Router } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';
import { PreferenceManagerService } from 'src/app/services/PreferenceManager/preference-manager.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-detailed-information',
  templateUrl: './detailed-information.page.html',
  styleUrls: ['./detailed-information.page.scss'],
})
export class DetailedInformationPage implements OnInit {
  
  private screenHeight: any;
  private screenWidth: any;

  private headerHeight: any;
  private contentHeight: any;

  public pageLeft: any;

  public jellyfishIconTop: any;
  public jellyfishIconLeft: any;
  public detailedInformationTop: any;

  //variables for dispenser
  private device_id = 'T4_07_01';
  public url_dispenser_picture = 'https://smartcampus.et.ntust.edu.tw:5425/Dispenser/Image?Device_ID=' + this.device_id;
  
  public isDesktopType: any = false;

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
    this.headerHeight = this.screenHeight * 0.3;
    this.contentHeight = this.screenHeight * 0.7;

    this.pageLeft = window.innerWidth/2 - this.screenWidth/2;
    this.jellyfishIconTop = this.headerHeight/2 - 20;
    this.jellyfishIconLeft = this.screenWidth/2 - 20;
    this.detailedInformationTop = this.headerHeight/2;
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

}
