import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController, NavController } from '@ionic/angular';

import { PreferenceManagerService } from '../../services/PreferenceManager/preference-manager.service';
import { StaticVariable } from '../../classes/StaticVariable/static-variable';
import { DispenserAPIService } from '../../services/DispenserAPI/dispenser-api.service';

@Component({
  selector: 'app-nearby',
  templateUrl: './nearby.page.html',
  styleUrls: ['./nearby.page.scss'],
})
export class NearbyPage implements OnInit {

  // field
  public nearbySameBuilding = [];
  public nearbyNextBuilding = [];
  private tempSameBuilding = [];
  private tempNextBuilding = [];

  private onlyCold : boolean = false;
  private onlyWarm : boolean = false;
  private onlyHot : boolean = false;
  private resultDone: boolean = false;

  backgroundImg: any;

  // get deviceId from entering page
  selectedDeviceId: string = "";

  constructor(
    public http: HttpClient,
    public toastCtrl: ToastController,
    private pref: PreferenceManagerService,
    private api: DispenserAPIService,
    private navCtrl: NavController
  ) {  }

  /**
   * ngOnInit() is the function that called when page being loaded.
   * Like in many programming, it's like main function.
   * 
   * If want to use async function:
   * - create new function with async (ex: async myFunctionName() { } )
   * - call in here with "this.myFunctionName();"
   */
  ngOnInit() {
    this.main();
  }

  /**
   * 
   */
  ionViewDidEnter() {
    this.checkSession();
  }

  /**
   * Go Back
   */
  backFunc() {
    this.navCtrl.back();
  }

  /**
   * coldFilter() method is called when COLD button is pressed
   * - it will change boolean parameter for onlyCold
   * - it will adjust the conditionalFilter() method
   */
  coldFilter () {
    this.checkSession();

    if (this.resultDone) {
      if (!this.onlyCold)
        this.onlyCold = true;
      else
        this.onlyCold = false;
      
      this.conditionalFilter();
    }
  }
  
  /**
   * warmFilter() method is called when WARM button is pressed
   * - it will change boolean parameter for onlyWarm
   * - it will adjust the conditionalFilter() method
   */
  warmFilter () {
    this.checkSession();

    if (this.resultDone) {
      if (!this.onlyWarm)
        this.onlyWarm = true;
      else
        this.onlyWarm = false;

      this.conditionalFilter();
    }
  }
  
  /**
   * hotFilter() method is called when HOT button is pressed
   * - it will change boolean parameter for onlyHot
   * - it will adjust the conditionalFilter() method
   */
  hotFilter () {
    this.checkSession();
    
    if (this.resultDone) {
      if (!this.onlyHot)
        this.onlyHot = true;
      else
        this.onlyHot = false;

      this.conditionalFilter();
    }
  }

  /**
   * Parameter needed to be mapped into page:
   * - Device_ID    => getNearby(device_id), urlDetails(device_id)
   * - Status       => getNearby(device_id)
   * - HotTemp      => getNearby(device_id)
   * - WarmTemp     => getNearby(device_id)
   * - ColdTemp     => getNearby(device_id)
   * - Building     => getDetails(device_id)
   * - BuildingLoc  => getBuildingLocation (detailsJson) => for filtering
   * - Position     => getDetails(device_id)
   * - Picture      => getPicture(device_id)
   */
  async main () {

    // check id from preference
    await this.prefDeviceId();
    
    // check if device id is available
    try {
      this.selectedDeviceId = await this.pref.getData(StaticVariable.KEY__NEARBY_DISPENSER__DEVICE_ID);
      await this.api.getNearbyDispenser(this.selectedDeviceId);
      
    } catch (error) {

      // send Toast messsage (announce) on top of page if device id is incorrect
      let myToast = await this.toastCtrl.create({
        message: 'Dispenser is not found or ID is incorrect!',
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });
      myToast.present();
      return;
    }    

    // get the details of selected dispenser
    let currentDispenserDetails = await this.getDetails(this.selectedDeviceId);

    // set img background
    this.backgroundImg = await this.getPicture(this.selectedDeviceId);

    // get the location of selected dispensed
    let currentBuildingLocation = await this.getBuildingLocation(currentDispenserDetails);  

    // get nearby dispensers from selected dispenser
    let getNearbyDispenserJson = await this.getNearby(this.selectedDeviceId);
    
    // for every dispenser in array
    for (let i = 0 ; i < getNearbyDispenserJson.length ; i++) {

      // get the dispenser ID
      let dispenserId = getNearbyDispenserJson[i]['Device_ID'];

      // get dispenser details
      let dispenserDetails = await this.getDetails(dispenserId);

      // get dispenser picture
      let dispenserPicture = await this.getPicture(dispenserId);

      // get dispenser location
      let dispenserBuildingLoc = await this.getBuildingLocation(dispenserDetails);

      // build all components into an object
      let tempAllDetails = {
        'Device_ID': dispenserId,
        'Status': getNearbyDispenserJson[i]['Status'],
        'HotTemp': getNearbyDispenserJson[i]['HotTemp'],
        'WarmTemp': getNearbyDispenserJson[i]['WarmTemp'],
        'ColdTemp': getNearbyDispenserJson[i]['ColdTemp'],
        'Building': dispenserDetails['Building'],
        'Position': dispenserDetails['Position'],
        'Picture': dispenserPicture
      };

      // conditional if this dispenser is in same location with the selected dispenser
      if (dispenserBuildingLoc == currentBuildingLocation) {
        this.tempSameBuilding.push(tempAllDetails);
      } else {
        this.tempNextBuilding.push(tempAllDetails);
      }
    } // end FOR

    // call conditionalFilter for push from TEMP to NEARBY array field
    this.conditionalFilter();
  }

  /**
   * this method is for getting the nearby dispenser list in Array
   * 
   * @param   device_id id of the dispenser
   * @returns myJson    json of the nearby dispenser
   */
  async getNearby (device_id) {    
    let myJson = await this.api.getNearbyDispenser(device_id);
    return myJson;
  }

  /**
   * this method is for getting the details of the dispenser
   * 
   * @param   device_id id of the dispenser
   * @returns myJson    json of dispenser's details
   */
  async getDetails (device_id) {
    let myJson = await this.api.getDispenserDetail(device_id);
    return myJson;
  }

  /**
   * this method is for getting the picture of the dispenser
   * 
   * @param   device_id id of the dispenser
   */
  async getPicture (device_id) {
    let myUrl = await this.api.getDispenserPictureUrlOnly(device_id);
    return myUrl;
  }

  /**
   * this method is for getting the location ID of the dispenser
   * ex: Device_ID = "EE_01_01", location ID = "EE"
   * using split function to split String value
   * 
   * @param   device_id   id of the dispenser
   * @returns mbSplit[0]  location ID from device ID, explained in above
   */
  async getBuildingLocation (detailsJson) {
    let myBuilding = detailsJson['Device_ID'];
    let mbSplit = myBuilding.split("_");

    return mbSplit[0];
  }

  /**
   * this method is for implement either filtering or export data into nearby array field
   * 
   * HOW TO DISPLAY INTO HTML:
   * - all data from API is stored in temp array field, named like "tempSameBuilding"
   * - data which displayed in HTML is from nearby array field, named like "nearbySameBuilding"
   * - in order to be displayed, all correspond data should be imported from TEMP to NEARBY
   * 
   * HOW TO FILTERING:
   * - filters are divided into three categories (cold, warm, hot) yet can be selected more than one
   * - if filter cold is activated then any dispenser which not has cold water is discarded
   * - also worked when filter cold and hot is activated then the one not has cold and hot water is discarded
   * - using filter() function to filter current data into new data
   * - works three time checking, check cold first, then warm, and hot last
   * 
   * resultDone variable is boolean expression for hold data not to displayed yet into HTML
   * - if true then data can be displayed
   * - vice versa for false value
   */
  conditionalFilter () {

    // set resultDone to false
    this.resultDone = false;

    // import all data from temp to nearby
    this.nearbySameBuilding = this.tempSameBuilding;
    this.nearbyNextBuilding = this.tempNextBuilding;

    // filtering cold water dispenser
    if (this.onlyCold) {
      this.nearbySameBuilding = this.nearbySameBuilding.filter((item) => {
        return item['ColdTemp'] > 0;
      });

      this.nearbyNextBuilding = this.nearbyNextBuilding.filter((item) => {
        return item['ColdTemp'] > 0;
      });
    }

    // filtering warm water dispenser
    if (this.onlyWarm) {
      this.nearbySameBuilding = this.nearbySameBuilding.filter((item) => {
        return item['WarmTemp'] > 0;
      });

      this.nearbyNextBuilding = this.nearbyNextBuilding.filter((item) => {
        return item['WarmTemp'] > 0;
      });
    }

    // filtering hot water dispenser
    if (this.onlyHot) {
      this.nearbySameBuilding = this.nearbySameBuilding.filter((item) => {
        return item['HotTemp'] > 0;
      });

      this.nearbyNextBuilding = this.nearbyNextBuilding.filter((item) => {
        return item['HotTemp'] > 0;
      });
    }

    // set resultDone to true
    this.resultDone = true;
  }

  async prefDeviceId () {
    await this.pref.getData(StaticVariable.KEY__NEARBY_DISPENSER__DEVICE_ID).then((value) => {
      this.selectedDeviceId = value;
    });
  }

  async checkSession() {
    
    // check session ID and date
    let nowDate = new Date();
    let lastDate = await this.pref.getData(StaticVariable.KEY__LAST_DATE)
    let difDate = nowDate.getTime() - lastDate.getTime();

    // check if there any session ID
    let checkData = await this.pref.checkData(StaticVariable.KEY__SESSION_ID, null);

    let currentPage = "nearby";

    // check in console
      console.log(nowDate);
      console.log(lastDate);
      console.log(difDate);
      console.log(await this.pref.getData(StaticVariable.KEY__SESSION_ID));

    if (checkData) {

      // direct the user to login page
      this.navCtrl.navigateForward(['login']);
      
    } else if (difDate > StaticVariable.SESSION_TIMEOUT) {

      // direct the user to login page
      this.navCtrl.navigateForward(['login']);
      
      // remove the session ID from preference
      this.pref.removeData(StaticVariable.KEY__SESSION_ID);

      // save the name of page
      this.pref.saveData(StaticVariable.KEY__LAST_PAGE, currentPage);
    } else if (!checkData && difDate <= StaticVariable.SESSION_TIMEOUT) {

      // save new Date
      this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);
    }
  }
}