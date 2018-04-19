import * as $ from 'jquery'
import * as moment from 'moment'
import { htmlEscape } from '../util'
import ListView from './ListView'
import MyScheduleRenderer from './MyScheduleRenderer'
import ListEventPointing from './ListEventPointing'

/*
[CSAM] Custom view; not part of FC
Responsible for the scroller, and forwarding event-related actions into the "grid".
*/
export default class MyScheduleView extends ListView {

  renderEmptyMessage() {
    this.contentEl.html(
		  '<div class="fc-list-empty">' +
			  htmlEscape(this.opt('noEventsMessage')) +
			'</div>'
    )
  }


  // render the event segments in the view
  renderSegList(allSegs) {
    let segsByDay = this.groupSegsByDay(allSegs) // sparse array
    let dayIndex
    let daySegs
    let i
    let tableEl = $('<table class="fc-list-table ' + this.calendar.theme.getClass('tableList') + '"><tbody/></table>')
    let tbodyEl = tableEl.find('tbody')

    for (dayIndex = 0; dayIndex < 7; dayIndex++) {
      // Create a new row, there is one row per day.
      const $tr = $(document.createElement('div'))
      $tr.addClass('tr')
      $tr.append(this.dayHeaderHtml(this.dayDates[dayIndex]))

      // Add a cell regardless whether there are daysSegs, we need the borders
      $tr.append(document.createElement('div'))
      const $td = $tr.find(':nth-child(2)')
      $td.addClass('td td-1')

      daySegs = segsByDay[dayIndex]
      if (daySegs) { // sparse array, so might be undefined

        this.eventRenderer.sortEventSegs(daySegs)
        for (i = 0; i < daySegs.length; i++) {
          // Add the hours per day, project, client and notes to the cell
          $td.append(daySegs[i].el)
        }
      } else {
        // No assignments so make it easy to style
        $tr.addClass('no-assignments')
      }

      // Add the last table cell with the show more link
      $tr.append(this.showMoreHtml)

      tbodyEl.append($tr)
      tbodyEl.append('<div class="line-separator"></div>')
    }

    this.el.empty().append(tableEl)
  }


  // generates the HTML for the day headers that live amongst the event rows
  dayHeaderHtml(dayDate) {
    let mainFormat = this.opt('listDayFormat')

    return '<div class="td td-0 day__container">' +
					'<div class="day' + (moment().isSame(dayDate, 'day') ? ' today' : '') + '" data-date="' + dayDate.format('YYYY-MM-DD') + '">' +
						htmlEscape(dayDate.format(mainFormat)) +
					'</div>' +
				'</div>'
  }


  // generates the HTML for the show more link
  showMoreHtml() {
    return '<div class="td td-2 more-less hidden">Show more</div>'
  }

}

MyScheduleView.prototype.eventRendererClass = MyScheduleRenderer
MyScheduleView.prototype.eventPointingClass = ListEventPointing
