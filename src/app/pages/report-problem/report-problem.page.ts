import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';
import { StaticVariable } from 'src/app/classes/StaticVariable/static-variable';
import { PreferenceManagerService } from 'src/app/services/PreferenceManager/preference-manager.service';

@Component({
  selector: 'app-report-problem',
  templateUrl: './report-problem.page.html',
  styleUrls: ['./report-problem.page.scss'],
})
export class ReportProblemPage implements OnInit {

  // Initiate data get from previous page
  selectedDeviceId: string = "";
  Email: string = "";
  backgroundImg: any;

  // Initial data for report problem
  ErrorType = 0;
  Description: string = '';
  urlImage: any = [];
  fileImage: any = [];
  imageIndex = 0;
  updateTrack: boolean = false;

  // Initial data for toggle(make check button as radio button)
  selectedButton: string;
  type;

  // list of problem
  problems = [
    { problem: 'Button does not respond' },
    { problem: 'Unable to water' },
    { problem: 'Leaking water' },
    { problem: 'Screen not shown' },
    { problem: 'Other' }
  ];

  constructor(public alertController: AlertController, private http: HttpClient, private router: Router, private api: DispenserAPIService, private pref: PreferenceManagerService) {
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

    // get Device_ID
    await this.prefDeviceId();
    // get Email
    await this.prefEmail();
    // Get background
    this.backgroundImg = await this.getPicture(this.selectedDeviceId);
  }

  /**
  * Method to make check button like radio button
  */
  async toggle(selectedButton, type) {
    this.ErrorType = type + 1;

    // If not 'Other' option
    if (type != 4) {
      this.Description = '';
    }

    // Make other option null
    for (let index = 0; index < this.problems.length; index++) {

      if (this.problems['problem'] != selectedButton['problem']) {
        this.problems[index]['isChecked'] = null;
      }
    }
  }

  /**
  * Method to clear all check problem and check other if other description is filled
  */
  async checkOther() {

    for (let index = 0; index < this.problems.length; index++) {
      this.problems[index]['isChecked'] = null;
    }

    this.problems[4]['isChecked'] = 1;
    this.ErrorType = 5;
  }

  /**
  * Method if user submit the report problem  
  */
  async submit() {

    // If user not fill the problem  make alert message else do next 
    if (this.ErrorType == 0) {

      // Make alert message
      const error = await this.alertController.create({
        mode: "ios",
        header: 'Dispenser problem is incorret',
        message: 'Please choose one of the problems above!',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              console.log('Confirm Cancel: Ok');
            }
          }
        ]
      });
      await error.present();

    } else {

      // If user not fill 'Other' problem  make alert message else do thank message
      if ((this.Description == '') && (this.ErrorType == 5)) {

        // Make alert message
        const error = await this.alertController.create({
          mode: "ios",
          header: 'Dispenser problem is left blank',
          message: 'Please fill the description when choose other option!',
          buttons: [
            {
              text: 'OK',
              handler: () => {
                console.log('Confirm Cancel: Ok');
              }
            }
          ]
        });
        await error.present();

      } else {

        // Make thank message
        const thank = await this.alertController.create({
          mode: "ios",
          header: 'Thank you for your assistance!',
          message: 'We have received a problem report',
          buttons: [
            {
              text: 'OK',
              handler: () => {
                console.log('Confirm Cancel: Ok');
              }
            }
          ]
        });
        await thank.present();

        // Send data from API
        this.api.reportProblem(this.fileImage, this.selectedDeviceId, this.Email, this.ErrorType, this.Description);

        // If update track is true
        if (this.updateTrack == true) {
          this.api.wantUpdateTrack(this.selectedDeviceId, this.Email, true);
        }

        // Go back to dashboard 
        this.router.navigate(['dashboard']);
      }
    }
  }


  /**
  * Method to show alert message if user left the page
  */
  async AlertConfirm() {
    const alert = await this.alertController.create({
      mode: "ios",
      header: 'Dicard Editing?',
      message: 'If you go back now, you will lose editing.',
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Discard',
          cssClass: 'icon-color',
          handler: () => {
            console.log('Confirm Discard');
            this.router.navigate(['dashboard']);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
  * Method to add image
  */
  async onFileSelect(event) {

    // Limit size image to 10 Mb
    if (event.target.files[0].size <= 10485760) {

      // Check image length, image cannot empty
      if (event.target.files.length > 0) {
        this.fileImage[this.imageIndex] = event.target.files[0];

        var reader = new FileReader();

        // Read file as data url
        reader.readAsDataURL(event.target.files[0]);

        // Called once readAsDataURL is completed
        reader.onload = (event) => {
          this.urlImage[this.imageIndex] = reader.result;
          this.imageIndex++;
        }
      }

    } else {

      // Send message if data is to big
      const toBig = await this.alertController.create({
        mode: "ios",
        header: 'File Size is to Big',
        message: 'Please upload file below 10 Mb!',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              console.log('Confirm Cancel: Ok');
            }
          }
        ]
      });
      await toBig.present();
    }
  }

  /**
   * @param index is number image uploaded by user 
   * Method to rearrange array if user delete the image
   */
  async delete(index) {

    // Change the image array if image is delete by user
    if (index === 0) {
      this.urlImage[0] = this.urlImage[1];
      this.urlImage[1] = this.urlImage[2];
      this.urlImage[2] = null;
      this.fileImage[0] = this.fileImage[1];
      this.fileImage[1] = this.fileImage[2];
      this.fileImage[2] = null;

    } else if (index === 1) {
      this.urlImage[1] = this.urlImage[2];
      this.urlImage[2] = null;
      this.fileImage[1] = this.fileImage[2];
      this.fileImage[2] = null;
    } else {

      this.urlImage[2] = null;
      this.fileImage[2] = null;
    }
    this.imageIndex--;
  }

  /**
  * Method to get Device ID
  */
  async prefDeviceId() {
    await this.pref.getData(StaticVariable.KEY__DEVICE_ID).then((value) => {
      this.selectedDeviceId = value;
    });
  }

  /**
  * Method to get Email
  */
  async prefEmail() {
    await this.pref.getData(StaticVariable.KEY__SESSION_ID).then((value) => {
      this.Email = value;
    });
  }

  /**
  * Method to get picture of device
  */
  async getPicture(device_id) {
    let picUrl = await this.api.getDispenserPictureUrlOnly(device_id);
    return picUrl;
  }
}
