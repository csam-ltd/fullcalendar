import ListEventRenderer from './ListEventRenderer'

// [CSAM] Custom renderer; not part of FC
export default class MyScheduleRenderer extends ListEventRenderer {

  // generates the HTML for a single event row
  fgSegHtml(seg) {
    let eventFootprint = seg.footprint
    let eventDef = eventFootprint.eventDef
    let url = eventDef.url
    let classes = ['fc-list-item'].concat(this.getClasses(eventDef))
    let bgColor = this.getBgColor(eventDef)

    if (url) {
      classes.push('fc-has-url')
    }

    return '<div class="details__container">' +
      '<div class="hours-per-day">' + (eventDef.miscProps.hoursPerDay ? eventDef.miscProps.hoursPerDay + 'h' : '') + '</div>' +
      '<div class="project-info"' + (bgColor ? ' style="border-left-color:' + bgColor + '"' : '') + '>' +
      '<p class="title">' + eventDef.miscProps.project + '</p>' +
      '<p class="client">' + eventDef.miscProps.client + '</p>' +
      '</div>' +
      '<div class="notes">' + (eventDef.miscProps.notes || '') + '</div>' +
      '</div>'
  }

}
