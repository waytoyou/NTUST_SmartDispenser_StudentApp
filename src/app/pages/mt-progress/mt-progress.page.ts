import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController, NavController } from '@ionic/angular';

import { PreferenceManagerService } from '../../services/PreferenceManager/preference-manager.service';
import { StaticVariable } from '../../classes/StaticVariable/static-variable';
import { DispenserAPIService } from '../../services/DispenserAPI/dispenser-api.service';

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
    "Waiting for confirmation",
    "Send error information to Union",
    "The repairment has been completed，and waits for validation",
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

  ngOnInit() {
    this.main();
  }

  /**
   * 
   */
  ionViewDidEnter() {
    this.checkSession();
  }

  async main () {
    
   // check id from preference
   await this.prefDeviceId();
    
   // check if device id is available
   try {
     this.device_id = await this.pref.getData(StaticVariable.KEY__NEARBY_DISPENSER__DEVICE_ID);
     await this.api.getNearbyDispenser(this.device_id);
     
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

    // get items from API
    this.items = await this.getRepairCondition(this.device_id);

    // set image
    this.backgroundImg = await this.getPicture(this.device_id);
    // console.log(this.backgroundImg);

    // sort items array from the latest
    await this.sortFunction(this.items);

    // test to console
    // console.log(this.items);
  }

  async sortFunction (myArray) {
    await myArray.sort((a, b) => {
      let dateA = new Date(a['UploadTime']), dateB = new Date(b['UploadTime']);
  
      if (dateB > dateA)
        return 1;
      if (dateB < dateA)
        return -1;

      return 0;
    });
  }

  async getRepairCondition (device_id: string) {
    // const myUrl = this.urlGetRepair + device_id;

    // let myJson = await this.http.get(myUrl).toPromise();
    let myData = await this.api.getDispenserRepairCondition(device_id);

    let returnJson: any = [];

    for (let i = 0 ; i < myData.length ; i++) {
      let status: number = myData[i]['Status'];
      let statusString: string = this.arrayStatus[status - 1];

      let errorType: number = myData[i]['ErrorType'];
      let errorTypeString: string;
      if (errorType == 5) {
        errorTypeString = myData[i]['Description'];
      } else {
        errorTypeString = this.arrayErrorType[errorType - 1];
      }

      let uploadTime = await this.getTime(myData[i]['UploadTime']);

      let result = {
        'UploadTime': uploadTime,
        'UploadTimeString': myData[i]['UploadTime'],
        'StatusNum': status,
        'Status': statusString,
        'ErrorTypeNum': errorType,
        'ErrorType': errorTypeString
      };

      returnJson.push(result);
    }

    return returnJson;
  }

  getTime (time) {
    // time passed is String, construct into Date format
    // time example from json: "2019-03-08 16:32:00"
    // format: YEAR-MONTH-DATEOFMONTH HOUR:MINUTE:SECOND
    
    // split into DATE form and HOUR form
    let splitTime = time.split(" ");

    let resultDate = splitTime[0];
    let resultHour = splitTime[1];

    // split DATE into YEAR, MONTH, and DATEOFMONTH
    let splitDate = resultDate.split("-");

    let resultYear = splitDate[0];
    let resultMonth = splitDate[1] - 1;
    let resultDateOfMonth = splitDate[2];

    // split HOUR into HOUR, MINUTE, and SECOND
    let splitHour = resultHour.split(":");

    let resultHourC = splitHour[0];
    let resultMinute = splitHour[1];
    let resultSecond = splitHour[2];

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
   * this method is for getting the picture of the dispenser
   * 
   * @param   device_id id of the dispenser
   */
  async getPicture (device_id) {
    let myUrl = await this.api.getDispenserPictureUrlOnly(device_id);
    return myUrl;
  }

  async prefDeviceId () {
    await this.pref.getData(StaticVariable.KEY__NEARBY_DISPENSER__DEVICE_ID).then((value) => {
      this.device_id = value;
    });
  }

  async checkSession() {
    
    // check session ID and date
    let nowDate = new Date();
    let lastDate = await this.pref.getData(StaticVariable.KEY__LAST_DATE)
    let difDate = nowDate.getTime() - lastDate.getTime();

    // check if there any session ID
    let checkData = await this.pref.checkData(StaticVariable.KEY__SESSION_ID, null);

    let currentPage = "mt-progress";

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
