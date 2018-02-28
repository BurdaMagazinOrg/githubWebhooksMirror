$('form').on('change', function() {
  var $this = $(this)
  var value = $this.find('select').val()
})

$(function() {
  $('select[name="repo"]').select2()
})

