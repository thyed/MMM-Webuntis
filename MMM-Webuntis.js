Module.register("MMM-Webuntis", {

    defaults: {
        title: "",
        school: "",
        username: "",
        password: "",
        server: ""
    },


    getStyles: function () {
  		return ["MMM-Webuntis.css"];
  	},

    getTranslations: function () {
  		return {
  			en: "translations/en.json",
  			de: "translations/de.json"
  		};
  	},

    start: function (){
        let lessons = [];
        this.sendSocketNotification("FETCH_DATA", this.config)
    },

    getDom: function() {
        var wrapper = document.createElement("div");

        var table = document.createElement("table");
    		table.className = "bright small light";

        if (this.lessons === undefined) {
    			return table;
    		}

        // sort lessons by start time
        this.lessons.sort((a,b) => a.sortString - b.sortString);

        var addedRows = 0;

        // iterate through lessons
        for (let i = 0; i < this.lessons.length; i++) {
            var lesson = this.lessons[i];
            var time = new Date(lesson.year,lesson.month-1,lesson.day,lesson.hour,lesson.minutes);

            // skip if nothing special
            if (lesson.code == '') continue;

            // skip past lessons
            if (time < new Date() && lesson.code != 'error') continue;

            addedRows++;

            var row = document.createElement("tr");
            table.appendChild(row);

            // title, i.e. class name or child name
            var titleCell = document.createElement("td");
            titleCell.innerHTML = this.config.title;
            titleCell.className = "align-right alignTop";
            row.appendChild(titleCell);

            // date and time
            var dateTimeCell = document.createElement("td");
            dateTimeCell.innerHTML = time.toLocaleDateString('de-DE',{weekday:'short'})
              + "&nbsp;" + time.toLocaleTimeString('de-DE', {hour:'2-digit',minute:'2-digit'});
            dateTimeCell.className = "leftSpace align-right alignTop";
            row.appendChild(dateTimeCell);

            // subject cell
            var subjectCell = document.createElement("td");
            subjectCell.innerHTML = lesson.substText;
            if (lesson.substText == '') subjectCell.innerHTML =
              this.capitalize(lesson.subject) + "&nbsp;(" +
              this.capitalize(lesson.teacher) + ")";
            //if (lesson.text.length > 0 ) subjectCell.innerHTML += "</br><span class='xsmall dimmed'>" + lesson.text + "</span>";
            subjectCell.className = "leftSpace align-left alignTop";
            if (lesson.code == 'cancelled') subjectCell.className += " cancelled";
            if (lesson.code == 'error') subjectCell.className += " error";

            row.appendChild(subjectCell);
        }

        // add message row if table is empty
        if (addedRows == 0) {
          var nothingRow = document.createElement("tr");
          table.appendChild(nothingRow);
          var nothingCell = document.createElement("td");
          nothingCell.innerHTML = this.translate("nothing");
          nothingRow.appendChild(nothingCell);
        }

        wrapper.appendChild(table);

        return wrapper
    },

    capitalize: function(str) {
      str = str.toLowerCase().split(" ");

      for (let i = 0, x = str.length; i < x; i++) {
        if (str[i]) str[i] = str[i][0].toUpperCase() + str[i].substr(1);
      }

      return str.join(" ");
    },

    notificationReceived: function(notification, payload) {
        switch(notification) {
            case "DOM_OBJECTS_CREATED":
                var timer = setInterval(() => {
                    this.sendSocketNotification("FETCH_DATA", this.config)
                }, 60*1000)
            break;
        }
    },

    socketNotificationReceived: function(notification, payload) {
        switch(notification) {
            case "GOT_DATA":
                this.lessons = payload;
                console.log(this.lessons);
                this.updateDom();
                break;
        }
    },



  })
