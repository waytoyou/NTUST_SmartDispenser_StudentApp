import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DispenserAPIService } from 'src/app/services/DispenserAPI/dispenser-api.service';

@Component({
  selector: 'app-report-problem',
  templateUrl: './report-problem.page.html',
  styleUrls: ['./report-problem.page.scss'],
})
export class ReportProblemPage implements OnInit {

  constructor(public alertController: AlertController, private http: HttpClient, private router: Router, private api: DispenserAPIService) {
    this.getBackground();
  }

  ngOnInit() {
  }

  // Data from previous page
  File: any = [];
  Device_ID: string = "MA_B1_01";
  Email: string = "AAAAA@gmail.com";

  // Initial data
  selectedDeviceId: string = "";
  backgroundImg: any;
  ErrorType = 0;
  Description: string = '';
  url: any = [];
  fileImage: any = [];
  imageIndex = 0;
  updateTrack: boolean = false;
  public selected: string;
  public type;


  // list of problem
  problems = [
    { problem: 'Button does not respond' },
    { problem: 'Unable to water' },
    { problem: 'Leaking water' },
    { problem: 'Screen not shown' },
    { problem: 'Other' }
  ];

  async getBackground() {
    await this.prefDeviceId();
    this.backgroundImg = await this.getPicture(this.selectedDeviceId);
  }

  /*
  Method to make check button like radio button
  */
  public toggle(selected, type) {
    this.ErrorType = type + 1;
    if (type != 4) {
      this.Description = '';
    }
    for (let index = 0; index < this.problems.length; index++) {
      if (this.problems['problem'] != selected['problem']) {
        this.problems[index]['isChecked'] = null;
      }
    }
  }

  /*
  Method to clear all check problem and check other if other description is filled
  */
  onKey(event: any) {
    for (let index = 0; index < this.problems.length; index++) {
      this.problems[index]['isChecked'] = null;
    }
    this.problems[4]['isChecked'] = 1;
    this.ErrorType = 5;
  }

  /*
  Method if user submit the report problem  
  */
  async submit() {
    if (this.ErrorType == 0) { // If user not fill the problem
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

      if ((this.Description == '') && (this.ErrorType == 5)) { // If other description blank
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

        this.api.reportProblem(this.fileImage, this.Device_ID, this.Email, this.ErrorType, this.Description);

        if (this.updateTrack == true) { // If update status true
          this.api.wantUpdateTrack(this.Device_ID, this.Email, true);
        }
        this.router.navigate(['dashboard']);
      }
    }
  }


  /*
  Method to show alert message if user left the page
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

  /*
  Method to add image
  */
  async onFileSelect(event) {

    if (event.target.files[0].size <= 10485760) { // Limit image size to 10 Mb
      if (event.target.files.length > 0) {
        this.fileImage[this.imageIndex] = event.target.files[0];

        var reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]); // read file as data url
        reader.onload = (event) => { // called once readAsDataURL is completed
          this.url[this.imageIndex] = reader.result;
          this.imageIndex++;
        }
      }
    } else {
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

  /*
  Method to rearrange array if user delete the image
  */
  async delete(index) {
    if (index === 0) {
      this.url[0] = this.url[1];
      this.url[1] = this.url[2];
      this.url[2] = null;
      this.fileImage[0] = this.fileImage[1];
      this.fileImage[1] = this.fileImage[2];
      this.fileImage[2] = null;

    } else if (index === 1) {
      this.url[1] = this.url[2];
      this.url[2] = null;
      this.fileImage[1] = this.fileImage[2];
      this.fileImage[2] = null;
    } else {
      this.url[2] = null;
      this.fileImage[2] = null;

    }
    this.imageIndex--;
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
