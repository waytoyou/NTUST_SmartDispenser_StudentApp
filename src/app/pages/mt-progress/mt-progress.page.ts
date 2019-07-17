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

  ngOnInit() {
    this.main();
  }

  /**
   * 
   */
  ionViewDidEnter() {
    // this.checkSession();
  }

  /**
   * Go Back
   */
  backFunc() {
    this.navCtrl.back();
  }

  async main () {
    
   // check id from preference
   this.device_id = await this.pref.getData(StaticVariable.KEY__DEVICE_ID);
    
   // check if device id is available
   try {
     await this.api.getDispenserDetail(this.device_id);
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

    // choose which report still in maintenance
    let chosenMaintenance = await this.getRepairCondition(this.device_id);

    // get data for maintenance
    if (chosenMaintenance !== []) {
      this.items = chosenMaintenance;
    }

    // set image
    this.backgroundImg = await this.getPicture(this.device_id);

    // sort items array from the latest
    // await this.sortFunction(this.items);
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

    let returnValue = [];
    let myEmail = await this.pref.getData(StaticVariable.KEY__SESSION_ID);

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
      this.pref.saveData(StaticVariable.KEY__LAST_PAGE, "mt-progress");
      
      // go to login page
      this.navCtrl.navigateForward(['login']);

    } else {

      // get data
      let myData = await this.getData(myEmail, device_id);

      // using 1st data
      let myMaintenance = myData[0];

      // check the maintenance steps inside the data
      let myMtResult = await this.getMtResult(myMaintenance);

      returnValue = myMtResult;
    }

    // let myData = await this.api.getDispenserRepairCondition(device_id);
    // let returnJson: any = [];
    // let alreadyGetData = false;
    // let i = 0;

    // for (let i = 0 ; i < myData.length ; i++) {
    //   if (myData[i]['Status'] !== 4 && !alreadyGetData) {
    //     returnJson = myData[i];
    //     alreadyGetData = true;
    //   }
    // }

    // while (i < myData.length && !alreadyGetData) {
    //   if (myData[i]['Status'] !== 4) {
    //     returnJson = myData[i];
    //     alreadyGetData = true;
    //     i++;
    //     console.log(i);
        
    //   }
    // }

    // for (let i = 0 ; i < myData.length ; i++) {
    //   let status: number = myData[i]['Status'];
    //   let statusString: string = this.arrayStatus[status - 1];

    //   let errorType: number = myData[i]['ErrorType'];
    //   let errorTypeString: string;
    //   if (errorType == 5) {
    //     errorTypeString = myData[i]['Description'];
    //   } else {
    //     errorTypeString = this.arrayErrorType[errorType - 1];
    //   }

    //   let uploadTime = await this.getTime(myData[i]['UploadTime']);

    //   let result = {
    //     'UploadTime': uploadTime,
    //     'UploadTimeString': myData[i]['UploadTime'],
    //     'StatusNum': status,
    //     'Status': statusString,
    //     'ErrorTypeNum': errorType,
    //     'ErrorType': errorTypeString
    //   };

    //   returnJson.push(result);
    // }

    return returnValue;
  }

  async getData (email: string, device_id: string) {

    let data = await this.api.getDispenserRepairCondition(device_id);
    let returnJson = [];

    for (let i = 0 ; i < data.length ; i++) {
      if (data[i]['Email'] === email && data[i]['Device_ID'] === device_id) {
        returnJson.push(data[i]);
      }
    }

    return returnJson;
  }

  async getMtResult (myJson: any) {

    // initial empty array
    let returnValue = [];

    // 7 time stored
    // let timeStored = [
    //   myJson['UploadTime'],
    //   myJson['NotifyTime'],
    //   myJson['Time3'],
    //   myJson['Time4'],
    //   myJson['Time5'],
    //   myJson['Time6'],
    //   myJson['CompleteTime']
    // ];

    //////////////////
    // TESTING ONLY //
    let timeStored = [
      "2019-01-02 09:36:44",
      "2019-01-03 08:22:31",
      "2019-01-03 14:12:43",
      "2019-01-04 10:20:02",
      "2019-01-06 09:04:51",
      "2019-01-07 08:05:38",
      "2019-01-07 10:07:49"
    ];
    //////////////////

    // 7 more information stored
    let infoStored = [
      null,
      "(Person in charge: " + myJson['Maintainer'] + ")",
      null,
      null,
      "(Result: " + myJson['Result'] + ")",
      null,
      null
    ];

    // check how many steps
    // let steps = myJson['Status'];

    //////////////////
    // TESTING ONLY //
    let steps = 7;
    //////////////////
 
    for (let i = steps ; i > 0 ; i--) {
      
      let tempJson = {
        'Time': timeStored[i-1],
        'Status': this.arrayStatus[i-1],
        'Information': infoStored[i-1]
      }

      returnValue.push(tempJson);
    }

    // switch (steps) {
    //   case 1: {

    //     tempJson = {
    //       'Time': myJson['UploadTime'],
    //       'Status': this.arrayStatus[0],
    //       'Information': ""
    //     }
    //     returnValue.push(tempJson);

    //     break;
    //   }

    //   case 2: {

    //     tempJson = {
    //       'Time': myJson['NotifyTime'],
    //       'Status': this.arrayStatus[1],
    //       'Information': "(Person in charge: " + myJson['Maintainer'] + ")"
    //     }

    //     returnValue.push(tempJson);

    //     tempJson = {
    //       'Time': myJson['UploadTime'],
    //       'Status': this.arrayStatus[0],
    //       'Information': ""
    //     }

    //     returnValue.push(tempJson);

    //     break;
    //   }

    //   case 3: {

    //     tempJson = {
    //       'Time': myJson['CompleteTime'],
    //       'Status': this.arrayStatus[2],
    //       'Information': ""
    //     }

    //     returnValue.push(tempJson);

    //     tempJson = {
    //       'Time': myJson['NotifyTime'],
    //       'Status': this.arrayStatus[1],
    //       'Information': "(Person in charge: " + myJson['Maintainer'] + ")"
    //     }

    //     returnValue.push(tempJson);

    //     tempJson = {
    //       'Time': myJson['UploadTime'],
    //       'Status': this.arrayStatus[0],
    //       'Information': ""
    //     }

    //     returnValue.push(tempJson);

    //     break;
    //   }
      
    //   case 4: {

    //     tempJson = {
    //       'Time': myJson['CompleteTime'],
    //       'Status': this.arrayStatus[3],
    //       'Information': "(Result: " + myJson['Result'] + ")"
    //     }

    //     returnValue.push(tempJson);

    //     tempJson = {
    //       'Time': myJson['CompleteTime'],
    //       'Status': this.arrayStatus[2],
    //       'Information': ""
    //     }

    //     returnValue.push(tempJson);

    //     tempJson = {
    //       'Time': myJson['NotifyTime'],
    //       'Status': this.arrayStatus[1],
    //       'Information': "(Person in charge: " + myJson['Maintainer'] + ")"
    //     }

    //     returnValue.push(tempJson);

    //     tempJson = {
    //       'Time': myJson['UploadTime'],
    //       'Status': this.arrayStatus[0],
    //       'Information': ""
    //     }

    //     returnValue.push(tempJson);

    //     break;
    //   }
    // }

    return returnValue;
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
    await this.pref.getData(StaticVariable.KEY__DEVICE_ID).then((value) => {
      this.device_id = value;
    });
  }

  async checkSession() {
    
    // check session ID and date
    let nowDate = new Date();
    let lastDate = await this.pref.getData(StaticVariable.KEY__LAST_DATE)
    let difDate = nowDate.getTime() - lastDate.getTime();

    // check if there any session ID
    let checkData = await this.pref.getData(StaticVariable.KEY__SESSION_ID);
    let currentPage = "mt-progress";

    // check in console
      console.log(nowDate);
      console.log(lastDate);
      console.log(difDate);
      console.log(await this.pref.getData(StaticVariable.KEY__SESSION_ID));

    if (checkData === "" || checkData === null) {

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
