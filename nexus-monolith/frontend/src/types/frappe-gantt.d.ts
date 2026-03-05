/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'frappe-gantt' {
    export default class Gantt {
        constructor(
            wrapper: string | HTMLElement | SVGElement,
            tasks: any[],
            options: any
        );
        change_view_mode(mode: string): void;
        refresh(tasks: any[]): void;
    }
}
