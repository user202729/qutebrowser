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

    const utils = window._qutebrowser.utils;

    function build_scroll_options(x, y, smooth) {
        return {
            "behavior": smooth
                ? "smooth"
                : "auto",
            "left": x,
            "top": y,
        };
    }

    function smooth_supported() {
        return "scrollBehavior" in document.documentElement.style;
    }

    // Helper function which scrolls the document 'doc' and window 'win' to x, y
    function scroll_to_perc(x, y, smooth, win, doc) {
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

        if (smooth_supported()) {
            win.scroll(build_scroll_options(x_px, y_px, smooth));
        } else {
            win.scroll(x_px, y_px);
        }
    }

    funcs.to_perc = (x, y, smooth) => {
        // If we are in a frame, scroll that frame
        const frame_win = utils.get_frame_window(document.activeElement);
        scroll_to_perc(x, y, smooth, frame_win, frame_win.document);
    };

    funcs.to_px = (x, y, smooth) => {
        const frame_win = utils.get_frame_window(document.activeElement);
        if (smooth_supported()) {
            frame_win.scroll(build_scroll_options(x, y, smooth));
        } else {
            frame_win.scroll(x, y);
        }
    };

    // Scroll a provided window by x,y as a percent
    function scroll_window(x, y, smooth, win) {
        const dx = win.innerWidth * x;
        const dy = win.innerHeight * y;
        if (smooth_supported()) {
            win.scrollBy(build_scroll_options(dx, dy, smooth));
        } else {
            win.scrollBy(dx, dy);
        }
    }

    funcs.delta_page = (x, y, smooth) => {
        const frame_win = utils.get_frame_window(document.activeElement);
        scroll_window(x, y, smooth, frame_win);
    };

    funcs.delta_px = (x, y, smooth) => {
        const frame_win = utils.get_frame_window(document.activeElement);
        // Scroll by raw pixels, rather than by page
        if (smooth_supported()) {
            frame_win.scrollBy(build_scroll_options(x, y, smooth));
        } else {
            frame_win.scrollBy(x, y);
        }
    };

    return funcs;
})();
