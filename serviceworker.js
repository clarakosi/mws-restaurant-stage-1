self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('restaurant-cache').then(function(cache) {
      return cache.addAll(
        [
          '/css/styles.css',
          '/js/dbhelper.js',
          '/js/main.js',
          '/js/restaurant_info.js',
          '/js/idb.js',
          '/js/reviewSync.js',
          '/index.html',
          '/restaurant.html',
          '/',
          '/sw-registration.js',
          '/img/1.jpg',
          '/img/2.jpg',
          '/img/3.jpg',
          '/img/4.jpg',
          '/img/5.jpg',
          '/img/6.jpg',
          '/img/7.jpg',
          '/img/8.jpg',
          '/img/9.jpg',
          '/img/10.jpg',
          '/icons/manifest.json'  
        ]
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

self.importScripts('js/idb.js');
self.importScripts('js/dbhelper.js');
self.importScripts('js/reviewSync.js');
self.addEventListener('sync', function (event) {
    event.waitUntil(
        
        reviewSync.addReview('readonly').then(function (db) {
            return db.getAll();
        }).then(function (reviews) {
            Promise.all(reviews.map(function (review) {
                return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
                    method: 'POST',
                    body: JSON.stringify(review)
                }).then(function (results) {
                    return results.json();
                }).then(function (serverInfo) {
                    if (serverInfo.id) {
                        return reviewSync.addReview('readwrite').then(function (db) {
                            return db.delete(review.id)
                        })
                    }
                })
            }))
        }).catch(function (error) {
            console.error(error);
        }) 
    )
});
