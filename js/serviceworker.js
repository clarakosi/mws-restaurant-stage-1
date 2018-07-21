if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/js/serviceworker.js')
      .then(function(reg) {
        console.log('Registration succeeded. Scope is ' + reg.scope);
      })
      .catch(function(error) {
        conosle.log('Registration failed with ' + error);
      })
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('restaurant-cache').then(function(cache) {
      return cache.addAll(
        [
          '/css/styles.css',
          '/data/restaurants.json',
          '/js/dbhelper.js',
          '/js/main.js',
          '/js/restaurant_info.js',
          '/index.html',
          '/restaurant.html',
          '/',
          '/img/1.jpg',
          '/img/2.jpg',
          '/img/3.jpg',
          '/img/4.jpg',
          '/img/5.jpg',
          '/img/7.jpg',
          '/img/8.jpg',
          '/img/9.jpg',
          '/img/10.jpg',          
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