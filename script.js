"use strict";

document.addEventListener("DOMContentLoaded", () => {
	const tabButtons = Array.from(document.querySelectorAll(".tab-button[data-target]"));
	const sections = Array.from(document.querySelectorAll(".algorithm-section"));
	const workspace = document.getElementById("algorithm-workspace");

	if (!workspace || tabButtons.length === 0 || sections.length === 0) {
		return;
	}

	function setActiveTab(activeSectionId = null) {
		tabButtons.forEach((button) => {
			const isActive = button.dataset.target === activeSectionId;
			button.classList.toggle("is-active", isActive);
			button.setAttribute("aria-selected", String(isActive));
		});
	}

	function hideAllSections() {
		sections.forEach((section) => {
			section.hidden = true;
			section.setAttribute("aria-hidden", "true");
			section.classList.remove("is-active");
		});
	}

	function showOverview() {
		hideAllSections();
		workspace.hidden = true;
		workspace.setAttribute("aria-hidden", "true");
		setActiveTab(null);
	}

	function showSection(sectionId) {
		const targetSection = document.getElementById(sectionId);
		if (!targetSection) {
			return;
		}

		workspace.hidden = false;
		workspace.setAttribute("aria-hidden", "false");

		sections.forEach((section) => {
			const isTarget = section.id === sectionId;
			section.hidden = !isTarget;
			section.setAttribute("aria-hidden", String(!isTarget));
			section.classList.toggle("is-active", isTarget);
		});

		setActiveTab(sectionId);
	}

	tabButtons.forEach((button) => {
		button.addEventListener("click", () => {
			showSection(button.dataset.target);
		});
	});

	document.addEventListener("click", (event) => {
		const trigger = event.target.closest("[data-action='back-to-overview']");
		if (!trigger) {
			return;
		}

		event.preventDefault();
		showOverview();
	});

	// Exposed for future controls, including a Back to Overview button.
	window.algorithmShell = {
		showOverview,
		showSection,
	};

	showOverview();
});
