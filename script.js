"use strict";

document.addEventListener("DOMContentLoaded", () => {
	const tabButtons = Array.from(document.querySelectorAll(".tab-button[data-target]"));
	const sections = Array.from(document.querySelectorAll(".algorithm-section"));
	const landingView = document.getElementById("landing-overview");
	const workspace = document.getElementById("algorithm-workspace");
	const workspaceHeading = document.getElementById("workspace-heading");
	const workspaceContext = document.getElementById("workspace-context");

	const sectionMeta = {
		"bitonic-section": {
			title: "Bitonic Sorting Network",
			context: "Explore deterministic compare-and-exchange layers in a structured sorting network.",
		},
		"fft-section": {
			title: "Efficient FFT Circuits",
			context: "Trace butterfly stages and frequency-flow structure in fast transform circuits.",
		},
		"miller-rabin-section": {
			title: "Miller-Rabin Primality Testing",
			context: "Study witness rounds and confidence progression in probabilistic primality checks.",
		},
	};

	if (!landingView || !workspace || tabButtons.length === 0 || sections.length === 0) {
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
		landingView.hidden = false;
		landingView.setAttribute("aria-hidden", "false");
		workspace.hidden = true;
		workspace.setAttribute("aria-hidden", "true");
		setActiveTab(null);
		document.body.classList.remove("workspace-open");

		if (workspaceHeading) {
			workspaceHeading.textContent = "Select an algorithm to begin";
		}

		if (workspaceContext) {
			workspaceContext.textContent = "Use the tabs above to open one visualization workspace at a time.";
		}
	}

	function showSection(sectionId) {
		const targetSection = document.getElementById(sectionId);
		if (!targetSection) {
			return;
		}

		const wasWorkspaceHidden = workspace.hidden;

		landingView.hidden = true;
		landingView.setAttribute("aria-hidden", "true");
		workspace.hidden = false;
		workspace.setAttribute("aria-hidden", "false");
		document.body.classList.add("workspace-open");

		sections.forEach((section) => {
			const isTarget = section.id === sectionId;
			section.hidden = !isTarget;
			section.setAttribute("aria-hidden", String(!isTarget));
			section.classList.toggle("is-active", isTarget);
		});

		setActiveTab(sectionId);

		if (workspaceHeading && sectionMeta[sectionId]) {
			workspaceHeading.textContent = sectionMeta[sectionId].title;
		}

		if (workspaceContext && sectionMeta[sectionId]) {
			workspaceContext.textContent = sectionMeta[sectionId].context;
		}

		if (wasWorkspaceHidden && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			workspace.scrollIntoView({ behavior: "smooth", block: "start" });
		}
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
