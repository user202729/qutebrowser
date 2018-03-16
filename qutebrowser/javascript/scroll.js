/**
 * Copyright 2016-2017 Florian Bruhin (The Compiler) <mail@qutebrowser.org>
 *
 * This file is part of qutebrowser.
 *
 * qutebrowser is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * qutebrowser is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with qutebrowser.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

window._qutebrowser.scroll = (function() {
    const funcs = {};

    const call_if_frame = window._qutebrowser.utils.call_if_frame;

    // Helper function which scrolls the document 'doc' and window 'win' to x, y
    function scroll_to_perc(x, y, win = window, doc = document) {
        let x_px = win.scrollX;
        let y_px = win.scrollY;

        const width = Math.max(
            doc.body.scrollWidth,
            doc.body.offsetWidth,
            doc.documentElement.scrollWidth,
            doc.documentElement.offsetWidth
        );
        const height = Math.max(
            doc.body.scrollHeight,
            doc.body.offsetHeight,
            doc.documentElement.scrollHeight,
            doc.documentElement.offsetHeight
        );

        if (x !== undefined) {
            x_px = (width - win.innerWidth) / 100 * x;
        }

        if (y !== undefined) {
            y_px = (height - win.innerHeight) / 100 * y;
        }

        /*
        console.log(JSON.stringify({
            "x": x,
            "win.scrollX": win.scrollX,
            "win.innerWidth": win.innerWidth,
            "elem.scrollWidth": doc.documentElement.scrollWidth,
            "x_px": x_px,
            "y": y,
            "win.scrollY": win.scrollY,
            "win.innerHeight": win.innerHeight,
            "elem.scrollHeight": doc.documentElement.scrollHeight,
            "y_px": y_px,
        }));
        */

        win.scroll(x_px, y_px);
    }

    funcs.to_perc = (x, y) => {
        const elem = document.activeElement;
        // If we are in a frame, scroll that frame
        const scrolled = call_if_frame(elem,
            (frame_win) => scroll_to_perc(x, y, frame_win, frame_win.document));

        if (!scrolled) {
            // Scroll root window
            scroll_to_perc(x, y);
        }
    };

    // Scroll a provided window by x,y
    function scroll_window(x, y, win = window, page = true) {
        if (page) {
            const dx = win.innerWidth * x;
            const dy = win.innerHeight * y;
            win.scrollBy(dx, dy);
        } else {
            win.scrollBy(x, y);
        }
        return true;
    }

    funcs.delta_page = (x, y) => {
        const elem = document.activeElement;
        // If we are in a frame, scroll that frame
        const scrolled = call_if_frame(elem,
            (frame_win) => scroll_window(x, y, frame_win));

        if (!scrolled) {
            // Scroll root window
            scroll_window(x, y);
        }
    };

    funcs.delta_px = (x, y) => {
        const elem = document.activeElement;
        // If we are in a frame, scroll that frame
        const scrolled = call_if_frame(elem,
            (frame_win) => scroll_window(x, y, frame_win, false));

        if (!scrolled) {
            // Scroll root window
            scroll_window(x, y, window, false);
        }
    };

    return funcs;
})();
