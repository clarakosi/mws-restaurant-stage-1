class DBPromise {
    static addRestaurants(restaurants, favoriting = false) {
        const request = indexedDB.open('mws-restaurants', 2);
        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            const objectStore = db.createObjectStore("restaurants", {keyPath: 'id'});

            objectStore.transaction.oncomplete = function (event) {
                const restaurantObjectStore = db.transaction("restaurants", "readwrite").objectStore("restaurants");
                restaurants.forEach(restaurant => {
                    restaurantObjectStore.add(restaurant);
                })
            }
        };
        
        if(favoriting) {
            request.onsuccess = function (event) {
                const db = event.target.result;
                const objectStore = db.transaction("restaurants", "readwrite").objectStore("restaurants");
                return objectStore.put(restaurants);
            }
        }
    }

    static addReviews(reviews) {
        const request = indexedDB.open('mws-reviews', 2);
         request.onupgradeneeded = function (event) {
             const db = event.target.result;
             const objectStore = db.createObjectStore("reviews", {keyPath: 'id'});
             objectStore.createIndex("restaurant_id", "restaurant_id");
             objectStore.autoIncrement;

             objectStore.transaction.oncomplete = function (event) {
                 const reviewsObjectStore = db.transaction("reviews", "readwrite").objectStore("reviews");
                 reviews.forEach(review => {
                     reviewsObjectStore.add(review);
                 })
             }
         };
        request.onsuccess = function(event) {
            const db = event.target.result;
            const objectStore = db.transaction("reviews", "readwrite").objectStore("reviews");
            
            return reviews.map(review => {
                objectStore.get(review.id).onsuccess = event => {
                   const dbReview = event.target.result;
                   if(!dbReview || new Date(review.updateAt) > new Date(dbReview.updateAt)) {
                       return objectStore.put(review);
                   }
                }
            })
        }
    }

    static getReviews(id) {
        return new Promise(resolve => {

            const request = indexedDB.open('mws-reviews', 2);
            return request.onsuccess = function (event) {
                const db = event.target.result;
                const objectStore = db.transaction("reviews").objectStore("reviews").index("restaurant_id");

                objectStore.getAll(id).onsuccess = event => {
                    return resolve(event.target.result);
                };
            }
        })
    }

   static getRestaurant(id) {
        return new Promise(resolve => {
            const request = indexedDB.open('mws-restaurants', 2);
            return request.onsuccess = function (event) {
                const db = event.target.result;
                const objectStore = db.transaction("restaurants").objectStore("restaurants");

                if (id) {
                    objectStore.get(id).onsuccess = event => {
                        return resolve(event.target.result);
                    };
                } else {
                    objectStore.getAll().onsuccess = event => {
                        return resolve(event.target.result);
                    }
                }
            }
        })
    }
}


/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}`;
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', `${DBHelper.DATABASE_URL}/restaurants`);
        
        xhr.onload = () => {
            if (xhr.status === 200) { // Got a success response from server!
                const restaurants = JSON.parse(xhr.responseText);
                if (restaurants.length > 0) DBPromise.addRestaurants(restaurants);
                callback(null, restaurants);
            } else { // Oops!. Got an error from server.
                const restaurants = DBPromise.getRestaurant(false);
                if (restaurants.length > 0) {
                    callback(null, restaurants);
                } else {
                    const error = (`Request failed. Returned status of ${xhr.status}`);
                    callback(error, null);
                }
            }
        };
        xhr.onerror = () => {
            DBPromise.getRestaurant(false).then(restaurants => {
                if (restaurants.length > 0) {
                    callback(null, restaurants);
                } else {
                    const error = (`Request failed. No restaurants in IDB. Returned status of ${xhr.status}`);
                    callback(error, null);
                }
            });
        };
        xhr.send();
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) { // Got the restaurant
                    callback(null, restaurant);
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }
    
    static fetchRestaurantReviewsByID(id, callback) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`);
        
        xhr.onload = () => {
            if (xhr.status === 200) { // Got a success response from server!
                const reviews = JSON.parse(xhr.responseText);
                if (reviews.length > 0) DBPromise.addReviews(reviews);
                callback(null, reviews);
            } else { // Oops!. Got an error from server.
                DBPromise.getReviews(id).then(restaurantReviews => {
                    callback(null, restaurantReviews)
                }).catch(() => {
                    const error = (`Request failed. Returned status of ${xhr.status}`);
                    callback(error, null);
                })
            }
        };
        xhr.onerror = () => {
            DBPromise.getReviews(id).then(restaurantReviews => {
                callback(null, restaurantReviews)
            }).catch(() => {
                const error = (`Request failed. No reviews in IDB. Returned status of ${xhr.status}`);
                callback(error, null);
            })
        };
        xhr.send();
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
                callback(null, uniqueCuisines);
            }
        });
    }
    
    static updateRestaurant() {
        let xhr = new XMLHttpRequest();
        let favorite = this.getAttribute("aria-pressed") == "true";
        favorite = !favorite;
        xhr.open('PUT', `${DBHelper.DATABASE_URL}/restaurants/${this.dataset.id}/?is_favorite=${favorite}`);

        xhr.onload = () => {
            if (xhr.status === 200) { // Got a success response from server!
                const restaurant = JSON.parse(xhr.responseText);
                DBPromise.addRestaurants(restaurant, true);
                this.setAttribute('aria-pressed', favorite);
            } else { // Oops!. Got an error from server.
                    const error = (`Request failed. Returned status of ${xhr.status}`);
                    callback(error, null);
            }
        };
        xhr.onerror = () => {
                const error = (`Request failed. Returned status of ${xhr.status}`);
                callback(error, null);
        };
        xhr.send();
        
    }
    
    static addReview(info) {
        fetch(`${DBHelper.DATABASE_URL}/reviews`, {
            method: "Post",
            body: JSON.stringify(info)
        })
            .then(results => {
                if(!results) console.error("There was an issue adding the information to the server.")
                return results.json();
            }).then(newReview => {
                DBPromise.addReviews([newReview]);
                const reviews =document.getElementById('reviews-list');
                reviews.appendChild(createReviewHTML(info));
            })
            .catch(error => {
                console.log(error);
            })
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        return (`/img/${restaurant.id}.jpg`);
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        // https://leafletjs.com/reference-1.3.0.html#marker  
        const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
            {
                title: restaurant.name,
                alt: restaurant.name,
                url: DBHelper.urlForRestaurant(restaurant)
            });
        marker.addTo(newMap);
        return marker;
    }

    /* static mapMarkerForRestaurant(restaurant, map) {
      const marker = new google.maps.Marker({
        position: restaurant.latlng,
        title: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
        map: map,
        animation: google.maps.Animation.DROP}
      );
      return marker;
    } */

}
