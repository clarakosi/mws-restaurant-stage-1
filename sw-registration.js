if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('serviceworker.js')
      .then(function(reg) {
        if ('sync' in reg) {
          const form = document.getElementById("form-container");
          
          form.addEventListener('submit', function (event) {
              event.preventDefault();
              const form_info = getFormInfo();
              reviewSync.addReview('readwrite').then(function (db) {
                  return db.put(form_info);
              }).then(function () {
                  return reg.sync.register('reviews')
              }).catch(function (error) {
                  console.error(error);
                  form.submit()
              })

          })
        }
        // console.log('Registration succeeded. Scope is ' + reg.scope);
      })
      .catch(function(error) {
        console.log('Registration failed with ' + error);
      })
  });
}
