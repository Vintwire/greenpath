$(function(){
    // nav 선택 및 스크롤 이동 시 버튼 변화
    const $sections = $(".move-sec-wrap");
    const $navLinks = $(".move-control a");

    function getVisibleSection() {
        let maxVisibleRatio = 0;
        let mostVisibleId = null;

        $sections.each(function () {
        const $el = $(this);
        const rect = this.getBoundingClientRect();
        const height = rect.height;

        const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
        const ratio = visibleHeight / height;

        if (ratio >= 0.6 && ratio > maxVisibleRatio) {
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
});