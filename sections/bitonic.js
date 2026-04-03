"use strict";

document.addEventListener("DOMContentLoaded", () => {
	const root = document.getElementById("bitonic-section");
	if (!root) {
		return;
	}

	const el = {
		customInput: document.getElementById("bitonic-custom-input"),
		speedSlider: document.getElementById("bitonic-speed-slider"),
		buildBtn: document.getElementById("bitonic-build-btn"),
		stepBtn: document.getElementById("bitonic-step-btn"),
		playBtn: document.getElementById("bitonic-play-btn"),
		pauseBtn: document.getElementById("bitonic-pause-btn"),
		resetBtn: document.getElementById("bitonic-reset-btn"),

		presetBalanced: document.getElementById("bitonic-preset-balanced"),
		presetNearlySorted: document.getElementById("bitonic-preset-nearly-sorted"),
		presetReverse: document.getElementById("bitonic-preset-reverse"),
		presetZeroOne: document.getElementById("bitonic-preset-zero-one"),
		presetWorst: document.getElementById("bitonic-preset-worst"),
		presetRandom: document.getElementById("bitonic-preset-random"),

		statusBadge: document.getElementById("bitonic-status-badge"),
		statusText: document.getElementById("bitonic-status-text"),
		stepCounter: document.getElementById("bitonic-step-counter"),

		counterN: document.getElementById("bitonic-counter-n"),
		counterTotalComparators: document.getElementById("bitonic-counter-total-comparators"),
		counterProcessedComparators: document.getElementById("bitonic-counter-processed-comparators"),
		counterTotalDepth: document.getElementById("bitonic-counter-total-depth"),
		counterSwaps: document.getElementById("bitonic-counter-swaps"),
		counterStage: document.getElementById("bitonic-counter-stage"),

		pseudocode: document.getElementById("bitonic-pseudocode"),
		explanation: document.getElementById("bitonic-step-explanation"),
		historyBody: document.getElementById("bitonic-history-body"),
		visualAction: document.getElementById("bitonic-visual-action"),

		infoStrip: document.getElementById("bitonic-info-strip"),
		infoAction: document.getElementById("bitonic-info-action"),
		infoComparator: document.getElementById("bitonic-info-comparator"),
		infoValues: document.getElementById("bitonic-info-values"),
		infoStage: document.getElementById("bitonic-info-stage"),

		svg: document.getElementById("bitonic-svg"),

		zeroOneSize: document.getElementById("bitonic-zero-one-size"),
		zeroOneRun: document.getElementById("bitonic-zero-one-run"),
		zeroOneResult: document.getElementById("bitonic-zero-one-result"),

		compareBitonicCount: document.getElementById("bitonic-compare-bitonic-count"),
		compareBitonicDepth: document.getElementById("bitonic-compare-bitonic-depth"),
		compareOddEvenCount: document.getElementById("bitonic-compare-odd-even-count"),
		compareOddEvenDepth: document.getElementById("bitonic-compare-odd-even-depth"),
		comparisonText: document.getElementById("bitonic-comparison-text"),

		worstCaseExplanation: document.getElementById("bitonic-worst-case-explanation"),
	};

	const required = [
		"customInput",
		"speedSlider",
		"buildBtn",
		"stepBtn",
		"playBtn",
		"pauseBtn",
		"resetBtn",
		"statusBadge",
		"statusText",
		"stepCounter",
		"counterN",
		"counterTotalComparators",
		"counterProcessedComparators",
		"counterTotalDepth",
		"counterSwaps",
		"counterStage",
		"pseudocode",
		"explanation",
		"historyBody",
		"visualAction",
		"infoStrip",
		"infoAction",
		"infoComparator",
		"infoValues",
		"infoStage",
		"svg",
		"zeroOneSize",
		"zeroOneRun",
		"zeroOneResult",
		"compareBitonicCount",
		"compareBitonicDepth",
		"compareOddEvenCount",
		"compareOddEvenDepth",
		"comparisonText",
		"worstCaseExplanation",
	];

	if (required.some((key) => !el[key])) {
		return;
	}

	const SVG_NS = "http://www.w3.org/2000/svg";
	const PSEUDOCODE = [
		"function bitonicSort(A, n):",
		"  for k = 2; k <= n; k *= 2:",
		"    for j = k / 2; j > 0; j /= 2:",
		"      for i = 0; i < n; i++ in parallel:",
		"        l = i XOR j",
		"        if l > i:",
		"          dir = ((i & k) == 0) ? ASC : DESC",
		"          compareSwap(A, i, l, dir)",
		"function compareSwap(A, i, j, dir):",
		"  if dir == ASC and A[i] > A[j]: swap(A[i], A[j])",
		"  if dir == DESC and A[i] < A[j]: swap(A[i], A[j])",
		"function bitonicMerge works through fixed compare distances",
	];

	const PRESETS = {
		balanced: {
			label: "Balanced 8-value set",
			values: [8, 3, 6, 1, 4, 7, 2, 5],
			note: "Balanced values produce a clear mix of swaps and non-swaps.",
		},
		nearlySorted: {
			label: "Nearly sorted 16-value set",
			values: [1, 2, 3, 4, 5, 6, 8, 7, 9, 10, 12, 11, 13, 14, 15, 16],
			note: "Nearly sorted still traverses the same fixed network, showing data-oblivious behavior.",
		},
		reverse: {
			label: "Reverse ordered set",
			values: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
			note: "Reverse order is helpful for seeing long correction chains in early stages.",
		},
		zeroOne: {
			label: "0-1 principle example",
			values: [1, 0, 1, 1, 0, 0, 1, 0],
			note: "Binary inputs make it easier to reason about the 0-1 Principle.",
		},
		worstCase: {
			label: "Worst-case teaching set",
			values: [16, 1, 15, 2, 14, 3, 13, 4, 12, 5, 11, 6, 10, 7, 9, 8],
			note: "Even difficult arrangements pass through the entire fixed comparator schedule.",
		},
	};

	const state = {
		network: null,
		steps: [],
		stepIndex: 0,
		isPlaying: false,
		playTimer: null,
		currentInput: [],
		selectedPreset: "balanced",
	};

	function isPowerOfTwo(value) {
		return value > 0 && (value & (value - 1)) === 0;
	}

	function parseInput(rawText) {
		if (!rawText || !rawText.trim()) {
			return { ok: false, error: "Please enter comma-separated numeric values first." };
		}

		const tokens = rawText
			.split(/[,\n\s]+/)
			.map((token) => token.trim())
			.filter(Boolean);

		if (tokens.length === 0) {
			return { ok: false, error: "No values were found. Use comma-separated numbers." };
		}

		const values = [];
		for (const token of tokens) {
			const number = Number(token);
			if (!Number.isFinite(number)) {
				return { ok: false, error: `Invalid token '${token}'. Use only numeric values.` };
			}
			values.push(number);
		}

		const n = values.length;
		if (!isPowerOfTwo(n) || n < 4 || n > 16) {
			return {
				ok: false,
				error: "Bitonic network view supports power-of-two lengths 4, 8, or 16.",
			};
		}

		return { ok: true, values };
	}

	function formatNumber(value) {
		if (Number.isInteger(value)) {
			return String(value);
		}
		return String(Number(value.toFixed(3)));
	}

	function formatArray(values) {
		return `[${values.map((value) => formatNumber(value)).join(", ")}]`;
	}

	function setStatus(label, details) {
		el.statusBadge.textContent = label;
		el.statusText.textContent = details;
	}

	function setVisualAction(text) {
		if (!el.visualAction) {
			return;
		}
		el.visualAction.textContent = text;
	}

	function updateInfoStrip(step) {
		if (!step || step.type !== "compare") {
			el.infoAction.textContent = "—";
			el.infoComparator.textContent = "—";
			el.infoValues.textContent = "—";
			el.infoStage.textContent = "—";
			return;
		}

		const cmpStr = step.comparator ? `i${step.comparator.i} ↔ i${step.comparator.j}` : "—";
		const valStr = step.comparedValues ? `${formatNumber(step.comparedValues.left)} vs ${formatNumber(step.comparedValues.right)}` : "—";
		const actionStr = step.swapped ? "SWAP" : "NO SWAP";
		const dirStr = (step.directionText || "ascending").toUpperCase();
		const stageStr = step.stageMeta ? `S${step.stageIndex + 1} | block ${step.blockSize}, distance ${step.compareDistance}` : "—";

		el.infoAction.textContent = `${dirStr} → ${actionStr}`;
		el.infoComparator.textContent = cmpStr;
		el.infoValues.textContent = valStr;
		el.infoStage.textContent = stageStr;
	}

	function getTokenX(step, canvasLeft, stageGap, canvasRight) {
		const depth = state.network.depth;
		if (!state.network || step.type === "init") {
			return canvasLeft;
		}
		if (step.type === "done") {
			return canvasRight;
		}
		if (step.stageIndex < 0) {
			return canvasLeft;
		}
		return canvasLeft + step.stageIndex * stageGap + stageGap / 2;
	}

	function renderPseudocode(activeLine) {
		el.pseudocode.textContent = "";

		const fragment = document.createDocumentFragment();
		PSEUDOCODE.forEach((line, index) => {
			const lineNo = index + 1;
			const row = document.createElement("span");
			row.className = "bitonic-pseudocode-line";
			if (activeLine === lineNo) {
				row.classList.add("is-active");
			}

			const no = document.createElement("span");
			no.className = "line-no";
			no.textContent = String(lineNo);

			const text = document.createElement("span");
			text.textContent = line;

			row.appendChild(no);
			row.appendChild(text);
			fragment.appendChild(row);
		});

		el.pseudocode.appendChild(fragment);
	}

	function updateComparisonCard(n, bitonicNetwork) {
		const logN = Math.log2(n);
		const oddEvenComparators = Math.round((n * logN * (logN - 1)) / 4 + (n - 1));
		const oddEvenDepth = Math.round((logN * (logN + 1)) / 2);

		el.compareBitonicCount.textContent = String(bitonicNetwork.comparatorCount);
		el.compareBitonicDepth.textContent = String(bitonicNetwork.depth);
		el.compareOddEvenCount.textContent = String(oddEvenComparators);
		el.compareOddEvenDepth.textContent = String(oddEvenDepth);

		el.comparisonText.textContent =
			"Both are O(n log^2 n) depth-family networks. Bitonic is often simpler to visualize, while odd-even merge typically uses fewer comparators at the same n.";
	}

	function generateBitonicNetwork(n) {
		const stages = [];
		const stageMeta = [];
		let globalComparatorIndex = 0;

		for (let k = 2; k <= n; k *= 2) {
			for (let distance = k / 2; distance > 0; distance = Math.floor(distance / 2)) {
				const stageIndex = stages.length;
				const stage = [];

				for (let i = 0; i < n; i += 1) {
					const j = i ^ distance;
					if (j > i) {
						const dir = (i & k) === 0 ? "asc" : "desc";
						globalComparatorIndex += 1;
						stage.push({
							i,
							j,
							dir,
							stageIndex,
							distance,
							blockSize: k,
							globalIndex: globalComparatorIndex,
							label: `(${i}, ${j}) ${dir.toUpperCase()}`,
						});
					}
				}

				stages.push(stage);
				stageMeta.push({
					stageIndex,
					distance,
					blockSize: k,
				});
			}
		}

		const comparatorCount = stages.reduce((sum, stage) => sum + stage.length, 0);

		return {
			n,
			stages,
			stageMeta,
			comparatorCount,
			depth: stages.length,
		};
	}

	function bitonicStageNote(meta) {
		if (!meta) {
			return "Preparing the network.";
		}

		if (meta.distance === meta.blockSize / 2) {
			return `Stage builds bitonic blocks of size ${meta.blockSize}.`;
		}

		if (meta.distance === 1) {
			return `Final local merge pass for block size ${meta.blockSize}.`;
		}

		return `Merge refinement inside size-${meta.blockSize} blocks at compare distance ${meta.distance}.`;
	}

	function buildSteps(inputValues, network) {
		const arr = inputValues.slice();
		const steps = [];
		let swapsSoFar = 0;

		steps.push({
			type: "init",
			array: arr.slice(),
			stageIndex: -1,
			comparatorIndex: -1,
			comparator: null,
			swapped: false,
			processedComparators: 0,
			swapsSoFar,
			totalComparators: network.comparatorCount,
			totalDepth: network.depth,
			pseudoLine: 1,
			stageMeta: null,
			actionSummary: "Network ready. Wiring is fixed, and value flow will begin at stage 1.",
			explanation:
				"Network built. Wiring is fixed and data-oblivious: only values change while comparator structure stays constant.",
			bitonicNote: "Start with input values at wire entrances.",
		});

		network.stages.forEach((stage, stageIndex) => {
			const meta = network.stageMeta[stageIndex];
			stage.forEach((comparator, comparatorIndex) => {
				const leftValue = arr[comparator.i];
				const rightValue = arr[comparator.j];
				const wantsAscending = comparator.dir === "asc";
				const shouldSwap = wantsAscending ? leftValue > rightValue : leftValue < rightValue;
				const groupStart = Math.floor(comparator.i / meta.blockSize) * meta.blockSize;
				const groupEnd = groupStart + meta.blockSize - 1;

				if (shouldSwap) {
					arr[comparator.i] = rightValue;
					arr[comparator.j] = leftValue;
					swapsSoFar += 1;
				}

				const directionText = wantsAscending ? "ascending" : "descending";
				const pairText = `indices ${comparator.i} and ${comparator.j}`;
				const actionText = shouldSwap
					? `Swap needed (${formatNumber(leftValue)} and ${formatNumber(rightValue)} are out of ${directionText} order).`
					: `No swap (${formatNumber(leftValue)} and ${formatNumber(rightValue)} already satisfy ${directionText} order).`;

				steps.push({
					type: "compare",
					array: arr.slice(),
					stageIndex,
					comparatorIndex,
					comparator,
					swapped: shouldSwap,
					processedComparators: comparator.globalIndex,
					swapsSoFar,
					totalComparators: network.comparatorCount,
					totalDepth: network.depth,
					stageMeta: meta,
					groupRange: { start: groupStart, end: groupEnd },
					comparedValues: { left: leftValue, right: rightValue },
					directionText,
					actionSummary: `Comparing i=${comparator.i} and j=${comparator.j} in ${directionText} order: ${shouldSwap ? "swap" : "no swap"}.`,
					pseudoLine: wantsAscending ? 10 : 11,
					explanation: `Stage ${stageIndex + 1}, compare ${pairText} in ${directionText} direction. ${actionText}`,
					bitonicNote: bitonicStageNote(meta),
					// Animation metadata
					animationPhase: "transition",
					blockStart: groupStart,
					blockSize: meta.blockSize,
					compareDistance: meta.distance,
					stageLabel: `S${stageIndex + 1}`,
					actionType: shouldSwap ? "swap" : "compare",
				});
			});
		});

		steps.push({
			type: "done",
			array: arr.slice(),
			stageIndex: network.depth - 1,
			comparatorIndex: -1,
			comparator: null,
			swapped: false,
			processedComparators: network.comparatorCount,
			swapsSoFar,
			totalComparators: network.comparatorCount,
			totalDepth: network.depth,
			stageMeta: network.stageMeta[network.stageMeta.length - 1] || null,
			actionSummary: "All stages complete. Final output is sorted after the full fixed comparator schedule.",
			pseudoLine: 2,
			explanation:
				"All fixed comparators have executed. Output is sorted while network structure remained unchanged for every data value.",
			bitonicNote: "Bitonic merge sequence is complete.",
		});

		steps.forEach((step, index) => {
			step.timelineIndex = index;
		});

		return steps;
	}

	function clearPlaybackTimer() {
		if (state.playTimer !== null) {
			window.clearInterval(state.playTimer);
			state.playTimer = null;
		}
		state.isPlaying = false;
	}

	function getPlaybackDelay() {
		const speed = Number(el.speedSlider.value) || 60;
		const minDelay = 70;
		const maxDelay = 1100;
		const normalized = Math.max(1, Math.min(100, speed)) / 100;
		return Math.round(maxDelay - normalized * (maxDelay - minDelay));
	}

	function createSvgNode(tagName, attrs) {
		const node = document.createElementNS(SVG_NS, tagName);
		Object.entries(attrs).forEach(([name, value]) => {
			node.setAttribute(name, String(value));
		});
		return node;
	}

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function estimateTagWidth(text) {
		return Math.max(28, 10 + String(text).length * 7.2);
	}

	function appendValueTag(svgRoot, options) {
		const text = String(options.text);
		const width = estimateTagWidth(text);
		const height = 19;
		let x = options.x;
		if (options.anchor === "start") {
			x += width / 2;
		}
		if (options.anchor === "end") {
			x -= width / 2;
		}

		const rect = createSvgNode("rect", {
			x: x - width / 2,
			y: options.y - height / 2,
			width,
			height,
			rx: 5,
			class: options.bgClass,
		});
		svgRoot.appendChild(rect);

		const textNode = createSvgNode("text", {
			x,
			y: options.y + 4,
			"text-anchor": "middle",
			class: options.textClass,
		});
		textNode.textContent = text;
		svgRoot.appendChild(textNode);
	}

	function getTokenX(step, xStart, stageGap, xEnd) {
		if (!state.network) {
			return xStart;
		}

		if (step.type === "init") {
			return xStart - Math.min(26, stageGap * 0.35);
		}

		if (step.type === "done" || !step.comparator) {
			return xEnd;
		}

		const stage = state.network.stages[step.stageIndex] || [];
		const localProgress = stage.length > 0 ? (step.comparatorIndex + 1) / stage.length : 1;
		return xStart + (step.stageIndex + Math.max(0.05, localProgress)) * stageGap;
	}

	function getCurrentActionSummary(step) {
		if (!step || !state.network) {
			return "Build steps to begin comparator-by-comparator guidance.";
		}

		if (step.type === "init") {
			return "Network loaded: fixed data-oblivious wiring is ready. Values will flow through unchanged structure.";
		}

		if (step.type === "done") {
			return "Done: all comparator stages executed. Wiring never changed, only values and swap decisions changed.";
		}

		const dir = step.directionText || (step.comparator && step.comparator.dir === "asc" ? "ascending" : "descending");
		const left = step.comparedValues ? formatNumber(step.comparedValues.left) : "?";
		const right = step.comparedValues ? formatNumber(step.comparedValues.right) : "?";
		const swapText = step.swapped ? "swap" : "no swap";
		const blockSize = step.stageMeta ? step.stageMeta.blockSize : "?";
		const distance = step.stageMeta ? step.stageMeta.distance : "?";
		return `S${step.stageIndex + 1}: compare i=${step.comparator.i} and j=${step.comparator.j} (${left} vs ${right}) in ${dir} order -> ${swapText}. Block size ${blockSize}, distance ${distance}.`;
	}

	function renderNetwork(step) {
		while (el.svg.firstChild) {
			el.svg.removeChild(el.svg.firstChild);
		}

		el.svg.classList.toggle("is-playing", state.isPlaying);

		if (!state.network || !state.currentInput.length) {
			el.svg.appendChild(
				createSvgNode("rect", {
					x: 0,
					y: 0,
					width: 960,
					height: 560,
					fill: "rgba(8, 16, 26, 0.3)",
					stroke: "rgba(129, 167, 203, 0.4)",
					"stroke-width": 2,
					"stroke-dasharray": "8 8",
				})
			);

			const text = createSvgNode("text", {
				x: "50%",
				y: "50%",
				"text-anchor": "middle",
				"dominant-baseline": "middle",
				fill: "rgba(180, 201, 223, 0.88)",
				"font-size": 22,
				"font-weight": 560,
			});
			text.textContent = "Build steps to render the Bitonic network";
			el.svg.appendChild(text);
			return;
		}

		const n = state.network.n;
		const depth = state.network.depth;
		const width = 960;
		const height = 560;
		const top = 96;
		const bottom = 52;
		const left = 168;
		const right = 808;
		const wireGap = n > 1 ? (height - top - bottom) / (n - 1) : 0;
		const stageGap = depth > 0 ? (right - left) / depth : right - left;

		const yOf = (index) => top + wireGap * index;
		const stageIndex = step.stageIndex >= 0 ? step.stageIndex : 0;
		const currentStageMeta = step.stageMeta || state.network.stageMeta[stageIndex] || null;

		const topSummary = createSvgNode("text", {
			x: width / 2,
			y: 24,
			"text-anchor": "middle",
			class: "stage-label",
		});
		topSummary.textContent = "Fixed data-oblivious wiring: comparator layout stays constant for any input.";
		el.svg.appendChild(topSummary);

		const subtitle = createSvgNode("text", {
			x: width / 2,
			y: 44,
			"text-anchor": "middle",
			class: "stage-subtitle",
		});
		if (step.type === "compare" && currentStageMeta) {
			subtitle.textContent = `Current stage S${step.stageIndex + 1}: block size ${currentStageMeta.blockSize}, compare distance ${currentStageMeta.distance}`;
		} else if (step.type === "done") {
			subtitle.textContent = "All stages completed. Output values on the right are final and sorted.";
		} else {
			subtitle.textContent = "Build and step through to observe compare-swap actions per stage.";
		}
		el.svg.appendChild(subtitle);

		const leftCaption = createSvgNode("text", {
			x: left - 108,
			y: top - 34,
			class: "axis-caption",
		});
		leftCaption.textContent = "Input values";
		el.svg.appendChild(leftCaption);

		const rightCaption = createSvgNode("text", {
			x: right + 24,
			y: top - 34,
			class: "axis-caption",
		});
		rightCaption.textContent = step.type === "done" ? "Final output" : "Current state";
		el.svg.appendChild(rightCaption);

		for (let stageIndex = 0; stageIndex < depth; stageIndex += 1) {
			const stageX = left + stageIndex * stageGap;
			let stageBandClass = "stage-band";
			if (stageIndex === step.stageIndex) {
				stageBandClass = "stage-band current";
			} else if (step.stageIndex >= 0 && stageIndex > step.stageIndex) {
				stageBandClass = "stage-band future";
			}

			const band = createSvgNode("rect", {
				x: stageX,
				y: top - 24,
				width: stageGap,
				height: height - top - bottom + 48,
				rx: 4,
				class: stageBandClass,
			});
			el.svg.appendChild(band);

			if (stageIndex === step.stageIndex && currentStageMeta) {
				for (let blockStart = 0; blockStart < n; blockStart += currentStageMeta.blockSize) {
					const blockEnd = Math.min(n - 1, blockStart + currentStageMeta.blockSize - 1);
					const y1 = yOf(blockStart) - Math.max(8, wireGap * 0.45);
					const y2 = yOf(blockEnd) + Math.max(8, wireGap * 0.45);
					const overlay = createSvgNode("rect", {
						x: stageX + 4,
						y: y1,
						width: Math.max(8, stageGap - 8),
						height: Math.max(10, y2 - y1),
						rx: 6,
						class: blockStart / currentStageMeta.blockSize % 2 === 0 ? "group-overlay" : "group-overlay alt",
					});
					el.svg.appendChild(overlay);

					const shouldLabel =
						currentStageMeta.blockSize >= 4 ||
						n <= 8 ||
						blockStart % (currentStageMeta.blockSize * 2) === 0;

					if (shouldLabel) {
						const groupLabel = createSvgNode("text", {
							x: stageX + stageGap / 2,
							y: y1 + 11,
							class: "group-label",
							"text-anchor": "middle",
						});
						groupLabel.textContent = `Bitonic group w${blockStart}-${blockEnd}`;
						el.svg.appendChild(groupLabel);
					}
				}
			}

			const stageLabel = createSvgNode("text", {
				x: stageX + stageGap / 2,
				y: top - 37,
				class: stageIndex === step.stageIndex ? "stage-label current" : "stage-label",
				"text-anchor": "middle",
			});
			stageLabel.textContent = `S${stageIndex + 1}`;
			el.svg.appendChild(stageLabel);
		}

		for (let i = 0; i < n; i += 1) {
			const isActiveWire =
				step.comparator && (wire === step.comparator.i || wire === step.comparator.j) && step.type === "compare";

			let wireClass = "bitonic-wire";
			if (isActiveWire) {
				wireClass += " current";
			} else if (state.isPlaying && step.type === "compare") {
				wireClass += " subtle";
			}
			if (step.type === "done") {
				wireClass += " done";
			}

			const wireLine = createSvgNode("line", {
				x1: left,
				y1: yOf(wire),
				x2: right,
				y2: yOf(wire),
				class: wireClass,
			});
			el.svg.appendChild(wireLine);

			const wireLabel = createSvgNode("text", {
				x: left - 148,
				y: yOf(wire) + 4,
				class: "wire-label",
			});
			wireLabel.textContent = `i${wire}`;
			el.svg.appendChild(wireLabel);
		}

		state.network.stages.forEach((stage, stageIndex) => {
			const x = left + stageIndex * stageGap + stageGap / 2;

			stage.forEach((comparator) => {
				const isDone = comparator.globalIndex <= step.processedComparators;
				const isActive =
					step.comparator &&
					step.comparator.stageIndex === stageIndex &&
					step.comparator.i === comparator.i &&
					step.comparator.j === comparator.j;

				const comparatorClassParts = ["bitonic-comparator"];
				if (isDone) {
					comparatorClassParts.push("done");
				}
				if (isActive) {
					const glow = createSvgNode("line", {
						x1: x,
						y1: yOf(comparator.i),
						x2: x,
						y2: yOf(comparator.j),
						class: step.swapped ? "bitonic-comparator-glow swap" : "bitonic-comparator-glow",
					});
					el.svg.appendChild(glow);

					comparatorClassParts.push("active");
					if (step.swapped) {
						comparatorClassParts.push("swap");
					}
				} else if (state.isPlaying && step.type === "compare" && !isDone) {
					comparatorClassParts.push("muted");
				}

				const cmpLine = createSvgNode("line", {
					x1: x,
					y1: yOf(comparator.i),
					x2: x,
					y2: yOf(comparator.j),
					class: comparatorClassParts.join(" "),
				});
				el.svg.appendChild(cmpLine);

				const pinClassParts = ["bitonic-pin"];
				if (isActive) {
					pinClassParts.push(step.swapped ? "swap" : "active");
				}

				const topPin = createSvgNode("circle", {
					cx: x,
					cy: yOf(comparator.i),
					r: 4,
					class: pinClassParts.join(" "),
				});
				const bottomPin = createSvgNode("circle", {
					cx: x,
					cy: yOf(comparator.j),
					r: 4,
					class: pinClassParts.join(" "),
				});

				el.svg.appendChild(topPin);
				el.svg.appendChild(bottomPin);
			});
		});

		for (let i = 0; i < n; i += 1) {
			appendValueTag(el.svg, {
				x: left - 55,
				y: yOf(i),
				text: formatNumber(state.currentInput[i]),
				anchor: "middle",
				bgClass: "value-tag-bg input",
				textClass: "input-value",
			});

			appendValueTag(el.svg, {
				x: right + 55,
				y: yOf(i),
				text: formatNumber(step.array[i]),
				anchor: "middle",
				bgClass: step.type === "done" ? "value-tag-bg output done" : "value-tag-bg output",
				textClass: "output-value",
			});
		}

		const tokenX = getTokenX(step, left, stageGap, right);
		const tokenRadius = n <= 8 ? 11 : 8.8;

		for (let i = 0; i < n; i += 1) {
			const token = createSvgNode("circle", {
				cx: tokenX,
				cy: yOf(i),
				r: tokenRadius,
				class: "moving-token",
			});
			el.svg.appendChild(token);

			const tokenText = createSvgNode("text", {
				x: tokenX,
				y: yOf(i),
				class: "moving-token-text",
			});
			tokenText.textContent = formatNumber(step.array[i]);
			el.svg.appendChild(tokenText);
		}

		// Floating comparator chip removed - info now displayed in dedicated info strip above SVG
	}

	function updateHistory() {
		const completedComparisonSteps = state.steps
			.filter((step) => step.type === "compare" && step.timelineIndex <= state.stepIndex)
			.slice(-14);

		el.historyBody.textContent = "";

		if (completedComparisonSteps.length === 0) {
			const row = document.createElement("tr");
			const cell = document.createElement("td");
			cell.colSpan = 5;
			cell.textContent = "No comparator steps processed yet.";
			row.appendChild(cell);
			el.historyBody.appendChild(row);
			return;
		}

		completedComparisonSteps.forEach((step) => {
			const row = document.createElement("tr");
			row.classList.add("is-clickable");
			if (step.timelineIndex === state.stepIndex) {
				row.classList.add("is-active");
			}
			row.dataset.stepIndex = String(step.timelineIndex);

			const stepCell = document.createElement("td");
			stepCell.textContent = String(step.processedComparators);

			const stageCell = document.createElement("td");
			stageCell.textContent = `${step.stageIndex + 1}/${step.totalDepth}`;

			const pairCell = document.createElement("td");
			pairCell.textContent = `${step.comparator.i}↔${step.comparator.j} (${step.comparator.dir.toUpperCase()})`;

			const resultCell = document.createElement("td");
			resultCell.textContent = step.swapped ? "Swap" : "No swap";

			const snapshotCell = document.createElement("td");
			snapshotCell.textContent = formatArray(step.array);

			row.appendChild(stepCell);
			row.appendChild(stageCell);
			row.appendChild(pairCell);
			row.appendChild(resultCell);
			row.appendChild(snapshotCell);

			el.historyBody.appendChild(row);
		});
	}

	function updateCounters(step) {
		const network = state.network;
		if (!network) {
			el.counterN.textContent = "0";
			el.counterTotalComparators.textContent = "0";
			el.counterProcessedComparators.textContent = "0";
			el.counterTotalDepth.textContent = "0";
			el.counterSwaps.textContent = "0";
			el.counterStage.textContent = "0";
			el.stepCounter.textContent = "Step 0 / 0";
			return;
		}

		el.counterN.textContent = String(network.n);
		el.counterTotalComparators.textContent = String(network.comparatorCount);
		el.counterProcessedComparators.textContent = String(step.processedComparators);
		el.counterTotalDepth.textContent = String(network.depth);
		el.counterSwaps.textContent = String(step.swapsSoFar);
		el.counterStage.textContent = step.stageIndex >= 0 ? String(step.stageIndex + 1) : "0";
		el.stepCounter.textContent = `Step ${step.processedComparators} / ${network.comparatorCount}`;
	}

	function renderCurrentStep() {
		if (!state.steps.length) {
			renderPseudocode(0);
			el.explanation.textContent = "Build steps to begin the guided explanation.";
			updateCounters({
				processedComparators: 0,
				totalComparators: 0,
				swapsSoFar: 0,
				stageIndex: -1,
			});
			renderNetwork({
				type: "init",
				array: state.currentInput.slice(),
				stageIndex: -1,
				comparator: null,
				processedComparators: 0,
				swapped: false,
			});
			setVisualAction("Build steps to begin comparator-by-comparator guidance.");
			updateInfoStrip(null);
			updateHistory();
			return;
		}

		const step = state.steps[state.stepIndex];
		renderPseudocode(step.pseudoLine || 0);
		el.explanation.textContent = `${step.explanation} ${step.bitonicNote}`;
		updateCounters(step);
		renderNetwork(step);
		setVisualAction(getCurrentActionSummary(step));
		updateInfoStrip(step);
		updateHistory();
	}

	function goToStep(index) {
		if (!state.steps.length) {
			return;
		}

		const clamped = Math.max(0, Math.min(index, state.steps.length - 1));
		state.stepIndex = clamped;
		renderCurrentStep();

		if (state.stepIndex >= state.steps.length - 1 && !state.isPlaying) {
			setStatus("Done", "All comparators have executed. Output is fully sorted.");
		}
	}

	function buildFromCurrentInput() {
		clearPlaybackTimer();

		const parsed = parseInput(el.customInput.value);
		if (!parsed.ok) {
			state.steps = [];
			state.network = null;
			state.stepIndex = 0;
			setStatus("Input Error", parsed.error);
			renderCurrentStep();
			return false;
		}

		const input = parsed.values;
		const network = generateBitonicNetwork(input.length);
		const steps = buildSteps(input, network);

		state.currentInput = input.slice();
		state.network = network;
		state.steps = steps;
		state.stepIndex = 0;

		updateComparisonCard(input.length, network);
		setStatus(
			"Ready",
			`Built fixed network for n=${input.length}. Complexity: O(n log^2 n) comparators and O(log^2 n) depth.`
		);
		renderCurrentStep();
		return true;
	}

	function stepForward() {
		if (!state.steps.length) {
			return false;
		}

		if (state.stepIndex >= state.steps.length - 1) {
			return false;
		}

		state.stepIndex += 1;
		renderCurrentStep();
		return true;
	}

	function play() {
		if (state.isPlaying) {
			return;
		}

		if (!state.steps.length) {
			const built = buildFromCurrentInput();
			if (!built) {
				return;
			}
		}

		if (state.stepIndex >= state.steps.length - 1) {
			setStatus("Done", "Already at final step. Reset or edit input to run again.");
			return;
		}

		setStatus("Playing", "Animating fixed comparator schedule stage by stage.");
		state.isPlaying = true;
		renderCurrentStep();
		state.playTimer = window.setInterval(() => {
			const advanced = stepForward();
			if (!advanced) {
				clearPlaybackTimer();
				setStatus("Done", "All comparator stages completed.");
				renderCurrentStep();
			}
		}, getPlaybackDelay());
	}

	function pause() {
		if (!state.isPlaying) {
			return;
		}
		clearPlaybackTimer();
		setStatus("Paused", "Playback paused. Use Step or Play to continue.");
		renderCurrentStep();
	}

	function reset() {
		clearPlaybackTimer();

		if (!state.steps.length) {
			setStatus("Idle", "Enter values and build a network to begin.");
			renderCurrentStep();
			return;
		}

		state.stepIndex = 0;
		setStatus("Idle", "Reset to initial input state. Wiring remains fixed for this n.");
		renderCurrentStep();
	}

	function runNetwork(values, network) {
		const arr = values.slice();
		network.stages.forEach((stage) => {
			stage.forEach((comparator) => {
				const left = arr[comparator.i];
				const right = arr[comparator.j];
				const swap = comparator.dir === "asc" ? left > right : left < right;
				if (swap) {
					arr[comparator.i] = right;
					arr[comparator.j] = left;
				}
			});
		});
		return arr;
	}

	function isSortedAscending(values) {
		for (let i = 1; i < values.length; i += 1) {
			if (values[i - 1] > values[i]) {
				return false;
			}
		}
		return true;
	}

	function runZeroOnePrincipleTest() {
		clearPlaybackTimer();
		const n = Number(el.zeroOneSize.value);

		if (!isPowerOfTwo(n) || n <= 0) {
			el.zeroOneResult.textContent = "Invalid 0-1 test size.";
			return;
		}

		const network = generateBitonicNetwork(n);
		const total = 2 ** n;
		let passed = 0;
		let failed = 0;
		let firstFail = null;

		for (let mask = 0; mask < total; mask += 1) {
			const input = [];
			for (let bit = n - 1; bit >= 0; bit -= 1) {
				input.push((mask >> bit) & 1);
			}

			const output = runNetwork(input, network);
			if (isSortedAscending(output)) {
				passed += 1;
			} else {
				failed += 1;
				if (!firstFail) {
					firstFail = { input, output };
				}
			}
		}

		const summary = [`Tested ${total} binary inputs for n=${n}. Passed: ${passed}. Failed: ${failed}.`];
		if (firstFail) {
			summary.push(`First failing input ${formatArray(firstFail.input)} -> ${formatArray(firstFail.output)}.`);
		} else {
			summary.push(
				"All binary cases sorted. By the 0-1 Principle, this fixed network also sorts all real-valued inputs of this size."
			);
		}

		el.zeroOneResult.textContent = summary.join(" ");
		setStatus("Ready", "0-1 Principle test completed.");
	}

	function shuffle(values) {
		const arr = values.slice();
		for (let i = arr.length - 1; i > 0; i -= 1) {
			const j = Math.floor(Math.random() * (i + 1));
			const tmp = arr[i];
			arr[i] = arr[j];
			arr[j] = tmp;
		}
		return arr;
	}

	function updateWorstCaseExplanation(presetKey) {
		if (presetKey === "worstCase") {
			el.worstCaseExplanation.textContent =
				"Worst-case preset selected: values are arranged to trigger many corrective swaps across stages. Notice every comparator is still executed, because sorting networks are fixed and data-oblivious by design.";
			return;
		}

		el.worstCaseExplanation.textContent =
			"Choose the worst-case preset to see that all comparators still run in the same order; only swap outcomes change with the data.";
	}

	function applyPreset(presetKey) {
		clearPlaybackTimer();

		let presetValues = null;
		let note = "";
		if (presetKey === "random") {
			presetValues = shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
			note = "Random preset generated for n=8.";
		} else if (PRESETS[presetKey]) {
			presetValues = PRESETS[presetKey].values.slice();
			note = PRESETS[presetKey].note;
			state.selectedPreset = presetKey;
		}

		if (!presetValues) {
			return;
		}

		el.customInput.value = presetValues.join(", ");
		updateWorstCaseExplanation(presetKey);
		setStatus("Idle", `${note} Build steps to generate the fixed network and animation timeline.`);
	}

	function attachEvents() {
		el.buildBtn.addEventListener("click", () => {
			buildFromCurrentInput();
		});

		el.stepBtn.addEventListener("click", () => {
			clearPlaybackTimer();

			if (!state.steps.length) {
				const built = buildFromCurrentInput();
				if (!built) {
					return;
				}
			}

			const advanced = stepForward();
			if (!advanced) {
				setStatus("Done", "No more steps. Reset or edit input to run again.");
			} else {
				setStatus("Ready", "Stepped forward one comparator.");
			}
		});

		el.playBtn.addEventListener("click", () => {
			play();
		});

		el.pauseBtn.addEventListener("click", () => {
			pause();
		});

		el.resetBtn.addEventListener("click", () => {
			reset();
		});

		el.speedSlider.addEventListener("input", () => {
			if (state.isPlaying) {
				clearPlaybackTimer();
				play();
			}
		});

		if (el.presetBalanced) {
			el.presetBalanced.addEventListener("click", () => applyPreset("balanced"));
		}
		if (el.presetNearlySorted) {
			el.presetNearlySorted.addEventListener("click", () => applyPreset("nearlySorted"));
		}
		if (el.presetReverse) {
			el.presetReverse.addEventListener("click", () => applyPreset("reverse"));
		}
		if (el.presetZeroOne) {
			el.presetZeroOne.addEventListener("click", () => applyPreset("zeroOne"));
		}
		if (el.presetWorst) {
			el.presetWorst.addEventListener("click", () => applyPreset("worstCase"));
		}
		if (el.presetRandom) {
			el.presetRandom.addEventListener("click", () => applyPreset("random"));
		}

		el.zeroOneRun.addEventListener("click", () => {
			runZeroOnePrincipleTest();
		});

		el.historyBody.addEventListener("click", (event) => {
			const row = event.target.closest("tr[data-step-index]");
			if (!row) {
				return;
			}
			const targetIndex = Number(row.dataset.stepIndex);
			if (Number.isFinite(targetIndex)) {
				clearPlaybackTimer();
				goToStep(targetIndex);
				setStatus("Paused", "Jumped to a selected history step.");
			}
		});
	}

	function initialize() {
		renderPseudocode(0);
		state.currentInput = PRESETS.balanced.values.slice();
		el.customInput.value = state.currentInput.join(", ");
		updateWorstCaseExplanation(state.selectedPreset);
		updateComparisonCard(state.currentInput.length, generateBitonicNetwork(state.currentInput.length));
		setStatus("Idle", "Enter 4, 8, or 16 comma-separated values, then build steps.");
		attachEvents();
		renderCurrentStep();
	}

	initialize();
});
