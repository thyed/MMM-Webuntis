const NodeHelper = require("node_helper");
const WebUntis = require('webuntis');

module.exports = NodeHelper.create({
    start: function() {
    },

    socketNotificationReceived: function(notification, payload) {

      switch(notification) {

        case "FETCH_DATA":

          // set config to config sent by client
          this.config = payload;

          const untis = new WebUntis(
            this.config.school,
            this.config.username,
            this.config.password,
            this.config.server
          );

          // create object with necessary date to be sent to module
          var lessons = [];

          untis
              .login()
              .then(session => {
                var rangeStart = new Date();
                var rangeEnd = new Date();
                rangeEnd.setDate(rangeStart.getDate()+1);
                return untis.getOwnTimetableForRange(rangeStart, rangeEnd);
              })
              .then(timetable => {

                timetable.forEach(element => {
                  let lesson = {};
  								let year = element.date.toString().substring(0,4);
  								let month = element.date.toString().substring(4,6);
  								let day = element.date.toString().substring(6);
  								let hour = element.startTime.toString();
  								hour.length == 3 ? hour = '0'+hour.substring(0,1) : hour = hour.substring(0,2);
  								let minutes = element.startTime.toString()
  								minutes = minutes.substring(minutes.length-2);
  								lesson.sortString = element.date + hour + minutes;
                  switch (element.code) {
                    case "cancelled": lesson.sortString += "1"; break;
                    case "irregular": lesson.sortString += "2"; break;
                    default: lesson.sortString += "9";
                  }
                  lesson.year = year;
                  lesson.month = month;
                  lesson.day = day;
                  lesson.hour = hour;
                  lesson.minutes = minutes;
  								lesson.subject = element.su[0].longname;
  								lesson.teacher = element.te[0].longname;
  								element.code ? lesson.code = element.code : lesson.code = '';
  								element.lstext ? lesson.text = element.lstext : lesson.text = '';

  								lessons.push(lesson);
                });

                this.sendSocketNotification("GOT_DATA", lessons);
              })
              .catch(error => {
                let today = new Date();
                let errorObject = [ {
                  year: today.getFullYear(),
                  month: today.getMonth()+1,
                  day: today.getDate(),
                  hour: today.getHours(),
                  minutes: today.getMinutes(),
                  subject: "ERROR",
                  teacher: error.toString(),
                  code: "error"
                } ];
                this.sendSocketNotification("GOT_DATA", errorObject);
              });

          untis.logout();
          break;
      }
    },
  })
