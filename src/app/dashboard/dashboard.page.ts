import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { HostListener } from "@angular/core";
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})

export class DashboardPage implements OnInit {
  private device_id = 'T4_07_01';
  
  //variables for maintenance progress information
  private url_maintenance_progress = 'https://smartcampus.et.ntust.edu.tw:5425/Dispenser/Repair?Device_ID=' + this.device_id;
  private maintenance_status: any;
  private maintenance_data: any;
  private no_report_problem: boolean;

  //variables for dispenser picture
  public url_dispenser_picture = 'https://smartcampus.et.ntust.edu.tw:5425/Dispenser/Image?Device_ID=' + this.device_id;
  
  //variables for screen resolution
  public screenHeight: any;
  public screenWidth: any;

  public headerHeight: any;

  public jellyfishIconTop: any;
  public jellyfishIconLeft: any;

  public bodyButtonsHeight: any;
  public reportStatusHeight: any;

  //Variable for tracking progress
  public trackIsActive: boolean;
  
  constructor(private http:HttpClient) {  }
  ngOnInit() {
    this.getScreenSize();
  }
  
    @HostListener('window:resize', ['$event'])
    getScreenSize(event?: any) {
      this.screenWidth = window.innerWidth;
      this.screenHeight = window.innerHeight;
      
      this.headerHeight = this.screenHeight * 0.7;
      
      this.jellyfishIconTop = this.headerHeight - 60;
      this.jellyfishIconLeft = this.screenWidth/2 - 60;

      this.bodyButtonsHeight = window.innerHeight * 0.2;
      this.reportStatusHeight = window.innerHeight * 0.1;
      //console.log("Screen Width: " + this.screenWidth);
      //console.log("Jellyfish position: " + this.jellyfishIconLeft);
    }

    maintenanceStatus(){
      this.http.get(this.url_maintenance_progress).subscribe(res => {
        this.maintenance_data = res["Data"];
        this.maintenance_status = this.maintenance_data["status"];
      })
      
      if(this.maintenance_status != 4){
        this.no_report_problem = true;
      }else{
        this.no_report_problem = false;
      }
  
      console.log('Report status: ' + this.no_report_problem);
    }
    
    getDispenserPictureUrl(){
      return this.url_dispenser_picture;
    }
}