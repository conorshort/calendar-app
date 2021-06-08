


function getCookie(name) {
    // A function to get a cookie by name
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

// Get the CSRF token from django
const csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

// Set the CSRF token in all necessary HTTP requests
$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

// Get the currnet user id and name from Django
const user_id = JSON.parse(document.getElementById('user_id').textContent);
const username = JSON.parse(document.getElementById('username').textContent);


let DateTime = luxon.DateTime;


// This contains are functions related to date and time
let DateManager = (function () {

    const NOW = DateTime.local();

    return {
        current: {
            now: NOW,
            day: NOW.day,
            month: NOW.month,
            year: NOW.year
        },

        // This is incremented or decremented when the user 
        // navigate to a different month
        monthOffset: 0,

        nextMonth: function () {
            this.monthOffset++;
            return this.displayedMonth();
        },

        prevMonth: function () {
            this.monthOffset--;
            return this.displayedMonth();
        },

        // Get details about the currently diplayed month
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



// These are all HTTP request function
let RequestManager = (function () {

    return {

        currentEventId: -1,

        getEventsForMonth: function (dt) {
            return $.getJSON('/events', { month: dt.month, year: dt.year });
        },

        getEventsOnDate: function (dt) {
            return $.getJSON('/events', { day: dt.day, month: dt.month, year: dt.year });
        },

        getEventsWithSearch: function (searchText) {
            return $.getJSON('/events', { query: searchText });
        },

        addEvent: function (eventDetails) {
            eventDetails.author = -1;
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
        },

        updatedSharedWith: function (otherUser) {
            return $.ajax({
                method: "PUT",
                url: `/users/${user_id}/`,
                data: { username: username, shared_with: otherUser }
            });
        },



    }
})();


// These are functions that update the UI in some wat
let UiManager = (function () {

    // Restrucute the events coming from django to a more useful
    // format. Returns and object with the event dates as keys and 
    // details as values.
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

    // Template for event details
    const eventDetails = ({ id, title, author, start_time, end_time, description, event_date }) => `
                <div data-event-id=${id} data-event-date=${event_date} class="card mt-2">
                    <div class="card-body">
                        <h4 class="details-title card-title">${title}</h4>
                        <p class="details-from card-text">From: ${start_time.slice(0, -3)}</p>
                        <p class="details-to card-text">To: ${end_time.slice(0, -3)}</p>
                        <hr/>
                        <p class="details-desc card-text">${description}</p>
                        <hr/>
                        <div class="btn-group">
                            <button class='edit-event btn btn-outline-primary'>Edit</button>
                            <button class='delete-event btn btn-outline-primary'>Delete</button>
                        </div>
                    </div>
                </div>
                `;

    // Template for search event details
    const searchDetails = ({ id, title, start_time, end_time, description, event_date }) => `
            <div data-event-id=${id} data-event-date=${event_date} class="card mt-2">
                <div class="card-body">
                    <h4 class="details-title card-title">${title}</h4>
                    <h4 class="details-search-date">${event_date}</h4>
                    <p class="details-from card-text">From: ${start_time.slice(0, -3)}</p>
                    <p class="details-to card-text">To: ${end_time.slice(0, -3)}</p>
                    <hr />
                    <p class="details-desc card-text">${description}</p>
                    <hr />
                    <div class="btn-group">
                        <button class='edit-event btn btn-outline-primary'>Edit</button>
                        <button class='delete-event btn btn-outline-primary'>Delete</button>
                    </div>
                </div>
            </div>
                `;




    return {
        $selectedDate: $('p'),
        thisMonthsEvents: {},

        // Shows the details of events on a chosen date
        showDateDetails: function (dt) {
            const dateDetailsStr = `${dt.day} ${dt.monthLong} ${dt.year} `;

            $('#details-date').text(dateDetailsStr);

            todaysEvents = this.thisMonthsEvents[dt.day];
            if (todaysEvents) {
                $('#details-div').html(todaysEvents.map(eventDetails).join(''));
            } else {
                const noEvents = $('<div></div>').text('You have no events on this date.')
                $('#details-div').html(noEvents);
            }
        },

        // Shows the results of a search
        showSearchDetails: function (events) {

            $('#details-date').text("Search results");

            if (events.length) {
                $('#details-div').html(events.map(searchDetails).join(''));
            } else {
                const noEvents = $('<div></div>').text('No events match this search.')
                $('#details-div').html(noEvents);
            }
        },



        // This function populates the calendar with dates based on the current month
        // while also adding dots indicating an event on that date
        updateCalendarTable: function (monthDetails, events) {
            events = restructureEvents(events);
            this.thisMonthsEvents = events;
            console.log(events);
            $('#calendar-body').html('');
            $('#month-name').text(`${monthDetails.monthName} ${monthDetails.year} `);
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
                    // Add the cell tok the table
                    $tableRow.append($cell);
                }
                $('#calendar-body').append($tableRow);
            }
        },

        // Get the values from the modal
        getValuesFromModal: function () {
            let eventDetails = {
                title: $('#create-title').val(),
                event_date: $('#create-datepicker').val().split('-').reverse().join('-'),
                start_time: $('#create-start-time').val(),
                end_time: $('#create-end-time').val(),
                description: $('#create-description').val()
            };

            return eventDetails;
        },

        // Set the values in the modal for event editing
        setValuesInModal: function (eventDetails) {
            $('#create-datepicker').val(eventDetails.event_date);
            $('#create-title').val(eventDetails.title);
            $('#create-start-time').val(eventDetails.start_time);
            $('#create-end-time').val(eventDetails.end_time);
            $('#create-description').val(eventDetails.description);
        },

        clearModal: function () {
            let elems = ['#create-datepicker',
                '#create-title',
                '#create-start-time',
                '#create-end-time',
                '#create-description'];
            elems.forEach(elem => {
                $(elem).val('');
            });
        },

        getCurrentUserOption: function () {
            return $('#user-select').val();
        }
    }
}

)();



// This is the overall controller
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

        // Editing an event
        $("#details-div").on('click', '.edit-event', function (e) {
            let $parentDiv = $(e.target).parent().parent().parent();
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

        // Delete event
        $("#details-div").on('click', '.delete-event', function (e) {
            let eventId = $(e.target).parent().parent().parent().attr('data-event-id');
            Reqs.deleteEvent(eventId).done(refreshUI);
        });

        // Save event
        $('#create-save').click(function () {
            // ("#all-fields-alert").hide();
            let eventDetails = Ui.getValuesFromModal();
            if (eventDetails) {
                if (Reqs.currentEventId < 0) {
                    Reqs.addEvent(eventDetails).done(refreshUI);
                } else {
                    Reqs.editEvent(eventDetails, Reqs.currentEventId).done(refreshUI);
                }
            } else {
                // ("#all-fields-alert").show();
            }
        });

        $('#search-button').click(function () {
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

        $('#share-cal').click("share-with-user", function () {
            let userToShareWith = Ui.getCurrentUserOption()
            console.log(userToShareWith)
            Reqs.updatedSharedWith(userToShareWith).done(function () {
                console.log('hi')
                $('#cal-shared').show()
                $('#cal-not-shared').hide()
            }).fail(() => {
                $('#cal-not-shared').show()
                $('#cal-shared').hide()
            });
        })
    };

    return {
        // Set up eveything when the page opens
        init: function () {

            $(document).ready(function () {
                $('#cal-shared, #cal-not-shared').hide();
                setupEventListeners();

                Reqs.getEventsForMonth(Dates.displayedMonth().dt).done(function (events) {
                    Ui.updateCalendarTable(Dates.displayedMonth(), events);
                    Ui.showDateDetails(Dates.current.now);
                });

            });

        }
    }

})(RequestManager, UiManager, DateManager);




controller.init(RequestManager, UiManager, DateManager);



