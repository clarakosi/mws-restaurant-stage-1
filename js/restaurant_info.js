let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.newMap = L.map('map', {
                center: [restaurant.latlng.lat, restaurant.latlng.lng],
                zoom: 16,
                scrollWheelZoom: false
            });
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
                mapboxToken: 'pk.eyJ1IjoiY2FuZHJld3dhbmkiLCJhIjoiY2pqb2tqY2JpNzdrejN3cjV3Nnc5N3FmMSJ9.h0-sO5IUmRFRmcRa0mkLnA',
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                id: 'mapbox.streets'
            }).addTo(newMap);
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
        }
    });
};

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant)
        });
    }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const favorite = document.getElementById('favorite-restaurant');
    favorite.className = "fav-button";
    favorite.dataset.id = restaurant.id;
    favorite.setAttribute('aria-label', `Mark ${restaurant.name} as one of your favorite restaurants.`);
    favorite.setAttribute('aria-pressed', restaurant.is_favorite);
    favorite.onclick = DBHelper.updateRestaurant;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    
    // fill reviews
    DBHelper.fetchRestaurantReviewsByID(restaurant.id, (error, reviews) => {
        if(!reviews) {
            console.error(error);
            return;
        } else {
            self.restaurant.reviews = reviews;
            return fillReviewsHTML()
        }
    })
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    container.appendChild(title);
    title.tabIndex = 0;

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
    
    const form = document.getElementById('form-container');
    const id = getParameterByName("id");
    form.dataset.id = id;
    form.onsubmit = addNewReview;
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);
    li.tabIndex = 0;
    name.tabIndex = 0;

    const date = document.createElement('p');
    date.innerHTML = new Date(review.createdAt).toLocaleDateString();
    li.appendChild(date);
    date.tabIndex = 0;

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);
    rating.tabIndex = 0;

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);
    comments.tabIndex = 0;

    return li;
};

getFormInfo = () => {
    const info = {};
    info.restaurant_id = self.restaurant.id;
    
    let name = document.getElementById('name');
    if(name.value.length === 0) {
        name.focus();
        return;
    }
    info.name = name.value;
    
    let rating = document.getElementById('rating');
    if(rating.value == "-1") {
        rating.focus();
        return;
    }
    info.rating = rating.value;

    let comments = document.getElementById('comments');
    if(comments.value.length === "0") {
        comments.focus();
        return;
    }
    info.comments = comments.value;
    return info;
};

clearForm = () => {
    let name = document.getElementById('name');
    name.value = "";

    let rating = document.getElementById('rating');
    rating.value = "-1";
    
    let comments = document.getElementById('comments');
    comments.value.length = 0;
}
addNewReview = (event) => {
    event.preventDefault();
    const info = getFormInfo();
    DBHelper.addReview(info)
    clearForm();
};
/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
