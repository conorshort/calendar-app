$(document).ready(function () {
    $('input').addClass('ml-2 mt-3');
    $('.helptext').hide();
    $('.errorlist').addClass('small')
        .each(function () {
            $(this).insertAfter($(this).next())
        });
    $('label[for=id_password2').text('Confirm Password:')
});

