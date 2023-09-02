import { WatchRecord } from "./watchRecord.mjs";
import { Component } from "./component.mjs";
import { SekPerDay } from "./sekPerDay.mjs";

class WatchTable extends Component {
    currentWatch;
    saveButton;
    dirty;
    stats;
    constructor(parent) {
        // parent has domElement (<div>)
        // Ich muß mich immer mit appendChild in das domElement des Parents hineinerzeugen
        super(parent);
        // table, caption, thead, tbody erzeugen
        this.domElement = document.createElement("table");
        this.display();

        this.caption = document.createElement("caption");
        this.domElement.appendChild(this.caption);

        this.thead = document.createElement("thead");
        this.domElement.appendChild(this.thead);
        this.thead.hidden = true;
        this.fillThead();

        this.tbody = document.createElement("tbody");
        this.domElement.appendChild(this.tbody);

        this.tfoot = document.createElement("tfoot");
        this.domElement.appendChild(this.tfoot);
        this.tfoot.hidden = true;
        this.fillTfoot();
    }

    clear() {
        this.thead.hidden = true;
        this.tbody.innerHTML = "";
        this.tfoot.hidden = true;
        this.setInfo("Wählen oder erstellen");
    }

    setInfo(msg) {
        this.caption.innerHTML = msg;
    }

    fillThead() {
        // 2 Zeilen header
        this.thead.innerHTML = "";
        let tr, th, butt;

        // Headerzeile
        tr = document.createElement("tr");
        this.thead.appendChild(tr);

        // plus button
        th = document.createElement("th");
        th.setAttribute("scope", "rowgroup");
        th.style.width = "5%";
        tr.appendChild(th);
        butt = document.createElement("button");
        th.appendChild(butt);
        butt.innerHTML = "\uff0b"; // Unicode für Pluszeichen
        butt.addEventListener("click", this.addRecord.bind(this));

        th = document.createElement("th");
        th.setAttribute("scope", "col");
        th.style.width = "40%";
        th.innerHTML = "Messzeitpunkt";
        tr.appendChild(th);

        th = document.createElement("th");
        th.setAttribute("scope", "col");
        th.style.width = "10%";
        th.innerHTML = "Abweichung";
        tr.appendChild(th);

        th = document.createElement("th");
        th.setAttribute("scope", "col");
        th.style.width = "25%";
        th.innerHTML = "Sek / Tag";
        tr.appendChild(th);
    }
    fillTfoot() {
        let tr, th, td;
        this.tfoot.innerHTML = "";
        tr = document.createElement("tr");
        this.tfoot.appendChild(tr);

        // save(d) button
        th = document.createElement("th");
        tr.appendChild(th);
        this.saveButton = document.createElement("button");
        this.saveButton.innerHTML = "save";
        this.saveButton.addEventListener("click", this.save.bind(this));
        th.appendChild(this.saveButton);

        td = document.createElement("td");
        tr.appendChild(td);
    }

    save() {
        console.log("save", this.currentWatch);
        if (!this.dirty) {
            console.error("save called, but not dirty");
            return;
        }
        for (let child of this.children) {
            if (child.dirty) {
                child.save();
            }
        }
        this.loadCalcAfterLoad();
        this.setDirty(false);
        window.myObject.watchSelector.populate();
    }
    loadCommon(name) {
        this.currentWatch = name;
        this.thead.hidden = false;
        this.tfoot.hidden = false;
        this.tbody.innerHTML = "";
    }

    loadNew(name) {
        this.loadCommon(name);
        this.setInfo(`Aktuell: ${name}`);
        this.addRecord();
        this.setDirty();
    }

    async loadWatch(name) {
        this.loadCommon(name);
        this.setInfo("Loading...");
        await fetch("http://localhost:3000/uhren/daten/" + name)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        `Error: ${response.status} ${response.statusText}`
                    );
                }
                return response.json();
            })
            .then((data) => {
                this.setInfo(`Aktuell: ${name}`);
                this.setDirty(false);
                this.children = [];
                for (let entry of data) {
                    // this.children.push(
                    //     new WatchRecord(this, this.tbody, entry)
                    // );
                    this.addRecord(entry);
                }
                this.loadCalcAfterLoad();
            })
            .catch((err) => {
                this.setInfo(`Fehler: ${err.message}`);
            });
        console.log("loadWatch", name);
    }
    loadCalcAfterLoad() {
        for (let i = 1; i < this.children.length; i++) {
            this.children[i].calcAfterLoad(this.children[i - 1]);
        }
        if (this.children.length > 1) {
            let x = this.tfoot.children[0]; // the only tr
            x.removeChild(x.children[x.children.length - 1]); // previous sstats
            this.stats = new SekPerDay(
                this.children[this.children.length - 1],
                x
            );
            this.stats.fullFill(this.children[0]);
        }
    }
    remove(child) {
        super.remove(child);
        if (this.children.length == 0) {
            this.clear();
            window.myObject.watchSelector.populate();
        }
        let dirty = false;
        for (let child of this.children) {
            if (child.dirty) {
                dirty = true;
                break;
            }
        }
        this.setDirty(dirty);
    }
    addRecord(data) {
        if (data instanceof Event) {
            data = undefined;
        }
        if (data == undefined) {
            this.setDirty();
        } else {
            this.setDirty(false);
        }
        console.log("addRecord");
        this.children.push(new WatchRecord(this, this.tbody, data));
    }
    setDirty(dirty) {
        super.setDirty(dirty);
        if (this.dirty) {
            this.saveButton.style.backgroundColor = this.constructor.dirtyColor;
            this.saveButton.innerHTML = "save";
        } else {
            this.saveButton.style.backgroundColor = null;
            this.saveButton.innerHTML = "saved";
        }
    }
}
export { WatchTable };