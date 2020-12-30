
// START THE SERVER => RUN: python3 -m http.server (adding a number at the end selects the port (default: 8000) )

console.log("--- CONTROLLER LOADED");

// const parseCsv = require('csv-parse/lib/sync.js');
//const parseCsv = require('csv');

//var eventData = events;
var zoom = 1;
var animSpeed = 500;
var timelineWidthStart = $(window).width(); //3000;
var timelineWidth = timelineWidthStart * zoom;
var minTime = 0;
var maxTime = 0;

// setup();

// ENTRY POINT
getDatabaseRaw()


function getDatabaseRaw() {

	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function () {
		if (xhttp.readyState == 4 && xhttp.status == 200) {

			// IF db FOUND, GOTO setup();
			// at jsonFormatter.js
			var eventsFromDB = parseDB(xhttp.responseText.trim()); // EVENT DATA IS GLOBAL

			var eventsOrdered = quickSort(eventsFromDB);
			for (let i = 0; i < eventsOrdered.length; i++) {
				console.log(eventsOrdered[i].dates.start);
			}


			//console.log(eventData);

			setup(eventsOrdered);

		} else {
			console.log("--|| DATABASE NOT FOUND");
		}
	}

	xhttp.open("GET", "../db/events-db.tsv", true);
	xhttp.send();
}

function setup(eventData) {



	$("#timelineContainer").css("width", timelineWidth + "px");
	$("#timelineContainer").find("#timelineLine").css("width", timelineWidth + "px");

	buildEvents(eventData); // EVENT DATA IS GLOBAL

	buildTimelineFixedMarkers();

}


function buildEvents(eventData) {

	// GETTING MODEL HTML-DOM FOR AN EVENT
	var eventModelElement = $("#timelineContainer").children(".timeEvent").first();
	var newEvents = []; 	// JQUERY OBJECT

	// CALCULATE MIN+MAX ABSOLUTE TIME
	calculateMinMaxTime(eventData); // !!! NOT NEEDED IF DOING THE QUICKSORT. REMOVE LATER.


	for (let i = 0; i < eventData.length; i++) {

		var newEvent = eventModelElement.clone();

		// newEvent.find(".ev-title").text(eventData[i].title);
		newEvent.find(".ev-title").text(new Date(eventData[i].dates.start).getFullYear());
		newEvent.find(".ev-description").text(eventData[i].description);
		// newEvent.find(".ev-description").text("Ev:" + i);

		// SAVE DATES ON THE DOM (only once, as original absolute time)
		newEvent.attr("data-start", eventData[i].dates.start);
		newEvent.attr("data-end", eventData[i].dates.end);

		// POINT OR RANGE
		if (eventData[i].dates.start == eventData[i].dates.end) {
			newEvent.find(".ev-rangeIndicator").css("display", "none");
			newEvent.find(".ev-timeIndicatorEnd").css("display", "none");
		}

		var posInTimeline = timelineWidth * getEventStartNormalized(newEvent);
		setEventPosition(newEvent, posInTimeline);

		var sizeInTimeline = timelineWidth * (getEventEndNormalized(newEvent) - getEventStartNormalized(newEvent));
		setEventSize(newEvent, sizeInTimeline);

		newEvents.push(newEvent[0]); // GET THE DOM OBJECT WRAPPED BY THE JQUERY OBJECT
	}

	// console.log(newEvents);

	$("#timelineContainer").append(newEvents);

	// REMOVE MODEL
	eventModelElement.remove();
	// eventModelElement.css("display", "none");

}

function updateTimelineFixedMarkers() {

	// REMOVE CURRENT MARKERS
	$("#timelineLine").children().fadeOut(animSpeed * 0.5, function () {
		$(this).remove();
	});

	buildTimelineFixedMarkers();

}

function buildTimelineFixedMarkers() {

	var minYear = new Date(minTime).getFullYear();
	var maxYear = new Date(maxTime).getFullYear();

	console.log("Min Year: " + minYear);
	console.log("Max Year: " + maxYear);

	var totalYears = maxYear - minYear;
	var jumpUnit = 0;

	if (totalYears <= 1) {
		jumpUnit = 1.0 / 12; // months
	} else if (totalYears <= 5) {
		jumpUnit = 1;
	} else if (totalYears <= 50) {
		jumpUnit = 5;
	} else if (totalYears <= 100) {
		jumpUnit = 20;
	} else if (totalYears <= 1000) {
		jumpUnit = 100;
	} else {
		jumpUnit = 1000;
	}

	jumpUnit = Math.trunc(jumpUnit / zoom);

	var startAt = (minYear + jumpUnit);
	startAt -= (startAt % jumpUnit);
	var finishAt = maxYear - (maxYear % jumpUnit);

	var howMany = (Math.trunc((finishAt - startAt) / jumpUnit)) + 1;

	// var displayWidthUnit = timelineWidth / howMany;

	for (let i = 0; i < howMany; i++) {

		var date = startAt + (jumpUnit * i);
		var pos = map(date, minYear, maxYear, 0, timelineWidth);

		var dateMarker = $('<div/>', {
			class: "timeLineFixedDate",
			css: {
				left: pos,
				display: "none"
			}
		});

		dateMarker.append('<div class="fixedDateNumber">' + date + '</div>');
		dateMarker.append('<div class="fixedDateSeparator"></div>');

		dateMarker.appendTo('#timelineLine');

		dateMarker.fadeIn(animSpeed);
	}




}

function setEventPosition(event, pos) {
	// event.css("left", pos + "px");

	event.animate({
		left: pos
	}, animSpeed);
}

function setEventSize(event, siz) {
	// event.find(".ev-rangeIndicator").css("width", siz + "px");

	event.find(".ev-rangeIndicator").animate({
		width: siz
	}, animSpeed);

	event.find(".ev-timeIndicatorEnd").animate({
		left: siz
	}, animSpeed);
}

function zoomTo(zoomValue) {

	// FOR KEEPING THE TIME HEAD CENTERED IN THE WINDOW WHILE ZOOMING
	var currentScrollPosNorm = (getScrollY() + ($(window).width() * 0.5)) / timelineWidth;


	timelineWidth = timelineWidthStart * zoomValue;

	// SET timelineLine width
	$("#timelineContainer").find("#timelineLine").animate({
		width: timelineWidth
	}, animSpeed);

	// EVENTS
	var timeEvents = getTimeEventsFromDOM();

	zoom = zoomValue;

	$.each(timeEvents, function () {

		var originalStart = getEventStartNormalized($(this));
		var originalEnd = getEventEndNormalized($(this));

		setEventPosition($(this), originalStart * timelineWidth);
		setEventSize($(this), (originalEnd - originalStart) * timelineWidth);

	});

	// UPDATE FIXED TIME MARKERS
	updateTimelineFixedMarkers();

	// NEW SCROLL POSITION IN NEW TIMELINE WIDTH
	var newScrollPos = (currentScrollPosNorm * timelineWidth) - ($(window).width() * 0.5);
	scrollToLeft(newScrollPos);

}

function scrollToLeft(pos) {
	$("html,body").animate({ scrollLeft: pos }, animSpeed);
}


function getScrollY() {
	return $("html").scrollLeft();
}

function moveScrollAbs(absValue) {
	scrollToLeft(absValue);
}

function moveScrollRel(relValue) {
	scrollToLeft($("html").scrollLeft() + relValue);
}

function getTimeEventsFromDOM() {
	return $("#timelineContainer").find(".timeEvent");
}

function calculateMinMaxTime(events) {

	minTime = events[0].dates.start;
	maxTime = events[0].dates.end;

	for (let i = 1; i < events.length; i++) {
		const event = events[i];

		minTime = event.dates.start <= minTime ? event.dates.start : minTime
		maxTime = event.dates.end >= maxTime ? event.dates.end : maxTime;

	}

	console.log("MinTime: " + minTime);
	console.log("MaxTime: " + maxTime);

}

function getEventStartNormalized(event) {

	return map(event.attr("data-start"), minTime, maxTime, 0, 1);
}

function getEventEndNormalized(event) {
	return map(event.attr("data-end"), minTime, maxTime, 0, 1);
}

function map(value, in_min, in_max, out_min, out_max) {
	return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function quickSort(eventArray) {
	// MODIFIED FROM https://github.com/rajatk16/javascript-sort
	if (eventArray.length < 2) {
		return eventArray
	}
	const chosenIndex = eventArray.length - 1
	const chosen = eventArray[chosenIndex];
	const a = [];
	const b = [];
	for (let i = 0; i < chosenIndex; i++) {
		const temp = eventArray[i];
		temp.dates.start < chosen.dates.start ? a.push(temp) : b.push(temp);
	}

	const output = [...quickSort(a), chosen, ...quickSort(b)];
	//console.log(output.join(' '));
	return output
}