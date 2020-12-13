
// START THE SERVER => RUN: python3 -m http.server (adding a number at the end selects the port (default: 8000) )

console.log("--- CONTROLLER LOADED");

// const parseCsv = require('csv-parse/lib/sync.js');
//const parseCsv = require('csv');

//var eventData = events;
var zoom = 1;
var animSpeed = 500;
var timelineWidthStart = $(window).width(); //3000;
var timelineWidth = timelineWidthStart * zoom;

// setup();

// ENTRY POINT
getDatabaseRaw()


function getDatabaseRaw() {
	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function () {
		if (xhttp.readyState == 4 && xhttp.status == 200) {

			// IF db FOUND, GOTO setup();
			setup(xhttp.responseText.trim());

		} else {
			console.log("--|| DATABASE NOT FOUND");
		}
	}

	xhttp.open("GET", "../db/events-db.tsv", true);
	xhttp.send();
}

function parseDB(database) {
	
	var jsonEvents = []; 
	
	var perLine = database.split('\n');

	perLine.forEach(element => {
		var eventFields = element.split('\t');
		// console.log(perField);

		var event = {
			"id": eventFields[0],
			"title": eventFields[0],
			"dates": {
				"start": eventFields[2],
				"end": eventFields[3]
			},
			"description": eventFields[1],
			"type": "type",
			"tags": [
				eventFields[5]
			]
		}

		jsonEvents.push(event);

	});

	return jsonEvents;
}

function setup(rawDB) {

	eventData = parseDB(rawDB);

	console.log(eventData);


	$("#timelineContainer").css("width", timelineWidth + "px");
	$("#timelineContainer").find("#timelineLine").css("width", timelineWidth + "px");

	buildEvents(eventData);

}


function buildEvents(eventData) {

	// GETTING MODEL HTML-DOM FOR AN EVENT
	var eventModelElement = $("#timelineContainer").children(".timeEvent").first();

	var newEvents = [];

	for (let i = 0; i < 1; i++) {

		var newEvent = eventModelElement.clone();

		newEvent.find(".ev-title").text(eventData[i].title);
		newEvent.find(".ev-description").text(eventData[i].description);

		// SAVE DATES ON THE DOM (only once = original dates)
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

	console.log(newEvents);

	$("#timelineContainer").append(newEvents);

	// REMOVE MODEL
	eventModelElement.remove();
	// eventModelElement.css("display", "none");

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

}

function getTimeEventsFromDOM() {
	return $("#timelineContainer").find(".timeEvent");
}

function getEventStartNormalized(event) {
	return event.attr("data-start");
}

function getEventEndNormalized(event) {
	return event.attr("data-end");
}