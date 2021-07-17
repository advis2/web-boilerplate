$(document).ready(function () {
  $(document).on('click', '.control nav a', function (event) {
    var href = event.target.href;
    history.pushState(null, null, href);
    $('article').load(href+' .content');
    event.preventDefault();
  });
  $(window).on('popstate', function(event){
    $('article').load(location.href+' .content');
  });
  var audio = new Audio('Tyburn - Eden.mp3');
  $(document).on('click', '.control .play', function(event){
    audio.play();
  });
  $(document).on('click', '.control .pause', function(event){
    audio.pause();
  });
});