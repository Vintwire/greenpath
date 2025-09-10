$(function(){
    // nav 선택 및 스크롤 이동 시 버튼 변화
    const $sections = $(".move-sec");
    const $navLinks = $(".move-control a");

    function getVisibleSection() {
        let maxVisibleRatio = 0;
        let mostVisibleId = null;

        $sections.each(function () {
        const $el = $(this);
        const rect = this.getBoundingClientRect();
        const height = rect.height;

        const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
        const ratio = visibleHeight / window.innerHeight;

        if (ratio >= 0.4 && ratio > maxVisibleRatio) {
            maxVisibleRatio = ratio;
            mostVisibleId = $el.attr("id");
        }
        });

        if (mostVisibleId) {
        $navLinks.each(function () {
            const $link = $(this);
            const targetId = $link.attr("href").replace("#", "");
            $link.toggleClass("on", targetId === mostVisibleId);
        });
        }
    }

    $(window).on("scroll", function () {
        getVisibleSection();
    });

    // 초기 실행 (페이지 새로고침 시 적용되게)
    getVisibleSection();

    // 메인화면 두 번째 섹션 슬라이드
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