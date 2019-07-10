import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DispenserAPIService {

  // domain used
  private domain: string = 'https://smartcampus.et.ntust.edu.tw:5425/';

  // constant url List
  /* 01 */ private urlGetToken: string = this.domain + 'Login';
  /* 02 */ private urlCreateUser: string = this.domain + 'CreateUser';
  /* 03 */ private urlUserLogin: string = this.domain + 'UserLogin';
  /* 04 */ private urlDispenserList: string = this.domain + 'Dispenser/List';
  /* 05 */ private urlNearbyDispenser: string = this.domain + 'Dispenser/Nearby?Device_ID=';
  /* 06 */ private urlDispenserPicture: string = this.domain + 'Dispenser/Image?Device_ID=';
  /* 07 */ private urlDispenserDetail: string = this.domain + 'Dispenser/Detail?Device_ID=';
  /* 08 */ private urlDispenserMaintenance: string = this.domain + 'Dispenser/Maintenance?Device_ID=';
  /* 09 */ private urlDispenserRawData: string = this.domain + 'Dispenser/Rawdata?Device_ID=';
  /* 10 */ private urlDispenserRepairCondition: string = this.domain + 'Dispenser/Repair?Device_ID=';
  /* 11 */ private urlReportDispenserProblem: string = this.domain + 'Dispenser/Report';
  /* 12 */ private urlUpdateTrack: string = this.domain + 'Dispenser/Track';
  /* 13 */ private urlCheckTrackStatus: string = this.domain + 'Dispenser/Track';
  /* 14 */ private urlRepairConditionThingworx: string = this.domain + 'Thingworx/Dispenser/Repair?Status=';

  constructor(private http: HttpClient) { }

  async getToken () {
    let url = this.urlGetToken;

    const postDataToken = {
      "UserName": "pwa_user001",
      "Password": "password"
    };

    let getToken = await this.http.post(url, postDataToken).toPromise();
    return getToken['token'];
  }

  async registerNewUser (email, password, repassword) {
    let url = this.urlCreateUser;
    let returnValue = false;

    let token = await this.getToken();

    const postDataRegister = {
      "Email" : email,
      "Password" : password
    }
    
    if (password !== repassword) {
      console.log("Password not match!");
    } else {
      let httpOption = await {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': token
        })
      };
      console.log(httpOption);
    
      return await this.http.post(url, postDataRegister, httpOption).subscribe(() => {
        return true;
      }, error => {
        return false
      });
    }

  }

  async loginUser (email, password) {
    let url = this.urlUserLogin;
    let respond = false;

    const postBody = {
      "Email": email,
      "Password": password
    };

    let value = await this.http.post(url, postBody).toPromise();

    if (value['code'] === 200) {
      respond = true;
    }
    
    return respond;
  }

  async getDispenserList () {
    let url = this.urlDispenserList;
    let value = await this.http.get(url).toPromise();
    return value['Data'];
  }

  async getNearbyDispenser (device_id) {
    let url = this.urlNearbyDispenser + device_id;
    let value = await this.http.get(url).toPromise();
    return value['Data'];
  }

  async getDispenserPicture (device_id) {
    let url = this.urlDispenserPicture + device_id;
    let value = await this.http.get(url).toPromise();
    return value;
  }

  async getDispenserPictureUrlOnly (device_id) {
    return this.urlDispenserPicture + device_id;
  }

  async getDispenserDetail (device_id) {
    let url = this.urlDispenserDetail + device_id;
    let value = await this.http.get(url).toPromise();
    return value['Data'];
  }

  async getDispenserMaintenance (device_id) {
    let url = this.urlDispenserMaintenance + device_id;
    let value = await this.http.get(url).toPromise();
    return value['Data'];
  }

  async getDispenserRawData (device_id) {
    let url = this.urlDispenserRawData + device_id;
    let myJson;

    await this.http.get(url).toPromise().then((success) => {
      console.log("Success");
      myJson = success['Data'];
    }).catch((failed) => {
      myJson = {
        "Device_ID": device_id,
        "UploadTime": "No Data",
        "Status": 0,
        "HotTemp": 0,
        "WarmTemp": 0,
        "ColdTemp": 0
      }
    });

    return myJson;
  }

  async getDispenserRepairCondition (device_id) {
    let url = this.urlDispenserRepairCondition + device_id;
    let value = await this.http.get(url).toPromise();
    return value['Data'];
  }

  async reportProblem (file, device_id, email, errorType, description) {
    let url = this.urlReportDispenserProblem;

    // still under progress
  }

  async wantUpdateTrack (device_id, email, status) {
    let url = this.urlUpdateTrack;

    const postBody = {
      "Email": email,
      "Device_ID": device_id,
      "Status": status
    }

    await this.http.post(url, postBody).toPromise()
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }

  async checkTrackStatus (device_id, email) {
    let url = this.urlCheckTrackStatus + "?Device_ID=" + device_id + "&Email=" + email;
    let value = await this.http.get(url).toPromise();
    return value['Data'];
  }
  
  async getRepairThingworx (device_id) {
    let url = this.urlRepairConditionThingworx + device_id;
    let value = await this.http.get(url).toPromise();
    return value['Data'];
  }
}
