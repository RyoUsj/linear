'use strict';

const remote = require('electron').remote;
const browserWindow = remote.getCurrentWindow();
const dataStore = require('../../data-store');
const ipc = require('electron').ipcRenderer;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

let borders = {
	top: document.querySelector('.ruler__inner__border--top'),
	right: document.querySelector('.ruler__inner__border--right'),
	bottom: document.querySelector('.ruler__inner__border--bottom'),
	left: document.querySelector('.ruler__inner__border--left'),
};

let info = {
	width: document.querySelector('.ruler__inner__info__width'),
	height: document.querySelector('.ruler__inner__info__height')
};

let baseFontSize; // Used to calculate em.

// This object holds the different strategies for displaying units.
let unitStrategies = {

	/**
	 * Format into to pixels.
	 * @param  {px} px - The number of px to display.
	 * @return {String} A formatted string displaying px.
	 */
	px(px) {
		return `${px}px`;
	},

	/**
	 * Format into to em.
	 * @param  {px} px - The number of px to convert to em.
	 * @return {String} A formatted string displaying em.
	 */
	em(em) {
		return `${em/baseFontSize}em`;
	}
};

let displayStrategy;

/**
 * Load saved data from the `dataStore` and populate the view with it.
 */
function loadSettings() {
	let unit = dataStore.readSettings('unit') || 'px';
	baseFontSize = dataStore.readSettings('size') || '16';

	displayStrategy = unitStrategies[unit];
	updateMesures();
}

/**
 * Update the values in the view based on the `displayStrategy`.
 */
function updateMesures() {
	info.width.textContent = displayStrategy(borders.right.getBoundingClientRect().left - borders.left.getBoundingClientRect().left);
	info.height.textContent = displayStrategy(borders.bottom.getBoundingClientRect().top - borders.top.getBoundingClientRect().top);
}

let contextMenu = new Menu();
contextMenu.append(new MenuItem({
	label: 'Duplicate',

	// Duplicate the current ruler. We send position information to the main
	// process so that it can create a new window at the same spot.
	click: () => {
		let bounds = browserWindow.getBounds();
		let position = browserWindow.getPosition();

		ipc.send('duplicate-ruler', {
			x: position[0],
			y: position[1],
			width: bounds.width,
			height: bounds.height
		});
	}
}));

window.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  contextMenu.popup(remote.getCurrentWindow());
}, false);

document.querySelector('.ruler__inner__close').addEventListener('click', () => browserWindow.close());
document.querySelector('.ruler__inner__theme').addEventListener('click', () => {
	document.querySelector('.ruler__inner').classList.toggle('dark-theme');
});

window.addEventListener('resize', updateMesures);

ipc.on('settings-changed', loadSettings);

loadSettings();
