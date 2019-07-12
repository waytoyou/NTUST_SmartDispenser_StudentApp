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

  /**
   * This function is for get the token from API.
   * 
   * @returns   token   This return the token value
   * 
   * @example   
   * 
   * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NTE5NjU1NzksImlhdCI6MTU1MTk2MTk3OSwidXNlciI6InB3YV91c2VyMDAxIn0.PXnfohRsONkwct08w3mV00lHOjeb6JtK2Sje6Ofc16o
   */
  async getToken () {
    
    let url = this.urlGetToken;

    const postDataToken = {
      "UserName": "pwa_user001",
      "Password": "password"
    };

    let token: string = "";
    await this.http.post(url, postDataToken).toPromise()
      .then((success) => {
        token = success['token'];
      }, () => {
        console.error("Promise rejected: unable to get token!");
      })
      .catch((e) => {
        console.error("Function error: on getToken => " + e);
      });
  
    return token;
  }

  /**
   * This function is for registering new user using
   * email and password. The password should be input
   * again in the page to confirm password is same and
   * no mistake.
   * 
   * @param     email       Email address of the user
   * @param     password    Password of the user
   * @param     repassword  Re type the password
   * 
   * @returns   boolean     Return true if success and false if failed
   */
  async registerNewUser (email: string, password: string, repassword: string) {
    
    let url = this.urlCreateUser;
    let token: string = "";

    try {
      token = await this.getToken();
    } catch (e) {
      console.error("Function error: on registerNewUser while getToken => " + e);
      return false;
    }

    const postDataRegister = {
      "Email" : email,
      "Password" : password
    }
  
    if (password !== repassword) {
      console.error("Password not match!");
      return false;
    } else {      
      let httpOption = await {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': token
        })
      };

      return await this.http.post(url, postDataRegister, httpOption).toPromise()
      .then(() => {
        return true
      }, () => {
        console.error("Promise rejected: unable to register!");
        return false;
      })
      .catch((e) => {
        console.error("Function error: on registerNewUser => " + e);
        return false;
      });
    
      // return await this.http.post(url, postDataRegister, httpOption).subscribe(() => {
      //   return true;
      // }, () => {
      //   console.error("Promise rejected: unable to get token!");
      // });
    }

  }

  /**
   * This function is for login the user with email and password.
   * Before do login, the email should be verified after register,
   * the server will send the verification email to user email
   * address.
   * 
   * @param     email     Email address of the user
   * @param     password  Password of the user
   * 
   * @returns   respond   Boolean value with true if success, and
   *                      false if failed
   */
  async loginUser (email: string, password: string) {
    
    let url = this.urlUserLogin;

    const postBody = {
      "Email": email,
      "Password": password
    };

    return await this.http.post(url, postBody).toPromise()
      .then((result) => {
        if (result['code'] === 200) {
          return true;
        } else {
          console.error("Error while log in: " + result['msg']);
          return false
        }
      }, () => {
        console.error("Promise rejected: unable to login!");
        return false;
      })
      .catch((e) => {
        console.error("Function error: on loginUser => " + e);
        return false;
      });

    // if (value['code'] === 200) {
    //   respond = true;
    // }
    
    // return respond;
  }

  /**
   * This function is to get the list of device ID from 
   * all dispensers exist from the API.
   * 
   * @returns   value   The json array of data
   * 
   * @example
   * 
   * [
   *  {
   *    "Device_ID": "MA_B1_01"
   *  },
   *  {
   *    "Device_ID": "MA_05_01"
   *  },
   *  ...
   * ]
   */
  async getDispenserList () {

    let url = this.urlDispenserList;

    return await this.http.get(url).toPromise()
      .then((result) => {
        return result['Data'];
      }, () => {
        console.error("Promise rejected: unable to get dispenser list!");
        return [{}];
      })
      .catch((e) => {
        console.error("Function error: on getDispenserList => " + e);
        return [{}];
      });

  }

  /**
   * This function is to get list of nearby dispensers from the
   * target dispenser. It generate data from the API.
   * 
   * @param     device_id   The device ID of target dispenser
   * 
   * @returns   value       The json array of data
   * 
   * @example
   * 
   * [
   *  {
   *    "Device_ID": "MA_02_01",
   *    "UploadTime": "2019-05-02 22:50:26",
   *    "Status": 1,
   *    "HotTemp": 98,
   *    "WarmTemp": 34,
   *    "ColdTemp": 7
   *  },
   *  {
   *    "Device_ID": "MA_04_01",
   *    "UploadTime": "2019-05-02 22:51:09",
   *    "Status": 1,
   *    "HotTemp": 99,
   *    "WarmTemp": 37,
   *    "ColdTemp": 9
   *  },
   *  ...
   * ]
   */
  async getNearbyDispenser (device_id: string) {
    
    let url = this.urlNearbyDispenser + device_id;

    return await this.http.get(url).toPromise()
      .then((result) => {
        return result['Data'];
      }, () => {
        console.error("Promise rejected: unable to get nearby dispenser list!");
        return [{}];
      })
      .catch((e) => {
        console.error("Function error: on getNearbyDispenser => " + e);
        return [{}];
      });
    
    // try {
    //   let value = await this.http.get(url).toPromise();
    //   return value['Data'];
    // } catch (e) {
    //   console.error("Error in getNearbyDispenser: " + e);
    //   return [{}];
    // }
  }

  /**
   * This function is to get picture of the dispenser from
   * the target dispenser. It return the picture of the
   * dispenser that stored in server.
   * 
   * @param     device_id   The device ID of target dispenser
   * 
   * @returns   value       The figure of the dispenser
   */
  async getDispenserPicture (device_id: string) {
    
    let url = this.urlDispenserPicture + device_id;

    return await this.http.get(url).toPromise()
      .then((result) => {
        return result;
      }, () => {
        console.error("Promise rejected: unable to get dispenser picture!");
        return null;
      })
      .catch((e) => {
        console.error("Function error: on getDispenserPicture => " + e);
        return null;
      });
    
    // try {
    //   let value = await this.http.get(url).toPromise();
    //   return value['Data'];
    // } catch (e) {
    //   console.error("Error in getDispenserPicture: " + e);
    //   return null;
    // }
  }

  /**
   * This function is to get the url of the picture requested.
   * Different from the getDispenserPicture function it returns
   * the URL instead the figure.
   * 
   * @param     device_id   The device ID of target dispenser
   * 
   * @returns   value       The url of dispenser picture
   * 
   * @example
   * 
   * https://smartcampus.et.ntust.edu.tw:5425/Dispenser/Image?Device_ID=MA_04_01
   */
  async getDispenserPictureUrlOnly (device_id: string) {
    return this.urlDispenserPicture + device_id;
  }

  /**
   * This function is to get details of the target dispenser from
   * the API. It returns the json format.
   * 
   * @param     device_id   The device ID of target dispenser
   * 
   * @returns   value       The json object of data
   * 
   * @example
   *
   * {
   *   "Device_ID": "EE_07_01",
   *   "Building": "Electrical and Computer Engineering Building 7F",
   *   "Position": "Next to the elevator",
   *   "Type": "UW-9615AG-1"
   * }
   */
  async getDispenserDetail (device_id: string) {
    
    let url = this.urlDispenserDetail + device_id;

    let returnValue = {
      "Device_ID": device_id,
      "Building": "",
      "Position": "",
      "Type": ""
    }

    await this.http.get(url).toPromise()
      .then((result) => {
        returnValue = result['Data'];
      }, () => {
        console.error("Promise rejected: unable to get dispenser detail!");
      })
      .catch((e) => {
        console.error("Function error: on getDispenserDetail => " + e);
      });

    return returnValue;
    
    // try {
    //   let value = await this.http.get(url).toPromise();
    //   return value['Data'];
    // } catch (e) {
    //   console.error("Error in getDispenserDetail: " + e);
    //   return {
    //     "Device_ID": device_id,
    //     "Building": "",
    //     "Position": "",
    //     "Type": ""
    //   };
    // }
  }

  /**
   * This function is to get list of dispenser maintenance info 
   * from the target dispenser from the API. This function is used
   * to get the data about the track of occured problem of a 
   * dispenser. It returns the json format.
   * 
   * @param     device_id   The device ID of target dispenser
   * 
   * @returns   value       The json array of data
   * 
   * @example
   * 
   * [
   *  {
   *    "Device_ID": "T4_04_01",
   *    "ErrorType": 3,
   *    "Description": "Leaking water",
   *    "CompleteTime": "2019-01-02 24:00:00"
   *  },
   *  {
   *    "Device_ID": "T4_04_01",
   *    "ErrorType": 5,
   *    "Description": "Broken",
   *    "CompleteTime": "2019-01-09 24:00:00"
   *  },
   *  ...
   * ]
   */
  async getDispenserMaintenance (device_id:string) {
    
    let url = this.urlDispenserMaintenance + device_id;

    return await this.http.get(url).toPromise()
      .then((result) => {
        return result['Data'];
      }, () => {
        console.error("Promise rejected: unable to get dispenser maintenance info list!");
        return [{}];
      })
      .catch((e) => {
        console.error("Function error: on getDispenserMaintenance => " + e);
        return [{}];
      });
    
    // try {
    //   let value = await this.http.get(url).toPromise();
    //   return value['Data'];
    // } catch (e) {
    //   console.error("Error in getDispenserMaintenance: " + e);
    //   return [{}];
    // }
  }

  /**
   * This function is to get raw data of the target dispenser from
   * the API. It might be the same function as get detail but added
   * with last upload time and temperature of each tank. It returns
   * the json format.
   * 
   * @param     device_id   The device ID of target dispenser
   * 
   * @returns   value       The json object of data
   * 
   * @example
   *
   * {
   *    "Device_ID": "EE_06_01",
   *    "UploadTime": "2019-05-06 11:14:05",
   *    "Status": 1,
   *    "HotTemp": 99,
   *    "WarmTemp": 40,
   *    "ColdTemp": 13
   * }
   */
  async getDispenserRawData (device_id: string) {
    let url = this.urlDispenserRawData + device_id;

    let returnValue = {
      "Device_ID": device_id,
      "UploadTime": "",
      "Status": -1,
      "HotTemp": -1,
      "WarmTemp": -1,
      "ColdTemp": -1
    }

    await this.http.get(url).toPromise()
      .then((result) => {
        returnValue = result['Data'];
      }, () => {
        console.error("Promise rejected: unable to get dispenser raw data!");
      })
      .catch((e) => {
        console.error("Function error: on getDispenserRawData => " + e);
      });

    return returnValue;

    // let myJson;
    // await this.http.get(url).toPromise().then((success) => {
    //   console.log("Success");
    //   myJson = success['Data'];
    // }).catch(() => {
    //   console.error("Error while getting data: " + device_id + ", in getDispenserRawData");
    //   myJson = {
    //     "Device_ID": device_id,
    //     "UploadTime": "",
    //     "Status": -1,
    //     "HotTemp": -1,
    //     "WarmTemp": -1,
    //     "ColdTemp": -1
    //   }
    // });

    // return myJson;
  }

  /**
   * This function is to get the repair condition of the target
   * dispenser from the API. It contains the problem that still
   * under maintenance until it being complete. It returns
   * the json format.
   * 
   * @param     device_id   The device ID of target dispenser
   * 
   * @returns   value       The json object of data
   * 
   * @example
   *
   * {
   *    "Device_ID": "EE_06_01",
   *    "UploadTime": "2019-03-08 16:32:00",
   *    "Status": 4,
   *    "ErrorType": 5,
   *    "Description": "Coldd water button is broken"
   * }
   */
  async getDispenserRepairCondition (device_id: string) {
    
    let url = this.urlDispenserRepairCondition + device_id;

    let returnValue = {
      "Device_ID": device_id,
      "UploadTime": "",
      "Status": -1,
      "HotTemp": -1,
      "WarmTemp": -1,
      "ColdTemp": -1
    }

    await this.http.get(url).toPromise()
      .then((result) => {
        returnValue = result['Data'];
      }, () => {
        console.error("Promise rejected: unable to get dispenser repair condition!");
      })
      .catch((e) => {
        console.error("Function error: on getDispenserRepairCondition => " + e);
      });

    return returnValue;
    
    // try {
    //   let value = await this.http.get(url).toPromise();
    //   return value['Data'];
    // } catch (e) {
    //   console.error("Error in getDispenserRepairCondition: " + e);
    //   return {
    //     "Device_ID": device_id,
    //     "UploadTime": "",
    //     "Status": -1,
    //     "ErrorType": -1,
    //     "Description": ""
    //   };
    // }
  }

  /**
   * This function is for sending a report about problem founded
   * on target dispenser. It require files that uploaded, stored in
   * array, the dispenser ID, email address of the reporter, error
   * type number, and description if needed. It returns boolean value
   * where true if success and false if failed.
   * 
   * @param     file            Files uploaded in array
   * @param     device_id       Dispenser ID
   * @param     email           Reporter's email address
   * @param     errorType       Problem error type number
   * @param     description     Description if error equals to "Other"
   * 
   * @returns   boolean         true = success, false = failed/error
   */
  async reportProblem (file: any, device_id: string, email: string, errorType: number, description: string) {
    
    let url = this.urlReportDispenserProblem;

    let reportProblems = new FormData();
    for (let i = 0; i < file.length; i++) {
      reportProblems.append('File', file[i]);
    }
    reportProblems.append('Device_ID', device_id);
    reportProblems.append('Email', email);
    reportProblems.append('ErrorType', String(errorType));
    reportProblems.append('Description', description);

    return await this.http.post<any>(url, reportProblems).toPromise()
      .then((result) => {
        if (result['code'] === 200) {
          return true;
        } else {
          console.error("Error while sending report: " + result['msg']);
          return false;
        }
      }, () => {
        console.error("Promise rejected: unable to sending report!");
        return false;
      })
      .catch((e) => {
        console.error("Function error: on getDispenserRepairCondition => " + e);
        return false;
      });
    
  }

  /**
   * This function is for gives the user an option to track the
   * dispenser update activity and subscribe to his email address.
   * If the function is success it will return true value, otherwise
   * it will return false. It also return false if fails in doing
   * Promise.
   * 
   * @param     device_id     The ID of target dispenser
   * @param     email         The user or subscriber email address
   * @param     status        Option of user: 1 is agree, 0 is disagree
   * 
   * @returns   boolean       Return true if success do action, false if
   *                          failed or something wrong with Promise
   */
  async wantUpdateTrack (device_id: string, email: string, status: boolean) {
    
    let url = this.urlUpdateTrack;

    const postBody = {
      "Email": email,
      "Device_ID": device_id,
      "Status": status
    }

    return await this.http.post(url, postBody).toPromise()
      .then((result) => {
        if (result['code'] === 200){
          return true;
        } else {
          console.error("Error while sending request: " + result['msg']);
          return false;
        }
      }, () => {
        console.error("Promise rejected: unable to sending request to track!");
        return false;
      })
      .catch((e) => {
        console.error("Function error: on wantUpdateTrack => " + e);
        return false;
      });
  }

  /**
   * This function is to check whether the target dispenser is
   * being tracked, or subscribed, by the following email or not
   * yet. It require the device id and email address to get the
   * tracking status. It returns the json format.
   * 
   * @param     device_id   The device ID of target dispenser
   * @param     email       The email address of the subscriber
   * 
   * @returns   value       The json object of data
   * 
   * @example
   *
   * {
   *    "Email": "M10702207@mail.ntust.edu.tw",
   *    "Device_ID": "EE_07_01",
   *    "Status": 1
   * }
   */
  async checkTrackStatus (device_id: string, email: string) {
    
    let url = this.urlCheckTrackStatus + "?Device_ID=" + device_id + "&Email=" + email;
    
    let returnValue = {
      "Email": email,
      "Device_ID": device_id,
      "Status": false
    }

    await this.http.get(url).toPromise()
      .then((result) => {
        returnValue = result['Data'];
      }, () => {
        console.error("Promise rejected: unable to check track status!");
      })
      .catch((e) => {
        console.error("Function error: on checkTrackStatus => " + e);
      });

    return returnValue;
  }
  
  /**
   * This function is to get list of dispenser maintenance info 
   * from the current status from the API. For every dispenser with
   * the same status, e.g. 1 or 2, will returned as list. It
   * returns the json format.
   * 
   * @param     status      The current status of maintained dispenser
   * 
   * @returns   value       The json array of data
   * 
   * @example
   * 
   * [
   *  {
   *    "Device_ID": "MA_05_01",
   *    "Email": "ntust.smartcampus@gmail.com",
   *    "ErrorType": 5,
   *    "Description": "Broken",
   *    "Status": 4,
   *    "UploadTime": "2019-01-02 09:36:00",
   *    "NotifyTime": "2019-01-02 09:36:00",
   *    "Maintainer": "Mr.Pang",
   *    "Result": "Someone push powersaving button",
   *    "CompleteTime": "2019-01-02 24:00:00",
   *    "Index": 0,
   *    "Source": null,
   *    "Source2": null,
   *    "Source3": null
   *  },
   *  {
   *    "Device_ID": "T4_04_01",
   *    "Email": "ntust.smartcampus@gmail.com",
   *    "ErrorType": 3,
   *    "Description": "Leaking water",
   *    "Status": 4,
   *    "UploadTime": "2019-01-02 20:16:00",
   *    "NotifyTime": "2019-01-02 20:16:00",
   *    "Maintainer": "Mr.Pang",
   *    "Result": "Fan and Compressor are broken",
   *    "CompleteTime": "2019-01-02 24:00:00",
   *    "Index": 0,
   *    "Source": null,
   *    "Source2": null,
   *    "Source3": null
   *  },
   *  ...
   * ]
   */
  async getRepairThingworx (status: number) {
    
    let url = this.urlRepairConditionThingworx + status;
    
    return await this.http.get(url).toPromise()
      .then((result) => {
        return result['Data'];
      }, () => {
        console.error("Promise rejected: unable to get list of dispenser under repairment!");
        return [{}];
      })
      .catch((e) => {
        console.error("Function error: on getRepairThingworx => " + e);
        return [{}];
      });
  }
}
