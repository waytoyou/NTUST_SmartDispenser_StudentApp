import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';
import { PreferenceManagerService } from 'src/app/services/PreferenceManager/preference-manager.service';
import { StaticVariable } from 'src/app/classes/StaticVariable/static-variable';

@Component({
  selector: 'app-maintenance-records',
  templateUrl: './maintenance-records.page.html',
  styleUrls: ['./maintenance-records.page.scss'],
})
export class MaintenanceRecordsPage implements OnInit {

  // Initiate data
  maintenanceData: any;
  selectedDeviceId: string = "";
  backgroundImg: any;

  constructor(public http: HttpClient, private router: Router, private api: DispenserAPIService, private pref: PreferenceManagerService) {
  }

  /**
     * ngOnInit() is the function that called when page being loaded.
     * Like in many programming, it's like main function.
     * 
     * If want to use async function:
     * - create new function with async (ex: async myFunctionName() { } )
     * - call in here with "this.myFunctionName();"
     */
  async ngOnInit() {
    //  get Device_ID to change the background
    await this.prefDeviceId();

    console.log("device id: " + this.selectedDeviceId);
    this.backgroundImg = await this.getPicture(this.selectedDeviceId);

    // get data from API and save to getAPI
    let getAPI = await this.api.getDispenserMaintenance(this.selectedDeviceId);

    // Change format to make easier to display
    this.maintenanceData = this.changeFormat(getAPI);
  }

  /**
   * This method is to get data from API anda change json format to this format:
   * {
   *  year : 2019,
   *  monthMaintenance :{
   *                      Month: January,
   *                      dayMaintenance: [Data from API]
   *  }
   * }
   * 
   * Parameter needed to run this function
   * - Device_ID
   * - ErrorType
   * - Description
   * - CompleteTime
   * - ErrorMeaning
   */

  changeFormat(data) {

    // Initiate error meaning to translate from error type
    let errorMeaning = ["Button does not respond", "Unable to water", "Leaking water", "Screen not shown", "Other"];

    // iniatiate array for day
    let dayArray = [];

    // This loop is to take data from API
    for (let i = data.length - 1; i >= 0; i--) {
      let dataForMaintenance = {
        'Device_ID': data[i]['Device_ID'],
        'ErrorType': data[i]['ErrorType'],
        'Description': data[i]['Description'],
        'CompleteTime': data[i]['CompleteTime'],
        'ErrorMeaning': errorMeaning[data[i]['ErrorType'] - 1],
        'Day': this.getTime(data[i]['CompleteTime'])['dayForTime'],
        'Month': this.getTime(data[i]['CompleteTime'])['monthForTime'],
        'Year': this.getTime(data[i]['CompleteTime'])['yearForTime']
      };
      dayArray.push(dataForMaintenance);

    }

    // Initiate variabel to store data for parsing
    let dayMaintenance = [];
    let monthArray = [];
    let monthMaintenance = [];
    let yearArray = [];
    let lastMonth;
    let lastYear;

    // This loop is for pasing JSON data
    for (let i = 0; i < dayArray.length; i++) {

      // If first array initiate new object
      if (i == 0) {
        lastMonth = dayArray[i]['Month'];
        lastYear = dayArray[i]['Year'];
        dayMaintenance.push(dayArray[i]);
      } else {

        // If month same push array else make new object
        if (dayArray[i]['Month'] == lastMonth) {
          dayMaintenance.push(dayArray[i]);
        } else {


          // If year same push array else make new object
          if (dayArray[i]['Year'] == lastYear) {
            monthArray.push({
              'month': lastMonth,
              'DayMaintenance': dayMaintenance
            });
            lastMonth = dayArray[i]['Month'];
            dayMaintenance = [];
            dayMaintenance.push(dayArray[i]);
          } else {
            yearArray.push({
              'year': lastYear,
              'MonthMaintenance': monthArray
            })
            lastYear = dayArray[i]['Year'];
            monthMaintenance = [];
            monthMaintenance.push(monthArray[i]);
          }
        }
      }

      // If last array end initiate new object
      if (i == dayArray.length - 1) {
        monthArray.push({
          'month': lastMonth,
          'DayMaintenance': dayMaintenance
        });
        yearArray.push({
          'year': lastYear,
          'MonthMaintenance': monthArray
        })
      }
    }

    // Save parsing data to maintenanceData
    return yearArray;
  }

  /**
   * 
   * @param time is complete time from API
   * 
   * @returns newDate is time with common structure
   * 
   * This method is to reconstruct date format from API
   */
  getTime(time) {

    // time passed is String, construct into Date format
    // time example from json: "2019-03-08 16:32:00"
    // format: YEAR-MONTH-DATEOFMONTH HOUR:MINUTE:SECOND

    let monthName = ["January", "February", "March", "April", "June", "July", "August", "September", "Oktober", "Desember"]

    // split into DATE form and HOUR form
    let splitTime = time.split(" ");

    let resultDate = splitTime[0];
    let resultHour = splitTime[1];

    // split DATE into YEAR, MONTH, and DATEOFMONTH
    let splitDate = resultDate.split("-");

    let resultYear = splitDate[0];
    let resultMonth = splitDate[1] - 1;
    let resultDateOfMonth = splitDate[2];

    let newDate = {
      'dayForTime': resultDateOfMonth,
      'monthForTime': monthName[resultMonth],
      'yearForTime': resultYear
    }

    return newDate;
  }

  /**
   * Methods for go back
   */
  goToDashboard() {
    this.router.navigate(['dashboard']);
  }

  /**
   * Method to get device ID
   */
  async prefDeviceId() {
    this.selectedDeviceId = await this.pref.getData(StaticVariable.KEY__DEVICE_ID);
  }

  /**
  * Method to get picture of device
  */
  async getPicture(device_id) {
    let picUrl = await this.api.getDispenserPictureUrlOnly(device_id);
    return picUrl;
  }
}