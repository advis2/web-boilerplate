$(document).ready(function () {
  function load(href) {
    $('article').load(href + ' .article');
  }
  $('nav a').click(function (e) {
    var href = e.target.href;
    $('nav a').removeClass('selected');
    $(this).addClass('selected');
    load(href);
    history.pushState({
      'href': href
    }, null, href);
    e.preventDefault();
  });
  $(window).on('popstate', function (e) {
    load(e.originalEvent.state.href);
  })
});