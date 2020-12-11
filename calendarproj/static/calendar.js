function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});




let DateTime = luxon.DateTime;


let DateManager = (function () {
    const NOW = DateTime.local();

    return {
        current: {
            now: NOW,
            day: NOW.day,
            month: NOW.month,
            year: NOW.year
        },
        monthOffset: 0,
        nextMonth: function () {
            this.monthOffset++;
            return this.displayedMonth();
        },
        prevMonth: function () {
            this.monthOffset--;
            return this.displayedMonth();
        },
        displayedMonth: function () {

            let monthDetails = {}
            let mddt = NOW.plus({ months: this.monthOffset });

            monthDetails.today = NOW;
            monthDetails.dt = mddt;
            monthDetails.month = mddt.month;
            monthDetails.year = mddt.year;
            monthDetails.monthName = mddt.monthLong;
            monthDetails.daysInMonth = mddt.daysInMonth;
            monthDetails.firstDayofMonth = mddt.startOf('month').weekday - 1;

            return monthDetails;
        },

    }
})();




let RequestManager = (function () {

    return {

        currentEventId: -1,

        getEventsForMonth: function (dt) {
            return $.getJSON('/events', { month: dt.month, year: dt.year });
        },
        getEventsOnDate: function (dt) {
            return $.getJSON('/events', { day: dt.day, month: dt.month, year: dt.year });
        },

        getEventsWithSearch: function(searchText){
            return $.getJSON('/events', { query: searchText});
        },

        addEvent: function (eventDetails) {
            return $.post("/events/", eventDetails);
        },
        editEvent: function (eventDetails, eventId) {
            return $.ajax({
                method: "PUT",
                url: `/events/${eventId}/`,
                data: eventDetails
            });
        },
        deleteEvent: function (eventId) {

            return $.ajax({
                method: "DELETE",
                url: `/events/${eventId}/`,
            });
        }



    }
})();

let UiManager = (function () {

    function restructureEvents(events) {
        let eventsObj = {};
        events = events || [];
        events.forEach(event => {
            day = parseInt(event.event_date.slice(-2));
            if (!eventsObj.hasOwnProperty(day)) {
                eventsObj[day] = []
            }
            eventsObj[day].push(event);
        });
        return eventsObj;

    }

    const eventDetails = ({ id, title, start_time, end_time, description, event_date }) => `
                <div data-event-id=${id} data-event-date=${event_date}>
                    <button class='edit-event'>Edit</button><button class='delete-event'>Delete</button>
                    <h4 class="details-title">${title}</h4>
                    <p class="details-from">From: ${start_time.slice(0, -3)}</p>
                    <p class="details-to">To: ${end_time.slice(0, -3)}</p>
                    <p class="details-desc">${description}</p>
                </div>
                `;
    const searchDetails = ({ id, title, start_time, end_time, description, event_date }) => `
                <div data-event-id=${id} data-event-date=${event_date}>
                    <button class='edit-event'>Edit</button><button class='delete-event'>Delete</button>
                    <h4 class="details-title">${title}</h4>
                    <h4 class="details-title">${event_date}</h4>
                    <p class="details-from">From: ${start_time.slice(0, -3)}</p>
                    <p class="details-to">To: ${end_time.slice(0, -3)}</p>
                    <p class="details-desc">${description}</p>
                </div>
                `;

    return {
        $selectedDate: $('p'),
        thisMonthsEvents: {},
        showDateDetails: function (dt) {
            const dateDetailsStr = `${dt.day} ${dt.monthLong} ${dt.year}`;

            $('#details-date').text(dateDetailsStr);

            todaysEvents = this.thisMonthsEvents[dt.day];
            if (todaysEvents) {
                $('#details-div').html(todaysEvents.map(eventDetails).join(''));
            } else {
                const noEvents = $('<div></div>').text('You have no events on this date.')
                $('#details-div').html(noEvents);
            }
        },
        showSearchDetails: function (events) {
            if (events) {
                $('#details-div').html(events.map(searchDetails).join(''));
            } else {
                const noEvents = $('<div></div>').text('No events match this search.')
                $('#details-div').html(noEvents);
            }
        },




        updateCalendarTable: function (monthDetails, events) {
            events = restructureEvents(events);
            this.thisMonthsEvents = events;
            console.log(events);
            $('#calendar-body').html('');
            $('#month-name').text(`${monthDetails.monthName} ${monthDetails.year}`);
            let displayDate = 1 - monthDetails.firstDayofMonth;

            while (displayDate <= monthDetails.daysInMonth) {
                let $tableRow = $('<tr></tr>')
                for (let j = 0; j < 7; j++, displayDate++) {

                    let cellContent;
                    let cellClass;

                    // add the date number
                    if (displayDate >= 1 && displayDate <= monthDetails.daysInMonth) {
                        cellContent = displayDate;
                        cellClass = "calendar-cell";
                    } else {
                        cellContent = "";
                        cellClass = "calendar-cell empty";
                    }

                    let $cell = $('<td></td>')
                        .text(cellContent)
                        .addClass(cellClass);

                    thisDate = DateTime.local(monthDetails.year, monthDetails.month, displayDate)

                    // Add 'today' class
                    if (monthDetails.today.hasSame(thisDate, 'day')) {
                        $cell.addClass('today')
                    }

                    // Add the 'has event' dot
                    if (events.hasOwnProperty(displayDate)) {
                        $dot = $('<span></span>').addClass("dot")
                        $cell.append($dot)
                    }
                    $tableRow.append($cell);
                }
                $('#calendar-body').append($tableRow);
            }
        },

        getValuesFromModal: function () {

            let eventDetails = {
                title: $('#create-title').val(),
                event_date: $('#create-datepicker').val().split('-').reverse().join('-'),
                start_time: $('#create-start-time').val(),
                end_time: $('#create-end-time').val(),
                description: $('#create-description').val()
            }
            return eventDetails
        },
        setValuesInModal: function (eventDetails) {
            $('#create-datepicker').val(eventDetails.event_date);
            $('#create-title').val(eventDetails.title);
            $('#create-start-time').val(eventDetails.start_time);
            $('#create-end-time').val(eventDetails.end_time);
            $('#create-description').val(eventDetails.description);
        },
        clearModal: function() {
            let elems = ['#create-datepicker',
            '#create-title',
            '#create-start-time',
            '#create-end-time',
            '#create-description'];
            elems.forEach(elem => {
                $(elem).val('');
            });
        }
    }
}

)();




let controller = (function (Reqs, Ui, Dates) {

    let refreshUI = function () {
        Reqs.getEventsForMonth(Dates.displayedMonth().dt).done(function (events) {
            Ui.updateCalendarTable(Dates.displayedMonth(), events);
            let date = Ui.$selectedDate.text();
            if (date) {
                let dt = Dates.displayedMonth().dt.set({ day: date });
                Ui.showDateDetails(dt);
            }
        });
    }

    let setupEventListeners = function () {

        // Next month and previous month buttons
        $('#next-month, #prev-month').click(function () {

            let month = $(this).is('#next-month') ? Dates.nextMonth() : Dates.prevMonth();

            Reqs.getEventsForMonth(month.dt).done(function (events) {
                Ui.updateCalendarTable(month, events);

            });
        });

        // Clicking on a cell in the calendar
        $("#calendar-body").on('click', '.calendar-cell', function () {
            if (!$(this).is('.empty')) {
                Ui.$selectedDate.removeClass('selected');
                Ui.$selectedDate = $(this);
                Ui.$selectedDate.addClass('selected');

                let date = $(this).text();
                let dt = Dates.displayedMonth().dt.set({ day: date });
                Ui.showDateDetails(dt);
            }
        });

        $("#details-div").on('click', '.edit-event', function (e) {
            let $parentDiv = $(e.target).parent()
            Reqs.currentEventId = parseInt($parentDiv.attr('data-event-id'));
            let eventDate = $parentDiv.attr('data-event-date').split('-').reverse().join('-');
            let eventDetails = {
                event_date: eventDate,
                title: $parentDiv.find('.details-title').text(),
                start_time: $parentDiv.find('.details-from').text().replace('From: ', ''),
                end_time: $parentDiv.find('.details-to').text().replace('To: ', ''),
                description: $parentDiv.find('.details-desc').text(),
            }
            Ui.setValuesInModal(eventDetails);
            $('#event-modal').modal();
        });

        $("#details-div").on('click', '.delete-event', function (e) {
            let eventId = $(e.target).parent().attr('data-event-id');
            Reqs.deleteEvent(eventId).done(refreshUI);
        });


        $('#create-save').click(function () {
            let eventDetails = Ui.getValuesFromModal();
            if (Reqs.currentEventId < 0) {
                Reqs.addEvent(eventDetails).done(refreshUI);
            } else {
                Reqs.editEvent(eventDetails, Reqs.currentEventId).done(refreshUI);
            }
        });

        $('#search-button').click(function(){
            let searchText = $('#search-text').val();
            Reqs.getEventsWithSearch(searchText).done(Ui.showSearchDetails);

        });
        


        $('#show-create-modal').click(function () {
            Reqs.currentEventId = -1;
        });

        // initalize date and time pickers in modal
        $('#event-modal').on('shown.bs.modal', function (e) {
            $("#create-datepicker").datepicker({
                dateFormat: 'dd-mm-yy'
            });
            $('input.timepicker').timepicker({ timeFormat: 'HH:mm' });
        });

        $('#event-modal').on('hidden.bs.modal', function (e) {
            Ui.clearModal();
        })
    };

    return {
        // Set up eveything when the page opens
        init: function () {

            $(document).ready(function () {

                setupEventListeners();

                Reqs.getEventsForMonth(Dates.displayedMonth().dt).done(function (events) {
                    Ui.updateCalendarTable(Dates.displayedMonth(), events);
                });

            });

        }
    }

})(RequestManager, UiManager, DateManager);




controller.init(RequestManager, UiManager, DateManager);



