// @ts-check
/// <reference path="./types.d.ts" />
/// <reference path="../constants.js" />

/**
 * This class is meant to encapsulate the HTML user interface. It's meant to
 */
class UI {
	/**
	 * 
	 * 
	 * @param {UIMapping} mapping Indicates which HTML elements to use for each
	 * UI component. 
	 * @param {ConditionalStyleProperties} conditionalStyles Defines some style
	 * properties that should be set for specific elements when they are in
	 * a given condition. 
	 */
	constructor(mapping, conditionalStyles) {
		/**
		 * Maps the menu components to their associated HTML element in the 
		 * document.
		 * 
		 * @public
		 * @readonly
		 * @type {UIMapping}
		 */
		this.element = mapping

		/**
		 * Defines some style properties that should be set for specific 
		 * elements when they are in a given condition. 
		 */
		this.conditionalStyles = conditionalStyles

		/**
		 * A boolean flag to indicate whether or not the UI is currently
		 * in an animation. If it is, then it probably shouldn't accept any
		 * new inputs.
		 * 
		 * @private
		 * @type {boolean}
		 */
		this.inAnimation = false

		this.instructionsShown = false
		this.pauseMenuShown = false
	}

	/**
	 * The score that is displayed in the UI.
	 * 
	 * @param {number} newScore The updated score to display. This value will
	 * be rounded to the nearest integer.
	 */
	set score(newScore) {
		this.element.textDisplay.score.textContent = 
			Math.round(newScore).toString()
	}

	/**
	 * The survivor count that is displayed in the UI.
	 * 
	 * @param {number} newSurvivorCount The updated survivor count to display.
	 */
	set survivorCount(newSurvivorCount) {
		this.element.textDisplay.survivor.textContent =
			Math.round(newSurvivorCount).toString()
	}

	/**
	 * The coverage percentage that is displayed in the UI.
	 * 
	 * @param {number} newCoverage A number from `0` to `1` that represents the
	 * updated coverage to display.
	 */
	set coverage(newCoverage) {
		newCoverage = Math.floor(newCoverage * 100)
		this.element.textDisplay.survivor.textContent =
			`${newCoverage}%`
	}

	/**
	 * The remaining time displayed in the UI.
	 * 
	 * @param {number} newTimeRemaining The time remaining in milliseconds.
	 */
	set timeRemaining(newTimeRemaining) {
		const minutes = Math.floor(newTimeRemaining / 1000 / 60)
		const seconds = Math.floor(newTimeRemaining / 1000 - minutes * 60)

		this.element.textDisplay.survivor.textContent =
			`${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
	}

	/**
	 * Applies styles to an element. Optionally, this can be treated as an
	 * animation in which case a callback can be specified to be executed upon
	 * completion.
	 * 
	 * The most important change when indicating an animation is that no two
	 * animations will be allowed at the same time. I.e., if this function
	 * determines that there is currently an animation in progress, it will not
	 * start a new one (instead, the call will be ignored).
	 * 
	 * @param {HTMLElement} element The element to apply the styles to.
	 * @param {StyleProperty[]} newStyles The new style properties to apply to
	 * the element.
	 * @param {number | null} duration If not `null`, this value indicates that
	 * the style change is an animation of the given duration in milliseconds.
	 * In most cases, this is due to a `transition` style property on the 
	 * element.
	 * @param {(() => void) | null} uponCompletion A callback function to be
	 * executed once the animation (if there is one) is completed.
	 */
	applyStyles(element, newStyles, duration = null, uponCompletion = null) {
		const animation = duration != null

		if (animation && this.inAnimation) {
			return
		}

		newStyles.forEach(([ property, value ]) => {
			element.style.setProperty(property, value)
		})

		if (!animation) return

		this.inAnimation = true
		setTimeout(() => {
			this.inAnimation = false
			if (uponCompletion !== null) uponCompletion()
		}, duration)
	}

	/** 
	 * @param {(() => void) | null} uponCompletion An optional callback 
	 * function that will be executed when the animation finishes. 
	 */
	hidePauseMenu(uponCompletion = null) {
		this.applyStyles(
			this.element.menu.pause,
			this.conditionalStyles.pauseMenu.hidden,
			ANIMATION_TIME,
			uponCompletion
		)
		this.pauseMenuShown = false
	}

	showPauseMenu() {
		this.applyStyles(
			this.element.menu.pause,
			this.conditionalStyles.pauseMenu.shown,
			ANIMATION_TIME
		)
		this.pauseMenuShown = true
	}

	/**
	 * @param {(() => void) | null} uponCompletion An optional callback 
	 * function that will be executed when the animation finishes.
	 */
	hideInstructions(uponCompletion = null) {
		this.applyStyles(
			this.element.informationCard.instructions,
			this.conditionalStyles.infoPanel.hidden,
			ANIMATION_TIME,
			uponCompletion
		)
		this.instructionsShown = false
	}

	showInstructions() {
		this.applyStyles(
			this.element.informationCard.instructions,
			this.conditionalStyles.infoPanel.shown,
			ANIMATION_TIME
		)
		this.instructionsShown = true
	}

	get instructionsVisible() {
		return this.instructionsShown
	}

	get pauseMenuVisible() {
		return this.pauseMenuVisible
	}
}
