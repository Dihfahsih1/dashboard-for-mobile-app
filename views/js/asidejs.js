$(".dropdown").on( "click", function() {
    var current_dropdown = $(this).next(".v-dropdown");
    $(".v-dropdown").not(current_dropdown).slideUp();
    current_dropdown.slideToggle();
    return false;
});