import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController, NavController, LoadingController } from '@ionic/angular';
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
  email: string = "";
  backgroundImg: any;
  
  // loadCtrl var
  makeLoading: any;
  
  constructor(
    public http: HttpClient,
    public toastCtrl: ToastController,
    private pref: PreferenceManagerService,
    private navCtrl: NavController,
    private api: DispenserAPIService,
    private loadCtrl: LoadingController
  ) {  }

  /**
   * This function being called in the first time page
   * being accessed. It run several code to get dispenser
   * maintenance progress and display the value in HTML.
   */
  async ngOnInit() {

    // create loading screen
    await this.createLoadCtrl();
    
    // store id from preference
    this.device_id = await this.pref.getData(StaticVariable.KEY__DEVICE_ID);

    // store email from preference
    this.email = await this.pref.getData(StaticVariable.KEY__SESSION_ID);
      
    // check if device id is available
    try {

      // if the api get HttpErrorResponse it will automatically call CATCH
      await this.api.getDispenserDetail(this.device_id);

    } catch (error) {

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

    // dismiss the loading screen
    this.dismissLoadCtrl();

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
   * This function is to get dispenser maintenance progress from
   * the API with returning JSON value.
   * 
   * @param   device_id   Dispenser ID need for API
   */
  async getRepairCondition (device_id: string) {

    // set initial array variable
    let returnValue = [];

    // check if email is present
    if (this.email === null || this.email === "" || this.email === undefined) {
      
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

      // dismiss the loading screen
      this.dismissLoadCtrl();

      // set current page
      this.pref.saveData(StaticVariable.KEY__LAST_PAGE, true);
      
      // go to login page
      this.navCtrl.navigateForward(['login']);

    } else {

      // get data of maintenance progress using email and device id
      let myData = await this.getData(this.email, device_id);

      // for every report in the data
      for (let i = 0 ; i < myData.length ; i++) {

        let myMaintenance = myData[i];

        let myMtResult = await this.getMtResult(myMaintenance);
        let myEstimateTime = await this.getEstimateTime(myMaintenance);

        // store in returnValue
        returnValue.push({
          'data': myMtResult,
          'estimateTime': myEstimateTime
        });
      }
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

        let completeTime = data[i]['CompleteTime'];
        let status = data[i]['Status'];

        // check if status is 7 (complete) and handling that completeTime is not empty
        if (status === 7 && completeTime !== "") {

          // create Date object for NOW dan COMPLETE TIME
          let currentDate = new Date();
          let completeTimeDate = await this.convertApiTimeToDate(completeTime);

          // get different Date using getTime to convert into miliseconds number type
          let diffDate = currentDate.getTime() - completeTimeDate.getTime();

          // if data founded, check if the status is 7 with the Complete time still under 48 hours
          if (diffDate <= 172800000) {
            
            // store in returnJson if not meet disposal condition
            returnJson.push(data[i]);

          }

        } else {

          // store in returnJson if other than status = 7
          returnJson.push(data[i]);
        }
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

      // create toast when session login is ended (above 5 minutes)
      let myToast = await this.toastCtrl.create({
        message: "Session ID is invalid, please login first!",
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });

      // present the Toast
      myToast.present();

      // direct the user to login page
      this.navCtrl.navigateForward(['login']);
      
    } else if (difDate > StaticVariable.SESSION_TIMEOUT) {

      // create toast when session login is ended (above 5 minutes)
      let myToast = await this.toastCtrl.create({
        message: "Your session is ended, please re-login to grant access!",
        duration: 2000,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'Close'
      });

      // present the Toast
      myToast.present();

      // dismiss the loading screen
      this.dismissLoadCtrl();
      
      // save the name of page
      this.pref.saveData(StaticVariable.KEY__LAST_PAGE, true);

      // direct the user to login page
      this.navCtrl.navigateForward(['login']);

    } else if (difDate <= StaticVariable.SESSION_TIMEOUT) {

      // save new Date
      this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);
    }
  }

  /**
   * This function is to convert the time from the API into Date
   * object in typescript library. The purpose is to create a new
   * Date object with data from the API. This function will return
   * Date object
   * 
   * @param     time    Value of time from API in "2019-03-08 16:32:00" format
   * 
   * @returns   Date    Date object converted result from time
   */
  convertApiTimeToDate (time: any) {
    // time passed is String, construct into Date format
    // time example from json: "2019-03-08 16:32:00"
    // format: YEAR-MONTH-DATEOFMONTH HOUR:MINUTE:SECOND
    
    // split into DATE form and HOUR form
    let splitTime = time.split(" ");

      ////////////////////////////////////////////
     //  DATE PART                             //
    ////////////////////////////////////////////

    // resultDate = YEAR-MONTH-DATEOFMONTH
    let resultDate = splitTime[0];

    // split DATE into YEAR, MONTH, and DATEOFMONTH
    let splitDate = resultDate.split("-");

    let resultYear = splitDate[0];
    let resultMonth = splitDate[1] - 1;
    let resultDateOfMonth = splitDate[2];

      ////////////////////////////////////////////
     //  HOUR PART                             //
    ////////////////////////////////////////////

    // resultHour = HOUR:MINUTE:SECOND
    let resultHour = splitTime[1];

    // split HOUR into HOUR, MINUTE, and SECOND
    let splitHour = resultHour.split(":");

    let resultHourC = splitHour[0];
    let resultMinute = splitHour[1];
    let resultSecond = splitHour[2];

      ////////////////////////////////////////////
     //  CONSTRUCT DATE PART                   //
    ////////////////////////////////////////////

    // now we get every component to construct date from String
    let newDate = new Date(
      resultYear,
      resultMonth,
      resultDateOfMonth,
      resultHourC,
      resultMinute,
      resultSecond,
      0
    );

    return newDate;
  }

  /**
   * This function is to get the estimate time by 3 days after the report is
   * sent. It will return array value of each estimate time has been calculated.
   * 
   * @param data JSON Object of data
   * 
   * @returns diffDate  Number of different between current date and deadline date
   */
  async getEstimateTime (data: any) {

    let uploadTime = await this.convertApiTimeToDate(data['UploadTime']);
    
    // create Date object for NOW dan COMPLETE TIME (by currentTime + 72 hours or 259200000 milisecs.)
    let currentDate = new Date().getTime();
    let deadlineDate = uploadTime.getTime() + 259200000;

    // get different Date using getTime to convert into miliseconds number type
    let diffDate = deadlineDate - currentDate;

    // convert back to hours by divide with 3600000
    diffDate = diffDate / 3600000

    return diffDate.toFixed(0);
  }

  /**
   * This function is to update session login time whenever action is need
   */
  updateCurrentSession () {
    let nowDate = new Date();
    this.pref.saveData(StaticVariable.KEY__LAST_DATE, nowDate);
  }

}
