import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class PreferenceManagerService {

  constructor(
    private storage: Storage
  ) { }

  async getData (key: string) {

    return await this.storage.get(key).then((result) => {
      return result;
    }, () => {
      return null;
    });
  }

  async saveData (key: string, data) {

    return await this.storage.set(key, data).then(() => {
      return true;
    }, () => {
      return false;
    });
  }

  async checkData (key: string, compareData) {

    return await this.storage.get(key).then((result) => {
      if (result === compareData)
        return true;
      else
        return false;
    }, () => {
      return false;
    });
  }

  async removeData (key: string) {

    return await this.storage.remove(key).then(() => {
      return true;
    }, () => {
      return false;
    });
  }
}
