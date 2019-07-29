import { Component, OnInit } from '@angular/core';
import { HostListener } from "@angular/core";
import { Router, ActivatedRoute } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';
import { PreferenceManagerService } from 'src/app/services/PreferenceManager/preference-manager.service';
import { HttpClient } from '@angular/common/http';
import { NavController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';
import { StaticVariable } from 'src/app/classes/StaticVariable/static-variable';

@Component({
  selector: 'app-detailed-information',
  templateUrl: './detailed-information.page.html',
  styleUrls: ['./detailed-information.page.scss'],
})
export class DetailedInformationPage implements OnInit {

  private loadScreen: any;

  //variables for screen & item resolution
  public screenHeight: any;
  public screenWidth: any;

  public headerHeight: any;
  public contentHeight: any;

  public pageLeft: any;

  //variables for dispenser APIs
  private device_id: string="";
  public url_dispenser_picture: string;
  public dispenser_rawdata: any;
  public dispenser_detail: any;

  //Variable for the device type is Desktop or not
  public isDesktopType: any = false;

  //Variable for contain the dispenser detail
  public dispenser_type: string;
  public dispenserBuildingPosition: string;
  public dispenserPlacedPosition: string;

  //Variables for temperature
  public celsiusHotTemp: any;
  public celsiusWarmTemp: any;
  public celsiusColdTemp: any;

  public fahrenheitHotTemp: any;
  public fahrenheitWarmTemp: any;
  public fahrenheitColdTemp: any;

  public displayHotTemp: string;
  public displayWarmTemp: string;
  public displayColdTemp: string;

  //Variable for toggle condition
  public isToggleActive: boolean = false;

  constructor(
      private http: HttpClient,
      private router: Router,
      private deviceDetector: DeviceDetectorService,
      private pref: PreferenceManagerService,
      private api: DispenserAPIService,
      private navCtrl: NavController,
      private loadCtrl: LoadingController,
      private route: ActivatedRoute
    ) {}

  async ngOnInit() {

    this.detectDevice();

    if(this.isDesktopType)
      this.adjustDynamicDesktopScreen();
    else
      this.adjustDynamicMobileScreen();

    await this.showLoadScreen();

    await this.getPrefsData();

    await this.setAPIsData();

    await this.setCelsiusTemperatures();
    await this.setDispenserDetail();
    await this.setFahrenheitTemperatures();
    await this.setTemperatureDisplay();

    await this.dismissLoadScreen();
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

    if(this.headerHeight < 150)
      this.headerHeight = 150;

    this.contentHeight = this.screenHeight - this.headerHeight;

    this.pageLeft = window.innerWidth/2 - this.screenWidth/2;
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

async getPrefsData(){
  
  // get from nearby dispenser page if exists
  let tempDeviceId: string;
  await this.route.queryParams.subscribe(params => {
    tempDeviceId = params["Device_ID"];
  });

  if (tempDeviceId !== undefined) {
    this.device_id = tempDeviceId;
  } else {
    this.device_id = await this.pref.getData(StaticVariable.KEY__DEVICE_ID);
  }
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
  setCelsiusTemperatures(){
    this.celsiusHotTemp = this.dispenser_rawdata['HotTemp'];
    this.celsiusWarmTemp = this.dispenser_rawdata['WarmTemp'];
    this.celsiusColdTemp = this.dispenser_rawdata['ColdTemp'];
  }

  setFahrenheitTemperatures(){
    this.fahrenheitHotTemp = Math.round(this.celsiusHotTemp/5 * 9 + 32);
    this.fahrenheitWarmTemp = Math.round(this.celsiusWarmTemp/5 * 9 + 32);
    this.fahrenheitColdTemp = Math.round(this.celsiusColdTemp/5 * 9 + 32);
  }

  setDispenserDetail(){
    this.dispenserBuildingPosition = this.dispenser_detail['Building'];
    this.dispenserPlacedPosition = this.dispenser_detail['Position'];
    this.dispenser_type = this.dispenser_detail['Type'];
  }

  setTemperatureToggle(){
    this.isToggleActive = !this.isToggleActive;

    this.setTemperatureDisplay();
  }

  setTemperatureDisplay(){
    this.displayHotTemp = this.filterTemperature(this.celsiusHotTemp, this.fahrenheitHotTemp);
    this.displayWarmTemp = this.filterTemperature(this.celsiusWarmTemp, this.fahrenheitWarmTemp);
    this.displayColdTemp = this.filterTemperature(this.celsiusColdTemp, this.fahrenheitColdTemp);
  }

  filterTemperature(celsius, fahrenheit){

    this.updateCurrentSession();
    
    let displayTemp = "";

    if(celsius != null){
      if(!this.isToggleActive)
        displayTemp = celsius + "°C";
      else
        displayTemp = fahrenheit + "°F";
    }else{
      if(!this.isToggleActive)
        displayTemp = "...°C";
      else
        displayTemp = "...°F";
    }

    return displayTemp;
  }

  async showLoadScreen () {
    // create the loading screen
    this.loadScreen = await this.loadCtrl.create({
      message: 'Loading data ...',
      spinner: 'crescent'
    });

    // show the loading screen
    this.loadScreen.present();
  }

  async dismissLoadScreen () {
  // dismiss/remove the loading screen
    this.loadScreen.dismiss();
  }

  //--------------------------------------------------
  //Routing part
  //--------------------------------------------------
  goToDashboard(){
    this.updateCurrentSession();
    this.navCtrl.back();
  }

  /**
   * This function is to update session login time whenever action is need
   */
  updateCurrentSession () {
    let nowDate = new Date();
    this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);
  }
}