import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController, NavController } from '@ionic/angular';
import { PreferenceManagerService } from 'src/app/services/PreferenceManager/preference-manager.service';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';
import { StaticVariable } from 'src/app/classes/StaticVariable/static-variable';

@Component({
  selector: 'app-mt-progress',
  templateUrl: './mt-progress.page.html',
  styleUrls: ['./mt-progress.page.scss'],
})
export class MtProgressPage implements OnInit {

  /**
   * Array for details from Get Repair Condition
   * - Status
   * - ErrorType
   */
  arrayStatus: string[] = [
    "Report sent, waiting for confirmation",
    "Send error information to Union",
    "Report confirmed, repairman will fix soon",
    "Repairment in progress",
    "Repairment done, waiting for validation",
    "Validation complete",
    "Complete"
  ];
  arrayErrorType: string[] = [
    "Button does not respond",
    "Unable to emit water",
    "Leaking water",
    "Screen not shown"
  ];

  items: any = [];
  device_id: string = "";
  backgroundImg: any;

  constructor(
    public http: HttpClient,
    public toastCtrl: ToastController,
    private pref: PreferenceManagerService,
    private navCtrl: NavController,
    private api: DispenserAPIService
  ) {  }

  /**
   * This function being called in the first time page
   * being accessed. It run several code to get dispenser
   * maintenance progress and display the value in HTML.
   */
  async ngOnInit() {
    
    // check id from preference
    this.device_id = await this.pref.getData(StaticVariable.KEY__DEVICE_ID);
      
    // check if device id is available
    try {

      // if the api get HttpErrorResponse it will automatically call CATCH
      await this.api.getDispenserDetail(this.device_id);

    } catch (error) {

      // send Toast messsage (announce) on top of page if device id is incorrect
      let myToast = await this.toastCtrl.create({
        message: 'Dispenser is incorrect, please scan the QR Code once again!',
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });
      
      myToast.present();
      return;
    }   

    // choose which report still in maintenance
    let chosenMaintenance = await this.getRepairCondition(this.device_id);

    // get data for maintenance
    if (chosenMaintenance !== []) {
      this.items = chosenMaintenance;
    }

    // set image
    this.backgroundImg = await this.getPicture(this.device_id);
  }

  /**
   * This function is ionic lifecycle which is triggered whenever 
   * routed or open the page.
   */
  ionViewDidEnter() {
    this.checkSession();
  }

  /**
   * This function is to going back, or route back, to the previous
   * opened page.
   */
  backFunc() {
    this.navCtrl.back();
  }

  /**
   * This function is to get dispenser maintenance progress from
   * the API with returning JSON value.
   * 
   * @param   device_id   Dispenser ID need for API
   */
  async getRepairCondition (device_id: string) {

    // set initial array variable
    let returnValue = [];

    // get the email from session id in preference
    let myEmail = await this.pref.getData(StaticVariable.KEY__SESSION_ID);

    // check if email is present
    if (myEmail === null || myEmail === "" || myEmail === undefined) {
      
      // if there is no email, can enter without email
      // send Toast messsage (announce) on top of page if device id is incorrect
      let myToast = await this.toastCtrl.create({
        message: 'No email address or session login is valid!',
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });
      
      myToast.present();

      // set current page
      this.pref.saveData(StaticVariable.KEY__LAST_PAGE, true);
      
      // go to login page
      this.navCtrl.navigateForward(['login']);

    } else {

      // get data of maintenance progress using email and device id
      let myData = await this.getData(myEmail, device_id);

      // using 1st data, the newest
      let myMaintenance = myData[0];

      // check the maintenance steps inside the data
      let myMtResult = await this.getMtResult(myMaintenance);

      // set result into returnValue variable
      returnValue = myMtResult;
    }

    return returnValue;
  }

  /**
   * This function is to get the data from dispenser repair condition
   * API. It need email address to verify the reporter and device id
   * to get the data. It will return JSON array, list of dispenser in
   * repair condition.
   * 
   * @param email       User's email address
   * @param device_id   Dispenser ID
   */
  async getData (email: string, device_id: string) {

    // get the data from API
    let data = await this.api.getDispenserRepairCondition(device_id);

    // set initial array value
    let returnJson = [];

    /*
      for every object from API will only get data with:
      - correct email address
      - correct device id
    */
    for (let i = 0 ; i < data.length ; i++) {

      // filter the data
      if (data[i]['Email'] === email && data[i]['Device_ID'] === device_id) {

        // if data founded, insert to array
        returnJson.push(data[i]);
      }
    }

    return returnJson;
  }

  /**
   * This function is to get the detail dispenser maintenance progress
   * information. It will return the JSON object with correct parameter
   * which will be used in HTML to display the data.
   * 
   * @param myJson JSON object of raw data from API
   */
  async getMtResult (myJson: any) {

    // initial empty array
    let returnValue = [];

    // array to store 7 different time
    let timeStored = [
      myJson['UploadTime'],
      myJson['NotifyTime'],
      myJson['ConfirmTime'],
      myJson['RepairCallTime'],
      myJson['RepairDoneTime'],
      myJson['MaintenanceDoneTime'],
      myJson['CompleteTime']
    ];

    // array to store 7 more information stored
    // *note: it store null so nothing to be displayed
    let infoStored = [
      null,
      "(Person in charge: " + myJson['Maintainer'] + ")",
      null,
      null,
      "(Result: " + myJson['Result'] + ")",
      null,
      null
    ];

    /*
      check how many steps will be display
      
      *note: there will be condition where status equal to 4
      where the RepairDoneTime is filled, this because company
      assign the deadline time for Repairman App.
    */
    let steps = myJson['Status'];

    // for every steps must be displayed, from backward
    for (let i = steps ; i > 0 ; i--) {
      
      // set JSON object to input into array
      let tempJson = {
        'Time': timeStored[i-1],
        'Status': this.arrayStatus[i-1],
        'Information': infoStored[i-1]
      }

      returnValue.push(tempJson);
    }

    return returnValue;
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
   * This function is to get device ID from preference to field variable
   */
  async prefDeviceId () {
    await this.pref.getData(StaticVariable.KEY__DEVICE_ID).then((value) => {
      this.device_id = value;
    });
  }

  /**
   * This function is to check if session login of the user has already
   * timed out or not. If session login is valid then user can access
   * the page, otherwise user should re-login.
   */
  async checkSession() {
    
    // check session ID and date
    let nowDate = new Date();
    let lastDate = await this.pref.getData(StaticVariable.KEY__LAST_DATE)
    let difDate = nowDate.getTime() - lastDate.getTime();

    // check if there any session ID
    let checkData = await this.pref.getData(StaticVariable.KEY__SESSION_ID);

    if (checkData === "" || checkData === null) {

      // direct the user to login page
      this.navCtrl.navigateForward(['login']);
      
    } else if (difDate > StaticVariable.SESSION_TIMEOUT) {
      
      // remove the session ID from preference
      this.pref.deleteValueOnly(StaticVariable.KEY__SESSION_ID);

      // save the name of page
      this.pref.saveData(StaticVariable.KEY__LAST_PAGE, true);

      // direct the user to login page
      this.navCtrl.navigateForward(['login']);

    } else if (difDate <= StaticVariable.SESSION_TIMEOUT) {

      // save new Date
      this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);
    }
  }

}
