/* Chivacare English site - main.js
 * Initializes Swiper carousels and Owl carousels to match the original site.
 */
$(document).ready(function () {

  // Mobile menu toggle (replicates original menue.js behavior)
  $('.mobile-toggle').on('click', function () {
    $('.primary-nav').toggleClass('open');
    $('body').toggleClass('menu-open');
  });

  $('a.a-toggle').on('click', function () {
    $(this).next('span.item-toggle-button').trigger('click');
  });

  $('.item-toggle-button').on('click', function () {
    $(this).toggleClass('is-open');
    $(this).next('.secondary-nav').toggleClass('is-open');
    $(this).closest('li').toggleClass('is-open');
  });

  // Tabs - re-init swiper after tab show
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    new Swiper('.main-services .swiper-container', servicesSwiperConfig);
  });

  var servicesSwiperConfig = {
    slidesPerView: 1.3,
    spaceBetween: 10,
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 20 },
      768: { slidesPerView: 2, spaceBetween: 20 },
      1024: { slidesPerView: 3, spaceBetween: 20 }
    }
  };

  // Services swiper
  new Swiper('.main-services .swiper-container', servicesSwiperConfig);

  // Promotions swiper
  new Swiper('.main-promotion .swiper-container', {
    slidesPerView: 1,
    spaceBetween: 10,
    autoplay: { delay: 2500, disableOnInteraction: false },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 20 },
      768: { slidesPerView: 2, spaceBetween: 20 },
      1024: { slidesPerView: 3, spaceBetween: 20 }
    }
  });

  // Blog swiper
  new Swiper('.main-blog .swiper-container', {
    slidesPerView: 1.3,
    spaceBetween: 10,
    watchSlidesVisibility: true,
    grabCursor: true,
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 20 },
      768: { slidesPerView: 2, spaceBetween: 20 },
      1024: { slidesPerView: 4, spaceBetween: 20 }
    }
  });

  // Videos swiper
  new Swiper('.main-videoclip .swiper-container', {
    slidesPerView: 1,
    spaceBetween: 10,
    watchSlidesVisibility: true,
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 20 },
      768: { slidesPerView: 2, spaceBetween: 20 },
      1024: { slidesPerView: 3, spaceBetween: 20 }
    }
  });

  // Reviews swiper
  new Swiper('.main-reviews .swiper-container', {
    slidesPerView: 1,
    spaceBetween: 20,
    watchSlidesVisibility: true,
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 20 },
      768: { slidesPerView: 2, spaceBetween: 20 },
      1024: { slidesPerView: 3, spaceBetween: 20 }
    }
  });

  // Certificates carousel
  if ($.fn.owlCarousel) {
    $('.owl-cert').owlCarousel({
      loop: true,
      autoplay: false,
      smartSpeed: 700,
      margin: 10,
      nav: true,
      navText: [
        '<font size="+3" color="#30c1b8"><i class="ion-chevron-left"></i></font>',
        '<font size="+3" color="#30c1b8"><i class="ion-chevron-right"></i></font>'
      ],
      dots: true,
      autoplayHoverPause: false,
      responsive: {
        0:    { items: 1 },
        480:  { items: 1 },
        768:  { items: 1 },
        1000: { items: 4 }
      }
    });
  }

  // Cookie banner
  var cookieAlert = document.querySelector('.cookiealert');
  if (cookieAlert) {
    if (!document.cookie.split('; ').find(function (r) { return r.startsWith('acceptCookies='); })) {
      cookieAlert.classList.add('show');
    }
    var btn = document.querySelector('.acceptcookies');
    if (btn) {
      btn.addEventListener('click', function () {
        document.cookie = 'acceptCookies=true; max-age=' + (60 * 60 * 24 * 365);
        cookieAlert.classList.remove('show');
      });
    }
  }
});
