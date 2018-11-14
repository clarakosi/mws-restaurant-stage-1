const reviewSync = {
   db: null,
   
   init: function () {
       if (reviewSync.db) Promise.resolve(this.db);
       return idb.open('reviews-sync', 1, function (upgradeDB) {
           upgradeDB.createObjectStore('reviews', {
               autoIncrement: true, keyPath: 'id'
           })
       }).then(db => {
           return this.db = db;
       });
   },
    
    addReview: function (type) {
        return this.init().then(function (db) {
            return db.transaction('reviews', type).objectStore('reviews');
        })
    }
};

