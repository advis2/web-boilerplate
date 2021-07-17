$(document).ready(function () {
  $(document).on('click', '.control nav a', function (e) {
    history.pushState(null, null, e.target.href);
    $('article').load(e.target.href + ' .content');
    e.preventDefault();
    if(player.getPlayerState() == YT.PlayState.PLAYING){
      
    }
  })
  var audio = new Audio('Tyburn - Eden.mp3');
  $(document).on('click', '.control .play', function (e) {
    audio.play();
  })
  $(document).on('click', '.control .pause', function (e) {
    audio.pause();
  });
  $(document).on('click', 'mousedown', function (e) {
    console.log(e);
  })
})