$(document).ready(function () {
  function load(href){
    $('article').load(href + ' .article');
  }
  $('nav a').click(function (e) {
    var href = e.target.href;
    load(href);
    history.pushState({
      'href': href
    }, null, href);
    e.preventDefault();
  });
  $(window).on('popstate', function (e) {
    load(e.originalEvent.state.href);
  })
  var audio = new Audio('Sky. - Freedom.mp3');
  $('.bgm .play').click(function(e){
    audio.play();
  });
  $('.bgm .stop').click(function(e){
    audio.stop();
  });
});