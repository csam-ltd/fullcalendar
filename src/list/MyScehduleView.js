
/*
Responsible for the scroller, and forwarding event-related actions into the "grid"
*/
var MyScheduleView = View.extend({
	
		grid: null,
		scroller: null,
	
		initialize: function() {
			this.grid = new MyScheduleViewGrid(this);
			this.scroller = new Scroller({
				overflowX: 'hidden',
				overflowY: 'auto'
			});
		},
	
		setRange: function(range) {
			View.prototype.setRange.call(this, range); // super
	
			this.grid.setRange(range); // needs to process range-related options
		},
	
		renderSkeleton: function() {
			this.el.addClass(
				'fc-list-view ' +
				this.widgetContentClass
			);
	
			this.scroller.render();
			this.scroller.el.appendTo(this.el);
	
			this.grid.setElement(this.scroller.scrollEl);
		},
	
		unrenderSkeleton: function() {
			this.scroller.destroy(); // will remove the Grid too
		},
	
		setHeight: function(totalHeight, isAuto) {
			this.scroller.setHeight(this.computeScrollerHeight(totalHeight));
		},
	
		computeScrollerHeight: function(totalHeight) {
			return totalHeight -
				subtractInnerElHeight(this.el, this.scroller.el); // everything that's NOT the scroller
		},
	
		renderEvents: function(events) {
			this.grid.renderEvents(events);
		},
	
		unrenderEvents: function() {
			this.grid.unrenderEvents();
		},
	
		isEventResizable: function(event) {
			return false;
		},
	
		isEventDraggable: function(event) {
			return false;
		}
	
	});

/*
Responsible for event rendering and user-interaction.
Its "el" is the inner-content of the above view's scroller.
*/
var MyScheduleViewGrid = Grid.extend({
	
		segSelector: '.fc-list-item', // which elements accept event actions
		hasDayInteractions: false, // no day selection or day clicking
	
		// slices by day
		spanToSegs: function(span) {
			var view = this.view;
			var dayStart = view.start.clone().time(0); // timed, so segs get times!
			var dayIndex = 0;
			var seg;
			var segs = [];
	
			while (dayStart < view.end) {
	
				seg = intersectRanges(span, {
					start: dayStart,
					end: dayStart.clone().add(1, 'day')
				});
	
				if (seg) {
					seg.dayIndex = dayIndex;
					segs.push(seg);
				}
	
				dayStart.add(1, 'day');
				dayIndex++;
	
				// detect when span won't go fully into the next day,
				// and mutate the latest seg to the be the end.
				if (
					seg && !seg.isEnd && span.end.hasTime() &&
					span.end < dayStart.clone().add(this.view.nextDayThreshold)
				) {
					seg.end = span.end.clone();
					seg.isEnd = true;
					break;
				}
			}
	
			return segs;
		},
	
		// like "4:00am"
		computeEventTimeFormat: function() {
			return this.view.opt('mediumTimeFormat');
		},
	
		// for events with a url, the whole <tr> should be clickable,
		// but it's impossible to wrap with an <a> tag. simulate this.
		handleSegClick: function(seg, ev) {
			var url;
	
			Grid.prototype.handleSegClick.apply(this, arguments); // super. might prevent the default action
	
			// not clicking on or within an <a> with an href
			if (!$(ev.target).closest('a[href]').length) {
				url = seg.event.url;
				if (url && !ev.isDefaultPrevented()) { // jsEvent not cancelled in handler
					window.location.href = url; // simulate link click
				}
			}
		},
	
		// returns list of foreground segs that were actually rendered
		renderFgSegs: function(segs) {
			segs = this.renderFgSegEls(segs); // might filter away hidden events
	
			if (!segs.length) {
				this.renderEmptyMessage();
			}
			else {
				this.renderSegList(segs);
			}
	
			return segs;
		},
	
		renderEmptyMessage: function() {
			this.el.html(
				'<div class="fc-list-empty-wrap2">' + // TODO: try less wraps
				'<div class="fc-list-empty-wrap1">' +
				'<div class="fc-list-empty">' +
					htmlEscape(this.view.opt('noEventsMessage')) +
				'</div>' +
				'</div>' +
				'</div>'
			);
		},
	
		// render the event segments in the view
		renderSegList: function(allSegs) {
			var segsByDay = this.groupSegsByDay(allSegs); // sparse array
			var dayIndex;
			var daySegs;
			var i;
			var tableEl = $('<div class="table fc-list-table"><div class="tbody"/></div>');
			var tbodyEl = tableEl.find('.tbody');
	
			for (dayIndex = 0; dayIndex < 7; dayIndex++) {
				// Create a new row, there is one row per day.
				var $tr = $(document.createElement("div"));
				$tr.addClass("tr")
				$tr.append(this.dayHtml(
					this.view.start.clone().add(dayIndex, 'days')
				));
				
				// Add a cell regardless whether there are daysSegs, we need the borders
				$tr.append(document.createElement("div"));
				var $td = $tr.find(":nth-child(2)");
				$td.addClass("td td-1");

				daySegs = segsByDay[dayIndex];
				if (daySegs) { // sparse array, so might be undefined

					this.sortEventSegs(daySegs);
					for (i = 0; i < daySegs.length; i++) {
						// Add the hours per day, project, client and notes to the cell
						$td.append(daySegs[i].el);
					}
				} else {
					// No assignments so make it easy to style
					$tr.addClass("no-assignments");
				}

				// Add the last table cell with the show more link
				$tr.append(this.showMoreHtml);

				tbodyEl.append($tr);
				tbodyEl.append('<div class="line-separator"></div>');
			}
	
			this.el.empty().append(tableEl);
		},
	
		// Returns a sparse array of arrays, segs grouped by their dayIndex
		groupSegsByDay: function(segs) {
			var segsByDay = []; // sparse array
			var i, seg;
	
			for (i = 0; i < segs.length; i++) {
				seg = segs[i];
				(segsByDay[seg.dayIndex] || (segsByDay[seg.dayIndex] = []))
					.push(seg);
			}
	
			return segsByDay;
		},

		// generates the HTML for the row heading
		dayHtml: function(dayDate){
			var view = this.view;
			var mainFormat = view.opt('listDayFormat');

			return '<div class="td td-0 day__container">' + 
					'<div class="day' + (moment().isSame(dayDate, 'day') ? ' today' : '') + '" data-date="' + dayDate.format('YYYY-MM-DD') + '">' +
						htmlEscape(dayDate.format(mainFormat)) + 
					'</div>' + 
				'</div>';
		},

		// generates the HTML for a single event row
		fgSegHtml: function(seg) {
			var view = this.view;
			var classes = [ 'fc-list-item' ].concat(this.getSegCustomClasses(seg));
			var bgColor = this.getSegBackgroundColor(seg);
			var event = seg.event;
			var url = event.url;
			var timeHtml;

			console.log(event);
	
			return '<div class="details__container">' + 
							'<div class="hours-per-day">' + (event.hoursPerDay ? event.hoursPerDay + "h" : "") + '</div>' +
							'<div class="project-info"' + (bgColor ? ' style="border-left-color:' + bgColor + '"' : '') + '>' + 
								'<p class="title">' + event.project + '</p>' +
								'<p class="client">' + event.client + '</p>' + 
							'</div>' +
							'<div class="notes">' + (event.notes || "") + '</div>' +
						'</div>';
		},

		// generates the HTML for the show more link
		showMoreHtml: function() {
			return '<div class="td td-2 more-less hidden">Show more</div>';
		}

	});
	