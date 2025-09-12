$(function () {
    // ========================
    // 캐시/상수
    // ========================
    const BP = 1280;
    const $win = $(window);
    const $doc = $(document);
    const $html = $('html');
    const $header = $('header');

    const $topBtn = $('.top-btn');

    const $navWrap = $('.nav-wrap');
    const $navBtnWrap = $('.nav-btn-wrap');
    const $navBtn = $('.nav-btn');
    const $menu = $('.nav-wrap nav');
    const $navLinks = $('.move-control a');

    const $moveArea = $('.move-area');
    const $sections = $('.move-sec');

    // 상태
    let isMobileMode = window.innerWidth <= BP;
    let lastY = $win.scrollTop();
    let areaTop = 0;
    let areaBottom = 0;
    let ticking = false;        // scroll rAF throttle
    let resizeTick = false;     // resize rAF debounce

    // ========================
    // 유틸
    // ========================
    const isMobile = () => window.innerWidth <= BP;

    function recalcAreaBounds() {
        if (!$moveArea.length) {
            areaTop = Infinity;
            areaBottom = -Infinity;
            return;
        }
        const off = $moveArea.offset();
        areaTop = Math.floor(off.top);
        areaBottom = areaTop + $moveArea.outerHeight(true);
    }

    function inMoveArea(y) {
        return y >= areaTop && y < areaBottom;
    }

    // ========================
    // TOP 버튼
    // ========================
    $topBtn.hide();
    $win.on('scroll.topbtn', function () {
        if ($win.scrollTop() > 100) $topBtn.fadeIn(300);
        else $topBtn.fadeOut(300);
    });
    $topBtn.on('click', function () {
        $('html, body').stop().animate({ scrollTop: 0 }, 500);
    });

    // ========================
    // nav 버튼 라벨 동기화
    // ========================
    function syncNavBtnLabel() {
        const $active = $menu.find('a.on');
        const label = $active.length ? $.trim($active.text()) : $.trim($menu.find('a').first().text());
        $navBtn.find('span').text(label);
    }

    // ========================
    // 가시 섹션 계산 -> nav on 토글 + 버튼 라벨
    // ========================
    function getVisibleSection() {
        let maxVisibleRatio = 0;
        let mostVisibleId = null;

        const winH = window.innerHeight;
        const scrollY = window.scrollY || window.pageYOffset;
        const docH = $(document).height();
        const nearBottom = scrollY + winH >= docH - 2; // 바닥 보정

        if (nearBottom && $sections.length) {
            mostVisibleId = $sections.last().attr('id');
        } else {
            $sections.each(function () {
                const rect = this.getBoundingClientRect();
                const visibleHeight = Math.max(0, Math.min(winH, rect.bottom) - Math.max(0, rect.top));
                const ratio = visibleHeight / winH;
                if (ratio >= 0.2 && ratio > maxVisibleRatio) {
                    maxVisibleRatio = ratio;
                    mostVisibleId = this.id;
                }
            });
        }

        if (mostVisibleId) {
            $navLinks.each(function () {
                const targetId = $(this).attr('href').replace('#', '');
                $(this).toggleClass('on', targetId === mostVisibleId);
            });
            if (isMobile()) syncNavBtnLabel();
        }
    }

    // ========================
    // 메뉴 열기/닫기
    // ========================
    function openMenu() {
        syncNavBtnLabel();
        $html.addClass('is-scroll-lock');
        $navWrap.addClass('on');
        $navBtnWrap.addClass('on');
        if (isMobile()) $navWrap.addClass('reveal');
        $menu.stop(true, true).slideDown(200);
        $navBtn.addClass('on').attr('aria-expanded', 'true');
    }
    function closeMenu() {
        $html.removeClass('is-scroll-lock');
        $navWrap.removeClass('on');
        $navBtnWrap.removeClass('on');
        $menu.stop(true, true).slideUp(200);
        $navBtn.removeClass('on').attr('aria-expanded', 'false');
        if (isMobile()) {
            const y = $win.scrollTop();
            // 영역 안(= y >= areaTop)이면 reveal 유지, 아니면 제거
            if (y < areaTop) $navWrap.removeClass('reveal');
        }
    }

    // 드롭다운 토글 (모바일 전용)
    $navBtn.on('click', function (e) {
        if (!isMobile()) return;
        e.preventDefault();
        e.stopPropagation();          // 외부 클릭 핸들러로 전파 방지
        lastY = $win.scrollTop();     // ✅ 방향 판단 기준 고정
        $navBtn.hasClass('on') ? closeMenu() : openMenu();
    });

    // 메뉴 링크 클릭 -> 라벨 고정 + 닫기 (모바일 전용)
    $menu.on('click', 'a', function () {
        if (!isMobile()) return;
        $navBtn.find('span').text($.trim($(this).text()));
        closeMenu();
    });

    // 바깥 클릭 시 닫기 (모바일 전용)
    $doc.on('click', function (e) {
        if (!isMobile()) return;
        if (!$(e.target).closest($navWrap).length && $navBtn.hasClass('on')) closeMenu();
    });

    // ESC 닫기 (모바일 전용)
    $doc.on('keydown', function (e) {
        if (!isMobile()) return;
        if (e.key === 'Escape' && $navBtn.hasClass('on')) {
            closeMenu();
            $navBtn.focus();
        }
    });

    // ========================
    // .move-area 안/밖 + 스크롤 방향 -> header & nav-wrap 노출 제어
    // ========================
    function handleScroll() {
        const y = $win.scrollTop();
        const dir = y > lastY ? 'down' : (y < lastY ? 'up' : 'none');
        const inside = inMoveArea(y);

        // 헤더 show/hide (기존 유지)
        if (inside) {
            if (dir === 'down') $header.addClass('is-hide');
            else if (dir === 'up') $header.removeClass('is-hide');
        } else {
            $header.removeClass('is-hide');
        }

        // .move-area 시작되면 nav-wrap에 .is-fixed 추가 / 해제
        if (y >= areaTop) {
            $navWrap.addClass('is-fixed');
        } else {
            $navWrap.removeClass('is-fixed');
        }

        // reveal: 메뉴 열림/애니메이션 중이면 항상 유지
        if (isMobile()) {
            const menuActive = $navBtn.hasClass('on') || $menu.is(':visible') || $menu.is(':animated');

            if (menuActive) {
                $navWrap.addClass('reveal');   // ← 여기서 강제 유지
            } else {
                if (y >= areaTop) $navWrap.addClass('reveal');
                else $navWrap.removeClass('reveal');
            }
        } else {
            $navWrap.removeClass('reveal');
        }

    // nav-btn-wrap 방향 토글 (보호 포함)
    if (isMobile()) {
        const menuActive = $navBtn.hasClass('on') || $menu.is(':visible') || $menu.is(':animated');
        if (menuActive) {
            $navBtnWrap.removeClass('is-hide');
        } else {
            if (y < lastY) $navBtnWrap.addClass('is-hide');
            else if (y > lastY) $navBtnWrap.removeClass('is-hide');
        }
    } else {
        $navBtnWrap.removeClass('is-hide');
    }

    lastY = y;
    }

    // scroll: rAF 스로틀
    $win.on('scroll.main', function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(function () {
                getVisibleSection();
                handleScroll();
                ticking = false;
            });
        }
    });

    // ========================
    // 앵커 스무스 스크롤 (CSS scroll-behavior와 중복 주의)
    // ========================
    $menu.on('click', 'a', function (e) {
        const href = $(this).attr('href');
        if (!href || href.charAt(0) !== '#') return;

        const $target = $(href);
        if (!$target.length) return;

        e.preventDefault();

        const headerH = $header.outerHeight() || 0;
        const targetTop = $target.offset().top - headerH;

        $('html, body').stop().animate({ scrollTop: targetTop }, 400, function () {
            // 완료 후 활성화/상태 보정
            getVisibleSection();
            handleScroll();
        });
    });

    // ========================
    // 리사이즈 (모드 전환 안전 처리)
    // ========================
    $win.on('resize.main', function () {
        if (!resizeTick) {
            resizeTick = true;
            requestAnimationFrame(function () {
                const prevMode = isMobileMode;
                isMobileMode = isMobile();

                recalcAreaBounds();

                if (prevMode !== isMobileMode) {
                    // 모드 바뀜 -> 상태 리셋
                    $html.removeClass('is-scroll-lock');
                    $navBtn.removeClass('on').attr('aria-expanded', 'false');
                    $navBtnWrap.removeClass('on is-hide');

                    if (isMobileMode) {
                        $menu.stop(true, true).hide();
                        $navWrap.removeClass('reveal on');
                        // 스크롤 위치로 다시 판단
                        handleScroll();
                    } else {
                        $menu.stop(true, true).show();
                        $navWrap.removeClass('reveal on'); // 데스크톱에서는 의미 없음
                        $header.removeClass('is-hide');
                    }
                    syncNavBtnLabel();
                } else {
                    // 같은 모드면 경계/상태만 보정
                    handleScroll();
                    syncNavBtnLabel();
                }

                resizeTick = false;
            });
        }
    });

    // ========================
    // 초기 세팅
    // ========================
    recalcAreaBounds();
    syncNavBtnLabel();
    getVisibleSection();
    handleScroll();

    // 회사소개 슬라이드
    const companySlide = new Swiper(".company-slide", {
        slidesPerView: 1,
        spaceBetween: 30,
        observer: true,
        observeParents: true,
        pagination: {
            el: ".swiper-pagination",
        },
        // breakpoints: {
        //     480: {
        //         slidesPerView: 2.2,  //브라우저가 480보다 클 때
        //     },
        //     768: {
        //         slidesPerView: 3.2,  //브라우저가 768보다 클 때
        //     },
        // },
    });
});
