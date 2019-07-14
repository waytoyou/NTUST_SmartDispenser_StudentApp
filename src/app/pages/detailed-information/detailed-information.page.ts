import { DispenserAPIService } from './../../services/DispenserAPI/dispenser-api.service';
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
  
  public screenHeight: any;
  public screenWidth: any;

  public headerHeight: any;
  public contentHeight: any;

  public pageLeft: any;

  public jellyfishIconTop: any;
  public jellyfishIconLeft: any;
  public detailedInformationTop: any;

  //variables for dispenser APIs
  private device_id = "MA_04_01";
  public url_dispenser_picture: string;
  public dispenser_rawdata: any;
  public dispenser_detail: any;

  //Variable for the device type is Desktop or not
  public isDesktopType: any = false;

  //Variable for contain the dispenser detail
  public dispenser_type: string;
  public dispenser_position: string;

  //Variables for temperature
  public celciusHotTemp: number;
  public celciusWarmTemp: number;
  public celciusColdTemp: number;

  public fahrenheitHotTemp: number;
  public fahrenheitWarmTemp: number;
  public fahrenheitColdTemp: number;

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private deviceDetector: DeviceDetectorService,
    private pref: PreferenceManagerService,
    private api: DispenserAPIService) { }

  async ngOnInit() {

    this.detectDevice();

    if(this.isDesktopType)
      this.adjustDynamicDesktopScreen();
    else
      this.adjustDynamicMobileScreen();
    
    await this.setAPIsData();

    this.setCelciusTemperatures();
    this.setFahrenheitTempratures();
    this.setDispenserDetail();
  }

  private detectDevice() {
    this.isDesktopType = this.deviceDetector.isDesktop();
  }
  
  //--------------------------------------------------
  //Screen Configuration part
  //--------------------------------------------------
  
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
    this.jellyfishIconTop = this.headerHeight/2 - 25;
    this.jellyfishIconLeft = this.screenWidth/2 - 25;
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

  //--------------------------------------------------
  //APIs part
  //--------------------------------------------------
  
  async setAPIsData(){
    this.url_dispenser_picture = await this.api.getDispenserPictureUrlOnly(this.device_id);
    this.dispenser_rawdata = await this.api.getDispenserRawData(this.device_id);
    this.dispenser_detail = await this.api.getDispenserDetail(this.device_id);
  }

  //--------------------------------------------------
  //Variable Assigning part
  //--------------------------------------------------
  setCelciusTemperatures(){
    this.celciusHotTemp = this.dispenser_rawdata['HotTemp'];
    this.celciusWarmTemp = this.dispenser_rawdata['WarmTemp'];
    this.celciusColdTemp = this.dispenser_rawdata['ColdTemp'];
  }

  setFahrenheitTempratures(){
    this.fahrenheitHotTemp = this.celciusHotTemp/5 * 9 + 32;
    this.fahrenheitWarmTemp = this.celciusWarmTemp/5 * 9 + 32;
    this.fahrenheitColdTemp = this.celciusColdTemp/5 * 9 + 32;
  }

  setDispenserDetail(){
    this.dispenser_position = this.dispenser_detail['Position'];
    this.dispenser_type = this.dispenser_detail['Type'];
  }

  //--------------------------------------------------
  //Routing part
  //--------------------------------------------------
  goToDashboard(){
    this.router.navigate(['dashboard']);
  }
}