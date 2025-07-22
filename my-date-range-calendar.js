// my-date-range-calendar.js
// This file defines the custom element for the dual-calendar date range selector.
// It includes all HTML, CSS, and JavaScript for rendering and interaction.

class MyDateRangeCalendar extends HTMLElement {
    constructor() {
        super();
        // Attach a Shadow DOM to encapsulate the component's styles and markup.
        // This prevents conflicts with the host page's CSS and ensures self-contained behavior.
        this.attachShadow({ mode: 'open' });

        // --- Component State Variables ---
        // Stores the first selected date (delivery date).
        this.selectedDeliveryDate = null;
        // Stores the second selected date (pickup date).
        this.selectedPickupDate = null;
        // Stores the date currently being hovered over for live range highlighting.
        this.hoverDate = null;

        // Initialize current month and year for both calendars.
        // Calendar 1 starts with the current month.
        const today = new Date();
        this.currentMonth1 = today.getMonth();
        this.currentYear1 = today.getFullYear();

        // Calendar 2 starts with the next month.
        // Create a new Date object to avoid modifying 'today' directly when setting month.
        const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        this.currentMonth2 = nextMonthDate.getMonth();
        this.currentYear2 = nextMonthDate.getFullYear();

        // Arrays for month and day names for display.
        this.monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        this.dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        // Initial render of the component's structure into the Shadow DOM.
        this.render();
    }

    /**
     * connectedCallback is a lifecycle method called when the custom element
     * is inserted into the DOM. It's a good place to perform initial rendering
     * and attach event listeners.
     */
    connectedCallback() {
        // Update the display to render the calendars with initial state.
        this.updateDisplay();

        // Attach event listeners to the navigation buttons within the Shadow DOM.
        // Use arrow functions or .bind(this) to ensure 'this' context refers to the class instance.
        this.shadowRoot.getElementById('prevMonth1').addEventListener('click', () => this.navigateMonth(1, -1));
        this.shadowRoot.getElementById('nextMonth1').addEventListener('click', () => this.navigateMonth(1, 1));
        this.shadowRoot.getElementById('prevMonth2').addEventListener('click', () => this.navigateMonth(2, -1));
        this.shadowRoot.getElementById('nextMonth2').addEventListener('click', () => this.navigateMonth(2, 1));
    }

    /**
     * render() sets up the static HTML structure and CSS within the Shadow DOM.
     * This is called once in the constructor.
     */
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                /* --- Component-Specific CSS for Aesthetics and Responsiveness --- */
                :host {
                    /* Ensures the custom element behaves as a block-level container */
                    display: block;
                    font-family: 'Inter', sans-serif; /* Using Inter font for a clean look */
                    /* Add some padding around the entire component */
                    padding: 10px;
                }

                .calendar-container {
                    display: flex; /* Use flexbox for side-by-side calendars */
                    gap: 20px; /* Space between the two calendars */
                    margin-bottom: 20px;
                    justify-content: center; /* Center the calendars horizontally */
                    flex-wrap: wrap; /* Allow calendars to wrap to new line on smaller screens */
                    max-width: 100%; /* Ensure container doesn't overflow */
                }

                .calendar-wrapper {
                    background-color: #fff;
                    border-radius: 12px; /* Rounded corners for the calendar boxes */
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1); /* Soft shadow for depth */
                    padding: 20px;
                    flex: 1 1 300px; /* Allow calendars to grow/shrink, min-width 300px */
                    min-width: 280px; /* Ensure calendars don't get too small */
                    max-width: 380px; /* Prevent calendars from becoming too wide */
                    box-sizing: border-box; /* Include padding/border in element's total width/height */
                }

                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }

                .calendar-header h2 {
                    margin: 0;
                    font-size: 1.3em; /* Slightly smaller font for compactness */
                    color: #333;
                    font-weight: 600; /* Semi-bold for month/year */
                }

                .calendar-header button {
                    background-color: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 14px; /* Slightly adjusted padding for buttons */
                    border-radius: 8px; /* Rounded corners for buttons */
                    cursor: pointer;
                    font-size: 1.1em;
                    transition: background-color 0.2s ease, transform 0.1s ease;
                    box-shadow: 0 2px 5px rgba(0, 123, 255, 0.3); /* Button shadow */
                }

                .calendar-header button:hover {
                    background-color: #0056b3;
                    transform: translateY(-1px); /* Slight lift effect on hover */
                }

                .calendar-header button:active {
                    transform: translateY(0); /* Press effect */
                    box-shadow: 0 1px 3px rgba(0, 123, 255, 0.4);
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr); /* 7 columns for days of the week */
                    gap: 4px; /* Slightly smaller gap for compactness */
                }

                .calendar-grid div {
                    text-align: center;
                    padding: 8px 0; /* Vertical padding, horizontal handled by grid */
                    border-radius: 6px; /* Rounded corners for day cells */
                    cursor: pointer;
                    transition: background-color 0.1s ease, color 0.1s ease;
                    font-size: 0.95em;
                    font-weight: 500; /* Medium weight for day numbers */
                }

                .calendar-grid .day-name {
                    font-weight: bold;
                    color: #666;
                    cursor: default;
                    padding-bottom: 10px; /* More space below day names */
                }

                .calendar-grid .day {
                    background-color: #f8f8f8; /* Light background for normal days */
                    color: #333;
                }

                .calendar-grid .day:hover:not(.empty):not(.past-day):not(.selected-delivery):not(.selected-pickup):not(.in-range):not(.hover-range) {
                    background-color: #e9e9e9; /* Lighter hover for normal days */
                }

                .calendar-grid .empty {
                    visibility: hidden; /* Hide empty cells */
                    cursor: default;
                }

                .calendar-grid .past-day {
                    background-color: #e0e0e0; /* Gray out past days */
                    color: #a0a0a0; /* Lighter text for past days */
                    cursor: not-allowed; /* Indicate non-interactable */
                }

                .calendar-grid .current-day {
                    border: 2px solid #007bff; /* Blue border for today */
                    background-color: #e0f0ff; /* Light blue background for today */
                    font-weight: bold;
                }

                /* Styling for selected dates */
                .calendar-grid .selected-delivery,
                .calendar-grid .selected-pickup {
                    background-color: #28a745 !important; /* Green for selected dates */
                    color: white !important;
                    font-weight: bold;
                    box-shadow: 0 2px 5px rgba(40, 167, 69, 0.3); /* Shadow for selected */
                }

                /* Styling for the range between selected dates */
                .calendar-grid .in-range {
                    background-color: #90ee90; /* Light green for the selected range */
                    color: #333; /* Darker text for readability in range */
                    border-radius: 0; /* Square corners for range to blend */
                }
                /* Special styling for start/end of range to keep rounded corners */
                .calendar-grid .selected-delivery.in-range {
                    border-top-left-radius: 6px;
                    border-bottom-left-radius: 6px;
                }
                .calendar-grid .selected-pickup.in-range {
                    border-top-right-radius: 6px;
                    border-bottom-right-radius: 6px;
                }
                /* If only one day is selected, it's both start and end */
                .calendar-grid .selected-delivery.selected-pickup {
                    border-radius: 6px;
                }


                /* Styling for the hover-over range (when only delivery date is selected) */
                .calendar-grid .hover-range {
                    background-color: #d1ecf1; /* Light blue for hover range */
                    color: #333;
                    border-radius: 0;
                }
                /* Ensure hover start/end have rounded corners */
                .calendar-grid .selected-delivery.hover-range {
                    border-top-left-radius: 6px;
                    border-bottom-left-radius: 6px;
                }
                /* If hover is the only selection */
                .calendar-grid .day.hover-range:first-of-type { /* This is tricky for first day of hover range */
                    border-top-left-radius: 6px;
                    border-bottom-left-radius: 6px;
                }
                .calendar-grid .day.hover-range:last-of-type { /* This is tricky for last day of hover range */
                    border-top-right-radius: 6px;
                    border-bottom-right-radius: 6px;
                }


                .selection-info {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 1.05em;
                    color: #555;
                    padding: 10px;
                    background-color: #e9f5ff; /* Light blue background for info */
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                #selectedRangeDisplay {
                    font-weight: bold;
                    color: #007bff;
                }

                #dayCountDisplay {
                    font-weight: bold;
                    color: #28a745;
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .calendar-container {
                        flex-direction: column; /* Stack calendars vertically */
                        align-items: center; /* Center them when stacked */
                    }
                    .calendar-wrapper {
                        max-width: 95%; /* Allow calendars to take more width when stacked */
                    }
                }
            </style>

            <div class="calendar-container">
                <div class="calendar-wrapper">
                    <div class="calendar-header">
                        <button id="prevMonth1" aria-label="Previous Month">&lt;</button>
                        <h2 id="monthYearDisplay1"></h2>
                        <button id="nextMonth1" aria-label="Next Month">&gt;</button>
                    </div>
                    <div class="calendar-grid" id="calendarGrid1"></div>
                </div>

                <div class="calendar-wrapper">
                    <div class="calendar-header">
                        <button id="prevMonth2" aria-label="Previous Month">&lt;</button>
                        <h2 id="monthYearDisplay2"></h2>
                        <button id="nextMonth2" aria-label="Next Month">&gt;</button>
                    </div>
                    <div class="calendar-grid" id="calendarGrid2"></div>
                </div>
            </div>

            <div class="selection-info">
                <p>Selected Range: <span id="selectedRangeDisplay">No dates selected</span></p>
                <p>Number of Days: <span id="dayCountDisplay">0</span></p>
            </div>
        `;
    }

    /**
     * Generates and renders a single calendar grid for a given month and year.
     * @param {number} month - The month (0-11).
     * @param {number} year - The full year.
     * @param {string} calendarId - The ID of the HTML element where the calendar grid will be rendered.
     */
    generateCalendar(month, year, calendarId) {
        const gridElement = this.shadowRoot.getElementById(calendarId);
        if (!gridElement) {
            console.error(`Calendar grid element with ID ${calendarId} not found.`);
            return;
        }
        gridElement.innerHTML = ''; // Clear previous days

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const numDaysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.

        // Get today's date at midnight for comparison to disable past dates.
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);

        // Add day names (Sun, Mon, Tue, etc.) to the grid.
        this.dayNames.forEach(day => {
            const dayNameDiv = document.createElement('div');
            dayNameDiv.classList.add('day-name');
            dayNameDiv.textContent = day;
            gridElement.appendChild(dayNameDiv);
        });

        // Add empty divs for the days before the 1st of the month to align correctly.
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('empty');
            gridElement.appendChild(emptyDiv);
        }

        // Add actual day numbers to the calendar grid.
        for (let i = 1; i <= numDaysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day');
            dayDiv.textContent = i;
            // Store the full ISO date string in a data attribute for easy retrieval.
            const currentDate = new Date(year, month, i);
            dayDiv.dataset.date = currentDate.toISOString();

            // Check if the current day is 'today'.
            if (currentDate.toDateString() === new Date().toDateString()) {
                dayDiv.classList.add('current-day');
            }

            // Disable past dates: If the current date is before today's midnight, mark as past-day.
            if (currentDate < todayAtMidnight) {
                dayDiv.classList.add('past-day');
                // Do NOT attach event listeners for past days.
            } else {
                // Attach event listeners for clickable/hoverable days.
                dayDiv.addEventListener('click', this.handleDayClick.bind(this));
                dayDiv.addEventListener('mouseover', this.handleDayHover.bind(this));
            }

            // Apply styling based on current selection/hover state.
            this.applyRangeStyles(dayDiv, currentDate);
            gridElement.appendChild(dayDiv);
        }

        // Update the month and year display in the header.
        if (calendarId === 'calendarGrid1') {
            this.shadowRoot.getElementById('monthYearDisplay1').textContent = `${this.monthNames[month]} ${year}`;
        } else {
            this.shadowRoot.getElementById('monthYearDisplay2').textContent = `${this.monthNames[month]} ${year}`;
        }
    }

    /**
     * Applies CSS classes to a day element based on its selection and hover state.
     * @param {HTMLElement} dayDiv - The div element representing a day.
     * @param {Date} currentDate - The Date object for the day.
     */
    applyRangeStyles(dayDiv, currentDate) {
        const dateISO = currentDate.toISOString();

        // Remove all previous range-related classes to ensure correct state.
        dayDiv.classList.remove('selected-delivery', 'selected-pickup', 'in-range', 'hover-range');

        // Apply 'selected-delivery' class if this day is the delivery date.
        if (this.selectedDeliveryDate && dateISO === this.selectedDeliveryDate.toISOString()) {
            dayDiv.classList.add('selected-delivery');
        }
        // Apply 'selected-pickup' class if this day is the pickup date.
        if (this.selectedPickupDate && dateISO === this.selectedPickupDate.toISOString()) {
            dayDiv.classList.add('selected-pickup');
        }

        // Apply 'in-range' class if both delivery and pickup dates are selected,
        // and the current date falls within that range.
        if (this.selectedDeliveryDate && this.selectedPickupDate) {
            // Ensure start is always before end for range calculation.
            const rangeStart = this.minDate(this.selectedDeliveryDate, this.selectedPickupDate);
            const rangeEnd = this.maxDate(this.selectedDeliveryDate, this.selectedPickupDate);

            if (currentDate >= rangeStart && currentDate <= rangeEnd) {
                dayDiv.classList.add('in-range');
            }
        }

        // Apply 'hover-range' class if only the delivery date is selected
        // and the user is hovering over another date (previewing the range).
        if (this.selectedDeliveryDate && !this.selectedPickupDate && this.hoverDate) {
            const hoverRangeStart = this.minDate(this.selectedDeliveryDate, this.hoverDate);
            const hoverRangeEnd = this.maxDate(this.selectedDeliveryDate, this.hoverDate);

            if (currentDate >= hoverRangeStart && currentDate <= hoverRangeEnd) {
                dayDiv.classList.add('hover-range');
            }
        }
    }

    /**
     * Handles a click event on a day cell. Manages the selection of delivery and pickup dates.
     * @param {Event} event - The click event.
     */
    handleDayClick(event) {
        // Prevent interaction with past or empty days.
        if (event.target.classList.contains('past-day') || event.target.classList.contains('empty')) {
            return;
        }

        const clickedDate = new Date(event.target.dataset.date);

        // Scenario 1: No dates selected, or a full range is already selected (reset).
        if (!this.selectedDeliveryDate || (this.selectedDeliveryDate && this.selectedPickupDate)) {
            this.selectedDeliveryDate = clickedDate;
            this.selectedPickupDate = null; // Clear pickup date
            this.hoverDate = null; // Clear hover state
        }
        // Scenario 2: Only delivery date is selected, now setting pickup date.
        else if (this.selectedDeliveryDate) {
            this.selectedPickupDate = clickedDate;
            this.hoverDate = null; // Clear hover state once range is finalized.

            // Ensure delivery is logically before pickup for output, even if clicked out of order.
            const finalDeliveryDate = this.minDate(this.selectedDeliveryDate, this.selectedPickupDate);
            const finalPickupDate = this.maxDate(this.selectedDeliveryDate, this.selectedPickupDate);
            const finalDayCount = this.calculateDaysBetween(finalDeliveryDate, finalPickupDate);

            // Dispatch a custom event to communicate the selected range to the host page.
            this.dispatchEvent(new CustomEvent('dateRangeSelected', {
                detail: {
                    deliveryDate: finalDeliveryDate.toISOString(),
                    pickupDate: finalPickupDate.toISOString(),
                    numberOfDays: finalDayCount
                },
                bubbles: true, // Allow event to bubble up through the DOM tree
                composed: true // Allow event to cross the Shadow DOM boundary
            }));
        }
        // Re-render calendars to reflect the new selection state.
        this.updateDisplay();
    }

    /**
     * Handles a mouseover (hover) event on a day cell. Used for live range preview.
     * @param {Event} event - The mouseover event.
     */
    handleDayHover(event) {
        // Only show hover effect if a delivery date is selected but not yet a pickup date.
        // Also, prevent hover on past or empty days.
        if (this.selectedDeliveryDate && !this.selectedPickupDate &&
            !event.target.classList.contains('past-day') && !event.target.classList.contains('empty')) {
            this.hoverDate = new Date(event.target.dataset.date);
            this.updateDisplay(); // Re-render to show the hover highlight.
        }
    }

    /**
     * Updates the entire calendar display, regenerating both grids and updating info.
     */
    updateDisplay() {
        // Regenerate both calendars to apply any new styles or date states.
        this.generateCalendar(this.currentMonth1, this.currentYear1, 'calendarGrid1');
        this.generateCalendar(this.currentMonth2, this.currentYear2, 'calendarGrid2');

        // Get references to the display elements in the Shadow DOM.
        const selectedRangeDisplay = this.shadowRoot.getElementById('selectedRangeDisplay');
        const dayCountDisplay = this.shadowRoot.getElementById('dayCountDisplay');

        let displayRange = 'No dates selected';
        let dayCount = 0;

        // Determine what to display based on current selection state.
        if (this.selectedDeliveryDate && this.selectedPickupDate) {
            // Both dates selected: show finalized range.
            const [start, end] = this.selectedDeliveryDate <= this.selectedPickupDate
                ? [this.selectedDeliveryDate, this.selectedPickupDate]
                : [this.selectedPickupDate, this.selectedDeliveryDate];

            displayRange = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
            dayCount = this.calculateDaysBetween(start, end);
        } else if (this.selectedDeliveryDate && this.hoverDate) {
            // Only delivery selected, hovering over a potential pickup date: show preview range.
            const [start, end] = this.selectedDeliveryDate <= this.hoverDate
                ? [this.selectedDeliveryDate, this.hoverDate]
                : [this.hoverDate, this.selectedDeliveryDate];

            displayRange = `${start.toLocaleDateString()} - ${end.toLocaleDateString()} (hovering)`;
            dayCount = this.calculateDaysBetween(start, end);
        } else if (this.selectedDeliveryDate) {
            // Only delivery date selected: indicate selection in progress.
            displayRange = `${this.selectedDeliveryDate.toLocaleDateString()} (selecting...)`;
            dayCount = 1;
        }

        // Update the text content of the display elements, checking for null.
        if (selectedRangeDisplay) selectedRangeDisplay.textContent = displayRange;
        if (dayCountDisplay) dayCountDisplay.textContent = dayCount;
    }

    /**
     * Calculates the number of days between two dates (inclusive).
     * @param {Date} startDate - The start date.
     * @param {Date} endDate - The end date.
     * @returns {number} The number of days.
     */
    calculateDaysBetween(startDate, endDate) {
        const oneDay = 24 * 60 * 60 * 1000; // Milliseconds in a day
        // Calculate the difference in days, rounding to handle time differences.
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / oneDay); // Use ceil to ensure full days are counted

        return diffDays + 1; // Add 1 to include both the start and end day
    }

    /**
     * Helper to get the earlier of two dates.
     * @param {Date} date1
     * @param {Date} date2
     * @returns {Date} The earlier date.
     */
    minDate(date1, date2) {
        return date1 < date2 ? date1 : date2;
    }

    /**
     * Helper to get the later of two dates.
     * @param {Date} date1
     * @param {Date} date2
     * @returns {Date} The later date.
     */
    maxDate(date1, date2) {
        return date1 > date2 ? date1 : date2;
    }

    /**
     * Navigates the specified calendar forward or backward by one month.
     * @param {number} calendarNum - 1 for the first calendar, 2 for the second.
     * @param {number} direction - -1 for previous month, 1 for next month.
     */
    navigateMonth(calendarNum, direction) {
        if (calendarNum === 1) {
            // Update month and year for the first calendar.
            this.currentMonth1 += direction;
            if (this.currentMonth1 < 0) {
                this.currentMonth1 = 11;
                this.currentYear1--;
            } else if (this.currentMonth1 > 11) {
                this.currentMonth1 = 0;
                this.currentYear1++;
            }
            // Ensure the second calendar remains consecutive to the first.
            const tempDate = new Date(this.currentYear1, this.currentMonth1 + 1, 1);
            this.currentMonth2 = tempDate.getMonth();
            this.currentYear2 = tempDate.getFullYear();

        } else { // calendarNum === 2
            // Update month and year for the second calendar.
            this.currentMonth2 += direction;
            if (this.currentMonth2 < 0) {
                this.currentMonth2 = 11;
                this.currentYear2--;
            } else if (this.currentMonth2 > 11) {
                this.currentMonth2 = 0;
                this.currentYear2++;
            }
            // Ensure the first calendar remains consecutive to the second.
            const tempDate = new Date(this.currentYear2, this.currentMonth2 - 1, 1);
            this.currentMonth1 = tempDate.getMonth();
            this.currentYear1 = tempDate.getFullYear();
        }
        // Re-render the display with the new month/year.
        this.updateDisplay();
    }
}

// Define the custom element with its tag name.
// This name must be unique and contain a hyphen.
customElements.define('my-date-range-calendar', MyDateRangeCalendar);
