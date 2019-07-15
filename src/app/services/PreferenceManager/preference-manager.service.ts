/**
 * AUTHOR'S NOTES:
 * 
 * This service is to store and retrieve data from preference in
 * client side. It stick with the memory in the client browser 
 * rather than database from the server. This preference only
 * takes small amount of memory, up to 5 Megabytes, to store certain
 * of data.
 * 
 * The data itself are stored using the key pair. Key is the value
 * that identify which location that the data are stored. For example
 * a single string is stored under key named "myString". In memory we
 * can call the value by refering "myString" as the key pair.
 * 
 * For personal computer (PC) version browser, it doesn't has to 
 * create a empty value with key pair to check if the data is present
 * or not. This dependency only occur on mobile device version browser
 * where if there is no key stored then any kind of GET data from it
 * will return nothing and this can break logic of your code.
 */

import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class PreferenceManagerService {

  constructor(
    private storage: Storage
  ) { }

  /**
   * This function is to get the data from the preference. It will
   * return the data from the key pair given if present and will 
   * return null if not present.
   * 
   * @param     key         Key to check if data is present
   * 
   * @returns   value       Return the value if present, null if not
   */
  async getData (key: string) {

    return await this.storage.get(key).then((result) => {
      return result;
    }, () => {
      console.error("Promise rejected: unable to get value from: " + key + "!");
      return null;
    })
    .catch((e) => {
      console.error("Function error: on getData => " + e);
      return null;
    });
  }

  /**
   * This function is to save or store the data to preference with
   * the key pair. It check promise and return boolean value as true
   * if success and false if failed.
   * 
   * @param     key         Key to save the data to preference
   * @param     data        Data will be stored in preference
   * 
   * @returns   boolean     Return true if success, false if failed
   */
  async saveData (key: string, data) {

    return await this.storage.set(key, data).then(() => {
      return true;
    }, () => {
      console.error("Promise rejected: unable to save value to: " + key + "!");
      return false;
    })
    .catch((e) => {
      console.error("Function error: on saveData => " + e);
      return false;
    });
  }

  /**
   * This function is to check data from the one stored in the
   * preference with one being passed from function. It will return
   * boolean value as true if is it same data and false if not and
   * also if the data is not present inside preference.
   * 
   * @param     key           Key to check if data is present
   * @param     compareData   Another data to be compared with the stored one
   * 
   * @returns   boolean       Return true if same data, false if not or failed
   */
  async checkData (key: string, compareData) {

    return await this.storage.get(key).then((result) => {
      if (result === compareData)
        return true;
      else
        return false;
    }, () => {
      console.error("Promise rejected: unable to check value under key: " + key + "!");
      return false;
    })
    .catch((e) => {
      console.error("Function error: on checkData => " + e);
      return false;
    });
  }

  /**
   * This function is to remove data from preference under the key
   * pair. BEWARE that this function also remove the key pair from
   * preference with the data. It will return boolean value as true
   * if success removing key and value and false if failed.
   * 
   * @param     key           Key to be deleted with the value stored
   * 
   * @returns   boolean       Return true if success, false if failed
   */
  async removeData (key: string) {

    return await this.storage.remove(key).then(() => {
      return true;
    }, () => {
      console.error("Promise rejected: unable to remove key and value under key: " + key + "!");
      return false;
    })
    .catch((e) => {
      console.error("Function error: on removeData => " + e);
      return false;
    });
  }

  /**
   * This function is to remove the value ONLY from the preference
   * under the key pair. It will change the value present in the
   * preference with "" or empty string value. It will return boolean
   * value as true if success and false if failed.
   * 
   * @param     key           Key pair that value will be deleted
   * 
   * @returns   boolean       Return true if success, false if failed
   */
  async deleteValueOnly (key: string) {

    let checkValue = await this.getData(key);

    if (checkValue !== null) {
      return await this.saveData(key, "").then((result) => {
        return result;
      }, () => {
        console.error("Promise rejected: unable to perform delete value only under key: " + key + "!");
        return false;
      })
      .catch((e) => {
        console.error("Function error: on deleteValueOnly => " + e);
        return false;
      });
    }
  }
}
