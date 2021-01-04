
// START THE SERVER => RUN: python3 -m http.server (adding a number at the end selects the port (default: 8000) )

// const parseCsv = require('csv-parse/lib/sync.js');
//const parseCsv = require('csv');

var eventData;

var zoom = 1;
var animSpeed = 500;
var timelineWidthStart = $(window).width(); //3000;
var timelineWidth = timelineWidthStart * zoom;
var minTime = 0;
var maxTime = 0;

// ENTRY POINT
getDatabaseRaw()


function getDatabaseRaw() {

	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function () {
		if (xhttp.readyState == 4 && xhttp.status == 200) {

			// IF db FOUND, GOTO setup();
			// at jsonFormatter.js
			var eventsFromDB = parseDB(xhttp.responseText.trim()); // EVENT DATA IS GLOBAL

			eventData = quickSort(eventsFromDB);
			for (let i = 0; i < eventData.length; i++) {
				console.log(eventData[i].dates.start);
			}
			//console.log(eventData);

			setup(eventData);

		} else {
			console.log("--|| DATABASE NOT FOUND");
		}
	}

	xhttp.open("GET", "../db/histoire-1.tsv", true);
	xhttp.send();
}

function setup(eventData) {



	$("#timelineContainer").css("width", timelineWidth + "px");
	$("#timelineContainer").find("#timelineLine").css("width", timelineWidth + "px");

	buildEvents(eventData); // EVENT DATA IS GLOBAL

	buildTimelineFixedMarkers();

	$("#selectedDateMarker").css("display","none");

	// EVENT BINDINGS
	$(".ev-content").mouseenter(function(){
		// console.log($(this).find(".ev-description").html());
		// $(this).find(".ev-description").html();
		$("#selectedDateMarker").css("display","block");

		let eventObj = $(this).parent().parent()
		let newLeft = parseFloat(eventObj.css("left")) - 25;
		$("#selectedDateMarker").css("left",newLeft);

		var dateValue = new Date(parseInt(eventObj.attr("data-start")));
		$("#selectedDateMarker").html((dateValue.getMonth() + 1) + "/" + dateValue.getFullYear());
		// console.log(dateValue);

		eventObj.find(".ev-timeIndicatorPin").addClass("ev-pinSelected");
		eventObj.find(".ev-timeIndicator").addClass("ev-pinSelected");
		eventObj.find(".ev-rangeIndicator").addClass("ev-pinSelected");


		// eventObj.find(".ev-description").css("overflow", "visible");

	});

	$(".ev-content").mouseleave(function(){
		let eventObj = $(this).parent().parent()
		$("#selectedDateMarker").css("display","none");
		eventObj.find(".ev-timeIndicatorPin").removeClass("ev-pinSelected");
		eventObj.find(".ev-timeIndicator").removeClass("ev-pinSelected");
		eventObj.find(".ev-rangeIndicator").removeClass("ev-pinSelected");


		// eventObj.find(".ev-description").css("overflow", "hidden");

	});



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

		newEvent.find(".ev-container").css("top","0px");
		newEvent.css("z-index", -i);

		newEvents.push(newEvent[0]); // GET THE DOM OBJECT WRAPPED BY THE JQUERY OBJECT
	}

	// console.log(newEvents);

	$("#timelineContainer").append(newEvents);

	// REMOVE MODEL
	eventModelElement.remove();
	// eventModelElement.css("display", "none");

	repositionEventsVertically();

}

function repositionEventsVertically() {

	let horizontalMaxDist = 150; // SAME AS .ev-description{width}
	let verticalDisplace = 25;

	let evs = getTimeEventsFromDOM();
	let savedTops = [];
	savedTops.push(0); // to be able to animate them altogether after the main loop

	for (let i = 1; i < evs.length; i++) {

		let thisEv = evs.eq(i);
		let prevEv = evs.eq(i-1);
		let thisEvLeft = parseFloat(thisEv.css("left"));
		let prevEvLeft = parseFloat(prevEv.css("left"))
		let interPillDistance = Math.abs( thisEvLeft - prevEvLeft);
			
		if (interPillDistance < horizontalMaxDist) {
			// let newTop = parseFloat(prevEv.find(".ev-container").css("top")) + verticalDisplace;
			let newTop = savedTops[i-1] + verticalDisplace;
			savedTops.push(newTop);
			// thisEv.find(".ev-container").css("top", newTop);
		} else {
			savedTops.push(0);
		}

	}

	// animate
	for (let i = 1; i < evs.length; i++) {

		evs.eq(i).find(".ev-container").delay(500).animate({
			top: savedTops[i]
		}, animSpeed);
		
		evs.eq(i).find(".ev-timeIndicatorStart").delay(500).animate({
			height: savedTops[i] + 35
		}, animSpeed);
	}

}

function updateTimelineFixedMarkers() {

	// REMOVE CURRENT MARKERS
	$("#timelineLine").children(".timeLineFixedDate").fadeOut(animSpeed * 0.5, function () {
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

	setTimeout(repositionEventsVertically, animSpeed);


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