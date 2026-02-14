import { Column } from "./column.model";
import { Members } from "./members.model";

export class Board {
   id?: string;
    name: string = '';
    columns: Column[] = [];
    added_columns: Column[] = [];
    selectedTask: string = '';
    globalOption: string = '';
    members: Members[] = [];

    //
    constructor(id?: string, name: string = '', columns?: Column | Column[], selectedTask: string = '', globalOption: string = '', members?: Members | Members[]) {
        this.id = id;
        this.name = name;
        if (columns) {
            this.columns = Array.isArray(columns) ? columns : [columns];
        }
        this.selectedTask = selectedTask;
        this.globalOption = globalOption;
        if (members) {
            this.members = Array.isArray(members) ? members : [members];
        }
    }
}
