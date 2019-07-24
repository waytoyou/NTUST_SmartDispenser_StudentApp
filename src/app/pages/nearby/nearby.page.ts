import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController, NavController, LoadingController } from '@ionic/angular';
import { PreferenceManagerService } from 'src/app/services/PreferenceManager/preference-manager.service';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';
import { StaticVariable } from 'src/app/classes/StaticVariable/static-variable';

@Component({
  selector: 'app-nearby',
  templateUrl: './nearby.page.html',
  styleUrls: ['./nearby.page.scss'],
})
export class NearbyPage implements OnInit {

  /*
    field array variables to store the data
    - nearby variable is the data to display
    - temp variable is store all data while being copied to nearby when filter is active
    - same building means in same building, while next building means in different building
  */
  public nearbySameBuilding = [];
  public nearbyNextBuilding = [];
  private tempSameBuilding = [];
  private tempNextBuilding = [];

  // field variables for identify if filter is ON/OFF and the data is ready to be displayed
  private onlyCold : boolean = false;
  private onlyWarm : boolean = false;
  private onlyHot : boolean = false;
  private resultDone: boolean = false;

  // loadCtrl var
  makeLoading: any;

  // variable to store device id and background img url
  backgroundImg: string = "";
  device_id: string = "";

  constructor(
    public http: HttpClient,
    public toastCtrl: ToastController,
    private pref: PreferenceManagerService,
    private api: DispenserAPIService,
    private navCtrl: NavController,
    private loadCtrl: LoadingController
  ) {  }

  /**
   * This function being called in the first time page
   * being accessed. It run several code to get dispenser
   * maintenance progress and display the value in HTML.
   * 
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
  async ngOnInit() {

    // create loading screen
    await this.createLoadCtrl();
    
    // check id from preference
    this.device_id = await this.pref.getData(StaticVariable.KEY__DEVICE_ID);
    
    try {
      
      // check if device id is available
      await this.api.getNearbyDispenser(this.device_id);

    } catch (e) {

      // dismiss the loading screen
      this.dismissLoadCtrl();

      // send Toast messsage (announce) on top of page if device id is incorrect
      let myToast = await this.toastCtrl.create({
        message: 'Dispenser is incorrect, please scan the QR Code once again!',
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });

      // present toast and break code as if ends here
      myToast.present();

      // set resultDone to true
      this.resultDone = true;
      return;
    }    

    // get the details of selected dispenser
    let currentDispenserDetails = await this.getDetails(this.device_id);

    // set img background
    this.backgroundImg = await this.getPicture(this.device_id);

    // get the location of selected dispensed
    let currentBuildingLocation = await this.getBuildingLocation(currentDispenserDetails);  

    // get nearby dispensers from selected dispenser
    let getNearbyDispenserJson = await this.getNearby(this.device_id);
    
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

        // group for same building
        this.tempSameBuilding.push(tempAllDetails);

      } else {

        // group for different building
        this.tempNextBuilding.push(tempAllDetails);

      }
    } // end FOR

    // call conditionalFilter for push from TEMP to NEARBY array field
    this.conditionalFilter();

    // dismiss the loading screen
    this.dismissLoadCtrl();
  }

  /**
   * Go Back
   */
  backFunc() {
    this.navCtrl.back();
  }

  /**
   * This function is for create the loading controller
   */
  async createLoadCtrl () {

    // create the loading controller
    this.makeLoading = await this.loadCtrl.create({
      message: 'Loading data ...',
      spinner: 'crescent'
    })

    // display the loading controller
    this.makeLoading.present();
  }

  /**
   * This function is for dismiss the loading controller
   */
  async dismissLoadCtrl () {

    // remove or dismiss the loading controller
    this.makeLoading.dismiss();
  }

  /**
   * coldFilter() method is called when COLD button is pressed
   * - it will change boolean parameter for onlyCold
   * - it will adjust the conditionalFilter() method
   */
  coldFilter () {
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
    if (this.resultDone) {
      if (!this.onlyHot)
        this.onlyHot = true;
      else
        this.onlyHot = false;

      this.conditionalFilter();
    }
  }

  /**
   * this method is for getting the nearby dispenser list in Array
   * 
   * @param   device_id id of the dispenser
   * @returns myJson    json of the nearby dispenser
   */
  async getNearby (device_id: string) {    
    let myJson = await this.api.getNearbyDispenser(device_id);
    return myJson;
  }

  /**
   * this method is for getting the details of the dispenser
   * 
   * @param   device_id id of the dispenser
   * @returns myJson    json of dispenser's details
   */
  async getDetails (device_id: string) {
    let myJson = await this.api.getDispenserDetail(device_id);
    return myJson;
  }

  /**
   * this method is for getting the picture of the dispenser
   * 
   * @param   device_id id of the dispenser
   */
  async getPicture (device_id: string) {
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
  async getBuildingLocation (detailsJson: any) {
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
}