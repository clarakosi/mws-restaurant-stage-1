if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('serviceworker.js')
      .then(function(reg) {
        console.log('Registration succeeded. Scope is ' + reg.scope);
      })
      .catch(function(error) {
        conosle.log('Registration failed with ' + error);
      })
  });
}
