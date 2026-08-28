/* Cookieless Google Ads attribution (GCLID hand-off).
 * If a visitor arrives from a Google Ad (?gclid=...), remember it in a
 * first-party functional cookie and append it to any outbound link to the app,
 * so the click id crosses foxlink.network -> app.foxlink.network and can be
 * recorded against a signup / founding application. No third-party or
 * advertising cookies, no external calls. See
 * marketing/advertising/gclid-tracking-plan.md in the foxlink repo. */
(function () {
  try {
    var params = new URLSearchParams(window.location.search)
    var gclid = params.get('gclid')

    if (gclid) {
      // First-party, 90-day (Google's offline-import window). Functional, not tracking.
      var expires = new Date(Date.now() + 90 * 864e5).toUTCString()
      document.cookie =
        'fl_gclid=' + encodeURIComponent(gclid) +
        '; expires=' + expires + '; path=/; SameSite=Lax; Secure'
    } else {
      var m = document.cookie.match(/(?:^|;\s*)fl_gclid=([^;]+)/)
      if (m) gclid = decodeURIComponent(m[1])
    }

    if (!gclid) return

    // Carry the gclid across the domain boundary on outbound app links.
    var links = document.querySelectorAll('a[href*="app.foxlink.network"]')
    for (var i = 0; i < links.length; i++) {
      try {
        var u = new URL(links[i].href)
        if (!u.searchParams.has('gclid')) {
          u.searchParams.set('gclid', gclid)
          links[i].href = u.toString()
        }
      } catch (e) { /* skip malformed href */ }
    }
  } catch (e) { /* never break the page over attribution */ }
})()
