var audio = new Audio('Sky. - Freedom.mp3');
audio.addEventListener
document.querySelector('#play').addEventListener('click', function (e) {
  audio.play();
});
document.querySelector('#stop').addEventListener('click', function (e) {
  audio.pause();
});
audio.addEventListener('playing', function (e) {
  console.log(e);
});
audio.addEventListener('progress', function (e) {
  document.querySelector('progress').value = audio.currentTime / audio.duration;
});
$(document).on('click', 'nav a', function (e) {
  $('article').load(event.target.href+' .content');
  history.pushState({href:e.target.href}, null, e.target.href);
  e.preventDefault();
});

window.addEventListener('popstate', function(event) {
  $('article').load(event.state.href+' article');
});