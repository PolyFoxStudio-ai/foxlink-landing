/* Shared mobile nav toggle for FoxLink site chrome. */
(function(){
  var tog = document.getElementById('navToggle'), menu = document.getElementById('navmenu');
  if(!tog || !menu) return;
  tog.addEventListener('click', function(){
    var open = menu.classList.toggle('open');
    tog.setAttribute('aria-expanded', open ? 'true' : 'false');
    tog.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  menu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ menu.classList.remove('open'); tog.setAttribute('aria-expanded','false'); tog.setAttribute('aria-label','Open menu'); });
  });
})();
