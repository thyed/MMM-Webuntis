const NodeHelper = require("node_helper");
const WebUntis = require('webuntis');

module.exports = NodeHelper.create({
    start: function() {
    },

    socketNotificationReceived: function(notification, payload) {

      if (notification === "FETCH_DATA") {

        // iterate through students, fetch and send lessons
        for (let i in payload.students) {
          this.fetchLessons(payload.students[i]);
        }
      }
    },


    fetchLessons: function(studentData) {

        const untis = new WebUntis(
          studentData.school,
          studentData.username,
          studentData.password,
          studentData.server
        );

        // create lessons array to be sent to module
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
								element.su[0] ? lesson.subject = element.su[0].longname : lesson.subject = '';
								element.te[0] ? lesson.teacher = element.te[0].longname : lesson.teacher = '';
								element.code ? lesson.code = element.code : lesson.code = '';
								element.lstext ? lesson.text = element.lstext : lesson.text = '';
                element.substText ? lesson.substText = element.substText : lesson.substText = '';

								lessons.push(lesson);
              });

              this.sendSocketNotification("GOT_DATA", {title: studentData.title, lessons: lessons});
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
      },
  })
