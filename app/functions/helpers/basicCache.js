//####################################################
//############### BASIC CACHE FUNCTION ###############
//####################################################

/////////////////////////
////// BASIC CACHE //////
/////////////////////////
class Cache {
  constructor() {
    this.cache = {};
  }

  async get(key) {
    const item = this.cache[key];
    if (item) {
      return item;
    }
    return false;
  }

  set(key, data) {

    this.cache[key] = {
      data: data,
      expiration: new Date().getTime() + 1000,
    };
  }

  delete(key) {
    delete this.cache[key]; // Removes the property associated with the key
  }

  clear() { 
    this.cache = {};
  }
}

export const cache = new Cache();