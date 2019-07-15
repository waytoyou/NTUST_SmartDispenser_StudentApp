import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';

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

  constructor(public http: HttpClient, private router: Router, private api: DispenserAPIService) {
    this.getAPI();
  }

  ngOnInit() {

  }

  /*
  This method is to get data from API and change the format to 
  {
    year: 2019,
    monthMaintenance: {
                        Month: January,
                        dayMaintenance: [Data From API] 
    }   
  }
  */
  async getAPI() {
    await this.prefDeviceId();
    this.backgroundImg = await this.getPicture(this.selectedDeviceId);

    let getAPI = await this.api.getDispenserMaintenance(this.selectedDeviceId);

    let errorMeaning = ["Button does not respond", "Unable to water", "Leaking water", "Screen not shown", "Other"];
    let dayArray = [];
    for (let i = getAPI.length - 1; i >= 0; i--) {
      let dataForMaintenance = {
        'Device_ID': getAPI[i]['Device_ID'],
        'ErrorType': getAPI[i]['ErrorType'],
        'Description': getAPI[i]['Description'],
        'CompleteTime': getAPI[i]['CompleteTime'],
        'ErrorMeaning': errorMeaning[getAPI[i]['ErrorType'] - 1],
        'Day': this.getTime(getAPI[i]['CompleteTime'])['dayForTime'],
        'Month': this.getTime(getAPI[i]['CompleteTime'])['monthForTime'],
        'Year': this.getTime(getAPI[i]['CompleteTime'])['yearForTime']
      };
      dayArray.push(dataForMaintenance);
    }

    let dayMaintenance = [];
    let monthArray = [];
    let monthMaintenance = [];
    let yearArray = [];
    let lastMonth;
    let lastYear;

    for (let i = 0; i < dayArray.length; i++) {

      if (i == 0) {
        lastMonth = dayArray[i]['Month'];
        lastYear = dayArray[i]['Year'];
        dayMaintenance.push(dayArray[i]);

      } else {
        if (dayArray[i]['Month'] == lastMonth) {
          dayMaintenance.push(dayArray[i]);
        } else {
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
      // If last array
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
    this.maintenanceData = yearArray;

    console.log(this.maintenanceData);
  }



  /*
  This method is to reconstruct date format from API
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
   * Methods for routing to another page
   */
  goToDashboard() {
    this.router.navigate(['dashboard']);
  }

  /*
  Method to get device ID
  */
  async prefDeviceId() {
    //await this.pref.getData(StaticVariable.KEY__NEARBY_DISPENSER__DEVICE_ID).then((value) => {
    this.selectedDeviceId = 'EE_06_01';
    //});
  }

  /*
  Method to get picture of device
  */
  async getPicture(device_id) {
    let myUrl = await this.api.getDispenserPictureUrlOnly(device_id);
    return myUrl;
  }

}
